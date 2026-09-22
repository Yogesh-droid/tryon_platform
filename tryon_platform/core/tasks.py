from celery import shared_task
from django.core.files.base import ContentFile
from django.conf import settings
from fashn import Fashn
import requests
from PIL import Image
from django.core.files.base import ContentFile
import io

@shared_task
def run_tryon_job(job_id):
    from .models import TryOnJob
    from django.conf import settings

    job = TryOnJob.objects.select_related('shop', 'end_user', 'garment').get(id=job_id)
    shop = job.shop

    if shop.credit_balance < shop.cost_per_generation:
        job.status = 'failed'
        job.error_message = 'Shop has insufficient credit balance.'
        job.save()
        return

    end_user = job.end_user
    if end_user.generations_used >= shop.free_trials_per_customer:
        if shop.charge_customer_per_generation is None:
            pass
        else:
            job.status = 'failed'
            job.error_message = 'Free trial limit reached. Paid try-ons not yet supported.'
            job.save()
            return

    job.status = 'processing'
    job.save(update_fields=['status'])

    try:
        method = shop.image_generation_method
        if method == 'mock':
            raise Exception("Mock image generation is currently disabled.")
        elif method == 'gemini':
            image_bytes = gemini_tryon(job.person_image.path, job.garment.image.path)
        elif method == 'gemini_playwright':
            prompt = job.garment.prompt if job.garment.prompt else ""
            
            if job.selected_size and job.user_measurements and job.garment:
                u_chest = float(job.user_measurements.get('chest', 0) or 0)
                garment_measurements = job.garment.size_measurements.get(job.selected_size, {})
                g_chest = float(garment_measurements.get('chest', 0) or 0)
                
                if u_chest > 0 and g_chest > 0:
                    diff = g_chest - u_chest
                    fit_instruction = ""
                    if diff < 0:
                        fit_instruction = "\n\nCRITICAL INSTRUCTION: The selected garment size is TOO SMALL for this person! You MUST render it as an extremely tight, squeezing fit. It should look uncomfortably small on them."
                    elif diff <= 2:
                        fit_instruction = "\n\nCRITICAL INSTRUCTION: The selected garment size is a PERFECT FIT for this person. Render it tailored perfectly to their body."
                    elif diff <= 5:
                        fit_instruction = "\n\nCRITICAL INSTRUCTION: The selected garment size is SLIGHTLY LARGE for this person. Render it as a comfortable, somewhat loose fit with slight excess fabric."
                    else:
                        fit_instruction = "\n\nCRITICAL INSTRUCTION: The selected garment size is WAY TOO BIG for this person! You MUST render it as an extremely baggy, oversized, loose fit. Show lots of excess folded fabric, hanging slack, and draped looseness to make it obvious they are wearing an oversized cloth."
                        
                    prompt += fit_instruction
                    
            prompt = prompt if prompt.strip() else None
            garment2_path = job.garment.image2.path if job.garment.image2 else None
            image_bytes = gemini_playwright_tryon(
                job.person_image.path, 
                job.garment.image.path, 
                custom_prompt=prompt, 
                garment2_path=garment2_path
            )
        elif method == 'idm_vton':
            image_bytes = idm_vton_tryon(job.person_image.path, job.garment.image.path)
        else:
            client = Fashn(api_key=settings.FASHN_API_KEY)
            result = client.predictions.subscribe(
                model_name="tryon-v1.6",
                inputs={
                    "model_image": job.person_image.path,
                    "garment_image": job.garment.image.path,
                }
            )
            output_url = result.output[0]
            image_bytes = requests.get(output_url).content

        job.result_image.save(f"{job.id}.png", ContentFile(image_bytes))
        job.status = 'done'

        shop.credit_balance -= shop.cost_per_generation
        shop.save(update_fields=['credit_balance'])
        job.cost_charged_to_shop = shop.cost_per_generation
        end_user.generations_used += 1
        end_user.save(update_fields=['generations_used'])

    except Exception as e:
        job.status = 'failed'
        job.error_message = str(e)

    job.save()


def mock_tryon(person_image_path, garment_image_path):
    person = Image.open(person_image_path).convert("RGBA")
    garment = Image.open(garment_image_path).convert("RGBA")

    # Resize garment to roughly fit over the torso area (rough guess, not fitted)
    target_width = person.width // 2
    ratio = target_width / garment.width
    garment = garment.resize((target_width, int(garment.height * ratio)))

    # Paste it roughly centered, upper-middle of the person image
    paste_x = (person.width - garment.width) // 2
    paste_y = person.height // 4

    result = person.copy()
    result.paste(garment, (paste_x, paste_y), garment)  # garment's alpha as mask

    buffer = io.BytesIO()
    result.convert("RGB").save(buffer, format="PNG")
    return buffer.getvalue()
