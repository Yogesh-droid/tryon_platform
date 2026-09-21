from simple_lama_inpainting import SimpleLama
from PIL import Image
import numpy as np

try:
    simple_lama = SimpleLama()
    
    img = Image.open('tryon_platform/media/tryon/person/gemini_output.png').convert("RGB")
    w, h = img.size
    
    # The spark star in Gemini images is usually anchored 16px from right and 16px from bottom
    # It is roughly 40x40 pixels. Let's make a generous 80x80 mask in the bottom right.
    mask = Image.new('L', (w, h), 0)
    # Paste a white square in the bottom right 80x80
    from PIL import ImageDraw
    d = ImageDraw.Draw(mask)
    # Let's check exactly where the star is. In the image I just saw, it's about 20px from right and bottom.
    d.rectangle([w-80, h-80, w, h], fill=255)
    
    result = simple_lama(img, mask)
    result.save('tryon_platform/media/tryon/result/test_lama_out.png')
    print("LaMa inpainting successful.")
except Exception as e:
    print(f"Error: {e}")
