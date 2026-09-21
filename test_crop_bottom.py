from PIL import Image
img = Image.open('tryon_platform/media/tryon/result/f1e13851-330e-44fb-876b-f39b31b03c7c.png')
w, h = img.size
cropped = img.crop((0, 0, w - 80, h - 80)) # crop 80px from right and bottom
cropped.save('tryon_platform/media/tryon/result/test_bottom.png')
print("Cropped saved.")
