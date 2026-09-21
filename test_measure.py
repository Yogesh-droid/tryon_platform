from PIL import Image
img = Image.open('tryon_platform/media/tryon/person/gemini_output.png')
# let's crop the star region and save it to see exactly where it is
w, h = img.size
# crop 200x200 from bottom right
corner = img.crop((w-200, h-200, w, h))
corner.save('tryon_platform/media/tryon/result/measure_corner.png')
print("Corner saved.")
