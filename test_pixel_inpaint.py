import cv2
img = cv2.imread('tryon_platform/media/tryon/result/test_inpainted.png')
h, w, _ = img.shape
corner = img[h-100:h, w-100:w]
gray = cv2.cvtColor(corner, cv2.COLOR_BGR2GRAY)
print(f"Max brightness: {gray.max()}")
