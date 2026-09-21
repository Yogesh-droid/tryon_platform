from PIL import Image
img = Image.open('tryon_platform/media/tryon/result/f1e13851-330e-44fb-876b-f39b31b03c7c.png')
w, h = img.size
print(f"Original size: {w}x{h}")
# Crop 50 pixels from right and bottom
cropped = img.crop((0, 0, w - 60, h - 60))
cropped.save('tryon_platform/media/tryon/result/test_cropped.png')
print("Cropped saved.")
