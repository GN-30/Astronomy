import requests
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

response = requests.get(url)
print(f"Status: {response.status_code}")
print(f"Response:\n{response.text}")

if response.status_code == 200:
    data = response.json()
    print("\n\nAvailable Models:")
    for model in data.get('models', []):
        print(f"  - {model['name']}")
        if 'supportedGenerationMethods' in model:
            print(f"    Methods: {model['supportedGenerationMethods']}")
