from PIL import Image
img = Image.open('tryon_platform/media/tryon/result/f1e13851-330e-44fb-876b-f39b31b03c7c.png')
w, h = img.size
patch = img.crop((w-90, h-180, w, h-90))
img.paste(patch, (w-90, h-90))
img.save('tryon_platform/media/tryon/result/test_patched.png')
print("Patched saved.")
