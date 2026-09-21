from PIL import Image, ImageChops
import numpy as np

img1 = Image.open('tryon_platform/media/tryon/person/gemini_output.png').convert("RGB")
img2 = Image.open('tryon_platform/media/tryon/result/test_lama_mac_out_large.png').convert("RGB")

diff = ImageChops.difference(img1, img2)
diff_np = np.array(diff)
gray_diff = np.mean(diff_np, axis=2)

y_coords, x_coords = np.where(gray_diff > 30)
if len(y_coords) > 0:
    print(f"Differences found!")
    print(f"X range: {np.min(x_coords)} to {np.max(x_coords)}")
    print(f"Y range: {np.min(y_coords)} to {np.max(y_coords)}")
    w, h = img1.size
    print(f"Distance from right: {w - np.max(x_coords)}")
    print(f"Distance from bottom: {h - np.max(y_coords)}")
else:
    print("No differences found.")
