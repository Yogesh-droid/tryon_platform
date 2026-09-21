import cv2
import numpy as np

# Load the image
img = cv2.imread('tryon_platform/media/tryon/result/f1e13851-330e-44fb-876b-f39b31b03c7c.png')
h, w, _ = img.shape

# Define the region of interest (ROI) - bottom right 100x100
roi = img[h-100:h, w-100:w]

# The watermark is bright. Let's create a mask of bright pixels in the ROI.
# Convert to grayscale
gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
# Threshold: pixels > 140 are considered part of the watermark
_, mask_roi = cv2.threshold(gray, 120, 255, cv2.THRESH_BINARY)

# Dilate the mask slightly to ensure we cover the soft edges of the star
kernel = np.ones((5,5), np.uint8)
mask_roi = cv2.dilate(mask_roi, kernel, iterations=1)

# Create a full-size mask (all zeros)
full_mask = np.zeros((h, w), dtype=np.uint8)
# Put the ROI mask into the full mask
full_mask[h-100:h, w-100:w] = mask_roi

# Inpaint
result = cv2.inpaint(img, full_mask, inpaintRadius=3, flags=cv2.INPAINT_TELEA)

cv2.imwrite('tryon_platform/media/tryon/result/test_inpainted.png', result)
cv2.imwrite('tryon_platform/media/tryon/result/test_mask.png', full_mask)
print("Inpainted saved.")
