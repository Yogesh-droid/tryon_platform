import os
import sys

with open('/Users/yogeshkumar/Desktop/tryon_platform/.env') as f:
    for line in f:
        if line.startswith('GEMINI_API_KEY'):
            os.environ['GEMINI_API_KEY'] = line.strip().split('=')[1]

from google import genai
from google.genai import types

client = genai.Client()
try:
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents="return images using gemini nano banana"
    )
    print(response.text)
except Exception as e:
    print(e)
