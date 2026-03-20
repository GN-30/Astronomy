import requests
import json
from PIL import Image
import io

# Create a simple test image (100x100 red square)
img = Image.new('RGB', (100, 100), color='red')
img_bytes = io.BytesIO()
img.save(img_bytes, format='PNG')
img_bytes.seek(0)

url = "http://localhost:8000/api/astrology/analyze_image"
files = {'file': ('test_chart.png', img_bytes, 'image/png')}

try:
    response = requests.post(url, files=files)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text[:500]}")  # Print first 500 chars
    if response.status_code == 200:
        print("Success! Response:")
        print(json.dumps(response.json(), indent=2))
    else:
        print("Error Response:")
        print(response.text)
except Exception as e:
    print(f"Error: {e}")
