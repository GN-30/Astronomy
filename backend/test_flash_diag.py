import os
import requests
import json
import base64
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("GEMINI_ANALYSIS_KEY") or os.getenv("GEMINI_API_KEY")

def test_flash():
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
    # Just a simple text prompt to see if the model is reachable
    payload = {
        "contents": [{
            "parts": [{"text": "Hello, are you there?"}]
        }]
    }
    headers = {'Content-Type': 'application/json'}
    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_flash()
