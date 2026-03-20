import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("ERROR: No API key found!")
    exit(1)

# Try listing models
url = f"https://generativelanguage.googleapis.com/v1/models?key={api_key}"
print(f"Testing with v1 (not v1beta)...\n")

try:
    response = requests.get(url, timeout=10)
    print(f"Status: {response.status_code}\n")
    
    if response.status_code == 200:
        data = response.json()
        print("Available Models for generateContent:\n")
        
        for model in data.get('models', []):
            model_name = model['name'].split('/')[-1]  # Extract just the model name
            supported_methods = model.get('supportedGenerationMethods', [])
            
            # Filter for image/vision capable models
            if 'generateContent' in supported_methods:
                print(f"✓ {model_name}")
                print(f"  Supported methods: {supported_methods}")
                print()
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Exception: {e}")