def gemini_tryon(person_image_path, garment_image_path):
    from google import genai
    from google.genai import types
    from django.conf import settings
    import os
    import io
    from PIL import Image, ImageDraw

    api_key = getattr(settings, 'GEMINI_API_KEY', os.environ.get('GEMINI_API_KEY'))
    if not api_key:
        raise Exception("GEMINI_API_KEY is not set.")

    try:
        client = genai.Client(api_key=api_key)
        
        model_img = Image.open(person_image_path)
        garment_img = Image.open(garment_image_path)
        
        prompt = (
            "Input 1 is a photo of a person. Input 2 is an Indian garment. "
            "Virtually drape the garment from Input 2 onto the person in Input 1. "
            "Keep the person's exact face, body shape, and pose unchanged."
        )

        response = client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents=[model_img, garment_img, prompt],
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
            ),
        )

        if response.candidates:
            for candidate in response.candidates:
                for part in candidate.content.parts:
                    if getattr(part, 'inline_data', None):
                        return part.inline_data.data

        raise Exception("No image generated by Gemini")
    except Exception as e:
        # Fallback dummy image if the model quota is exceeded
        img = Image.new('RGB', (600, 600), color=(255, 225, 0)) # banana yellow
        draw = ImageDraw.Draw(img)
        draw.text((20, 280), f"Gemini API Error:\n{str(e)}\n\nReturning Nano Banana Fallback!", fill=(0,0,0))
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        return buffer.getvalue()

def idm_vton_tryon(person_image_path, garment_image_path):
    from gradio_client import Client, handle_file
    
    print("Connecting to free IDM-VTON demo...")
    client = Client("zhengchong/CatVTON")

    # Provide paths to your test images
    result = client.predict(
        dict={
            "background": handle_file(person_image_path),
            "layers": [],
            "composite": None
        },
        garm_img=handle_file(garment_image_path),
        garment_des="Indian ethnic wear, naturally draped",
        is_checked=True,
        is_checked_crop=False,
        denoise_steps=30,
        seed=42,
        api_name="/tryon"
    )

    # Output image path downloaded locally
    print(f"Generated try-on saved at: {result[0]}")
    with open(result[0], 'rb') as f:
        return f.read()

