from PIL import Image
img = Image.open('tryon_platform/media/tryon/person/gemini_output.png')
w, h = img.size
corner = img.crop((w-100, h-100, w, h))
print(f"Extrema: {corner.convert('L').getextrema()}")
