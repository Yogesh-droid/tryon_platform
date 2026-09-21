import cv2
import numpy as np
img = cv2.imread('tryon_platform/media/tryon/result/f1e13851-330e-44fb-876b-f39b31b03c7c.png')
h, w, _ = img.shape
mask = np.zeros((h, w), dtype=np.uint8)
# Just mask the bottom right 60x60 completely
mask[h-60:h, w-60:w] = 255
inpainted = cv2.inpaint(img, mask, 3, cv2.INPAINT_TELEA)
cv2.imwrite('tryon_platform/media/tryon/result/test_fixed_inpaint.png', inpainted)
print("Saved.")
