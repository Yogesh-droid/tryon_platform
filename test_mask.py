import cv2
import numpy as np

img = cv2.imread('tryon_platform/media/tryon/person/gemini_output.png')
if img is None:
    print("Image not found")
    exit()

h, w, _ = img.shape

# The star is usually in the bottom right quadrant.
# Let's crop the bottom right 200x200
corner = img[h-200:h, w-200:w]

# Let's try to detect the star using a simple color threshold or edge detection.
# The star is light colored.
gray = cv2.cvtColor(corner, cv2.COLOR_BGR2GRAY)

# Apply a threshold to find the brightest pixels
_, mask = cv2.threshold(gray, 140, 255, cv2.THRESH_BINARY)

cv2.imwrite('tryon_platform/media/tryon/result/corner_mask.png', mask)
print("Mask saved.")
