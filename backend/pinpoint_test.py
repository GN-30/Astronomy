import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")

test_models = ["models/gemini-2.0-flash-lite", "models/gemini-flash-latest", "models/gemini-2.5-flash"]

for m in test_models:
    print(f"\n--- Testing {m} ---")
    url = f"https://generativelanguage.googleapis.com/v1beta/{m}:generateContent?key={key}"
    payload = {"contents": [{"parts": [{"text": "Is this working?"}]}]}
    try:
        r = requests.post(url, headers={'Content-Type': 'application/json'}, data=json.dumps(payload))
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            print("Response:", r.json()['candidates'][0]['content']['parts'][0]['text'])
        else:
            print(f"Error: {r.text}")
    except Exception as e:
        print(f"Exception: {e}")
