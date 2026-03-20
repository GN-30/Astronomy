import requests
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

# Test v1beta endpoints
models = [
    ("v1beta", "gemini-1.5-flash-002"),
    ("v1beta", "gemini-2.0-flash-001"),
    ("v1", "gemini-2.0-flash-001"),
]

for version, model in models:
    url = f"https://generativelanguage.googleapis.com/{version}/models/{model}:generateContent?key={api_key}"
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
    
    print(f"\n[{version}] Model: {model}")
    print(f"Status: {response.status_code}")
    if response.status_code != 200:
        try:
            error = response.json()
            if 'error' in error:
                msg = error['error'].get('message', str(error['error']))
                print(f"Error: {msg[:120]}...")
        except:
            print(f"Error: {response.text[:120]}...")
    else:
        print("✅ SUCCESS!")
