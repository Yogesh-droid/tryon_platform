import os
import sys

with open('/Users/yogeshkumar/Desktop/tryon_platform/tryon_platform/.env') as f:
    for line in f:
        if line.startswith('GEMINI_API_KEY'):
            os.environ['GEMINI_API_KEY'] = line.strip().split('=')[1]

from google import genai
from google.genai import types
from PIL import Image

client = genai.Client()
img1 = Image.new('RGB', (100, 100), color='red')
img2 = Image.new('RGB', (100, 100), color='blue')

try:
    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=[img1, img2, "Draw a banana"],
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE"],
        ),
    )
    print("Response type:", type(response))
    if hasattr(response, 'candidates') and len(response.candidates) > 0:
        part = response.candidates[0].content.parts[0]
        if hasattr(part, 'inline_data') and part.inline_data:
            print("Got inline_data, length:", len(part.inline_data.data))
        else:
            print("Part dict:", dir(part))
    elif hasattr(response, 'generated_images'):
        print("Got generated_images")
    else:
        print(dir(response))
except Exception as e:
    print(f"Error: {e}")