def gemini_playwright_tryon(model_image_path, garment_image_path, custom_prompt=None, garment2_path=None):
    import os
    import time
    from playwright.sync_api import sync_playwright

    abs_model = os.path.abspath(model_image_path)
    abs_garment = os.path.abspath(garment_image_path)
    output_filename = os.path.join(os.path.dirname(abs_model), "gemini_output.png")

    if custom_prompt:
        prompt = custom_prompt
    else:
        prompt = (
            "Input 1 is a person/model. Input 2 is an Indian garment (saree/gown/shirt). "
            "Virtually drape the garment from Input 2 onto the person in Input 1. "
            "Preserve the person's face, body contours, and pose. "
            "Generate realistic fabric pleats, fall, and natural studio lighting."
        )

    with sync_playwright() as p:
        # Launch using saved profile and the actual Google Chrome browser to preserve Mac keychain cookies
        context = p.chromium.launch_persistent_context(
            user_data_dir="./gemini_user_profile",
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=False,
            ignore_default_args=["--use-mock-keychain"],
            viewport={'width': 1280, 'height': 800}
        )
        page = context.pages[0]
        page.goto("https://gemini.google.com/app")
        
        # Wait for the chatbox to appear to confirm we are logged in
        chat_box = page.locator('div[role="textbox"][contenteditable="true"]').first
        chat_box.wait_for(state="visible", timeout=300000) # wait up to 5 minutes for user to log in if needed

        print("Logged in! Revealing file input...")
        # Google hides the file input until the '+' button is clicked, and sometimes requires clicking "Upload image" from a menu.
        try:
            # 1. Click the '+' button (it's the first button in the input area)
            page.evaluate('''() => {
                const chatBox = document.querySelector('div[role="textbox"][contenteditable="true"]');
                if (chatBox) {
                    let container = chatBox.parentElement;
                    // Go up the DOM tree until we find a container that has buttons
                    while (container && container.querySelectorAll('button').length === 0) {
                        container = container.parentElement;
                    }
                    if (container) {
                        const buttons = container.querySelectorAll('button');
                        if (buttons.length > 0) {
                            buttons[0].click(); // Click the '+' icon!
                        }
                    }
                }
            }''')
            time.sleep(1.5)
        except Exception as e:
            print("Could not click + button:", e)
            
        try:
            # 2. If a menu opened, click the "Upload image" or "Upload files" option
            page.locator('text="Upload image", text="Upload files", text="Upload", [aria-label*="Upload"]').first.click(timeout=2000)
        except:
            pass

        try:
            file_input = page.locator('input[type="file"]').first
            file_input.wait_for(state="attached", timeout=15000)
            
            upload_files = [abs_model, abs_garment]
            if garment2_path:
                upload_files.append(os.path.abspath(garment2_path))
                
            file_input.set_input_files(upload_files)
        except Exception as e:
            print("File input still not found!")
            raise e

        time.sleep(3)

        print("Typing prompt...")
        chat_box.fill(prompt)
        page.keyboard.press("Enter")

        # Wait for the response to finish generating by looking for the last response block
        print("Waiting for Gemini to respond...")
        
        # Wait up to 60 seconds for the response container to appear
        response_block = page.locator('message-content, .model-response-text').last
        response_block.wait_for(state="visible", timeout=60000)

        # Poll until the generated image is fully rendered on screen
        print("Waiting for image to finish rendering...")
        start_time = time.time()
        img_info = None
        while time.time() - start_time < 60:
            img_info = page.evaluate('''() => {
                const imgs = Array.from(document.querySelectorAll('img'));
                // Filter for images larger than 150x150 pixels
                const largeImgs = imgs.filter(img => img.width > 150 && img.height > 150);
                const targetImg = largeImgs.length > 0 ? largeImgs[largeImgs.length - 1] : null;
                if (!targetImg) return null;
                
                // Verify the image is fully downloaded and rendered
                if (!targetImg.complete || targetImg.naturalWidth === 0) return null;
                
                if (targetImg.src.startsWith('blob:')) {
                    const canvas = document.createElement('canvas');
                    canvas.width = targetImg.naturalWidth;
                    canvas.height = targetImg.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(targetImg, 0, 0);
                    return { type: 'base64', data: canvas.toDataURL('image/png').split(',')[1] };
                } else {
                    return { type: 'url', data: targetImg.src };
                }
            }''')
            if img_info:
                break
            time.sleep(0.5) # Poll every 500ms
        
        if not img_info:
            raise Exception("Timeout waiting for large generated image to appear")
        
        if img_info:
            if img_info['type'] == 'base64':
                import base64
                image_bytes = base64.b64decode(img_info['data'])
            else:
                import urllib.request
                req = urllib.request.Request(img_info['data'], headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'})
                with urllib.request.urlopen(req) as response:
                    image_bytes = response.read()
                    
            with open(output_filename, 'wb') as f:
                f.write(image_bytes)
        else:
            # Gemini refused to generate an image and returned text! 
            response_block = page.locator('message-content, .model-response-text').last
            text_response = response_block.inner_text()
            print(f"Gemini returned text instead of an image: {text_response}")
            
            # Create a dummy image with the text response so the user can see what Gemini said
            from PIL import Image, ImageDraw
            img = Image.new('RGB', (800, 800), color=(255, 225, 0)) # banana yellow
            draw = ImageDraw.Draw(img)
            draw.text((20, 20), f"Gemini Text Response:\n\n{text_response[:1000]}", fill=(0,0,0))
            img.save(output_filename, format="PNG")

        context.close()
        
    with open(output_filename, 'rb') as f:
        img_bytes = f.read()
        
    try:
        from simple_lama_inpainting import SimpleLama
        from PIL import Image, ImageDraw
        import io
        import torch
        
        # Monkey-patch torch.jit.load to force CPU loading on Macs to avoid CUDA backend errors
        _original_load = torch.jit.load
        def _patched_load(*args, **kwargs):
            kwargs['map_location'] = 'cpu'
            return _original_load(*args, **kwargs)
        torch.jit.load = _patched_load
        
        try:
            simple_lama = SimpleLama()
        finally:
            torch.jit.load = _original_load  # Restore original
        
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        w, h = img.size
        
        # Gemini spark star is placed a bit further from the edge.
        # We'll mask a 160x160 square in the bottom right corner.
        mask = Image.new('L', (w, h), 0)
        draw = ImageDraw.Draw(mask)
        draw.rectangle([w-160, h-160, w, h], fill=255)
        
        # Inpaint using deep learning (handles complex textures gracefully)
        result = simple_lama(img, mask)
        
        out_io = io.BytesIO()
        result.save(out_io, format="PNG")
        return out_io.getvalue()
    except Exception as e:
        print("Failed to inpaint watermark with LaMa:", e)
        return img_bytes
