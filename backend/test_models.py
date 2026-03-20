import requests
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

# Test different models
models = [
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-pro",
]

for model in models:
    url = f"https://generativelanguage.googleapis.com/v1/models/{model}:generateContent?key={api_key}"
    payload = {
        "contents": [{
            "parts": [{"text": "test"}]
        }]
    }
    
    response = requests.post(
        url,
        json=payload,
        headers={'Content-Type': 'application/json'},
        timeout=10
    )
    
    print(f"\nModel: {model}")
    print(f"Status: {response.status_code}")
    if response.status_code != 200:
        try:
            error = response.json()
            if 'error' in error:
                msg = error['error'].get('message', str(error['error']))
                print(f"Error: {msg[:150]}...")
        except:
            print(f"Error: {response.text[:150]}...")
    else:
        print("✅ SUCCESS!")
