from PIL import Image
img = Image.open('tryon_platform/media/tryon/result/f1e13851-330e-44fb-876b-f39b31b03c7c.png')
w, h = img.size
corner = img.crop((w-100, h-100, w, h))
extrema = corner.convert("L").getextrema()
print(f"Extrema in corner: {extrema}")
