from PIL import Image
import io
import traceback

def mock_tryon(person_image_path, garment_image_path):
    person = Image.open(person_image_path).convert("RGBA")
    garment = Image.open(garment_image_path).convert("RGBA")

    target_width = person.width // 2
    ratio = target_width / garment.width
    garment = garment.resize((target_width, int(garment.height * ratio)))

    paste_x = (person.width - garment.width) // 2
    paste_y = person.height // 4

    result = person.copy()
    result.paste(garment, (paste_x, paste_y), garment)

    buffer = io.BytesIO()
    result.convert("RGB").save(buffer, format="PNG")
    return buffer.getvalue()

try:
    img1 = Image.new('RGB', (100, 100), color = 'red')
    img1.save('test1.png')
    img2 = Image.new('RGB', (100, 100), color = 'blue')
    img2.save('test2.png')
    
    mock_tryon('test1.png', 'test2.png')
    print("Mock tryon successful!")
except Exception as e:
    print("Mock tryon error:")
    traceback.print_exc()
