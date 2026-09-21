import cv2
import numpy as np

img = cv2.imread('tryon_platform/media/tryon/person/gemini_output.png')
h, w, _ = img.shape

# Crop bottom right 200x200
corner = img[h-200:h, w-200:w]
gray = cv2.cvtColor(corner, cv2.COLOR_BGR2GRAY)

# Find coordinates of brightest pixels
y_coords, x_coords = np.where(gray > 165)
if len(y_coords) > 0:
    min_x, max_x = np.min(x_coords), np.max(x_coords)
    min_y, max_y = np.min(y_coords), np.max(y_coords)
    
    # Coordinates in the full image
    full_min_x = (w - 200) + min_x
    full_max_x = (w - 200) + max_x
    full_min_y = (h - 200) + min_y
    full_max_y = (h - 200) + max_y
    
    print(f"Star bounding box: x={full_min_x} to {full_max_x}, y={full_min_y} to {full_max_y}")
    print(f"Width={full_max_x - full_min_x}, Height={full_max_y - full_min_y}")
    print(f"Distance from right: {w - full_max_x}, Distance from bottom: {h - full_max_y}")
else:
    print("No bright pixels found.")
