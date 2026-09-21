import torch
from simple_lama_inpainting import SimpleLama
from PIL import Image, ImageDraw
import numpy as np

# Monkey-patch torch.jit.load
_original_load = torch.jit.load
def _patched_load(*args, **kwargs):
    kwargs['map_location'] = 'cpu'
    return _original_load(*args, **kwargs)
torch.jit.load = _patched_load

try:
    simple_lama = SimpleLama()
    
    img = Image.open('tryon_platform/media/tryon/person/gemini_output.png').convert("RGB")
    w, h = img.size
    mask = Image.new('L', (w, h), 0)
    draw = ImageDraw.Draw(mask)
    draw.rectangle([w-250, h-250, w, h], fill=255)
    
    result = simple_lama(img, mask)
    result.save('tryon_platform/media/tryon/result/test_lama_mac_out_large.png')
    print("LaMa inpainting on Mac CPU successful.")
except Exception as e:
    print(f"Error: {e}")
finally:
    torch.jit.load = _original_load
