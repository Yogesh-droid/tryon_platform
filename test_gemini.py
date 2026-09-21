import os
import sys

with open('/Users/yogeshkumar/Desktop/tryon_platform/.env') as f:
    for line in f:
        if line.startswith('GEMINI_API_KEY'):
            os.environ['GEMINI_API_KEY'] = line.strip().split('=')[1]

from google import genai
client = genai.Client()
try:
    response = client.models.generate_content(
        model='gemini-3.6-flash',
        contents="Please write an SVG code for a yellow banana. Only output the raw SVG code and nothing else. No markdown."
    )
    svg_code = response.text.strip()
    print("Generated SVG:", svg_code[:100])
except Exception as e:
    print(f"Error: {e}")
