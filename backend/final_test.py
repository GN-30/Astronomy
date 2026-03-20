import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")
print(f"Testing key: {key[:10]}...")

urls = [
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={key}",
    "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={key}",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={key}"
]

for url_template in urls:
    url = url_template.format(key=key)
    payload = {"contents": [{"parts": [{"text": "Say 'hello' if you are working."}]}]}
    try:
        r = requests.post(url, headers={'Content-Type': 'application/json'}, data=json.dumps(payload))
        print(f"URL: {url_template.split('?')[0]} | Status: {r.status_code}")
        if r.status_code == 200:
            print(f"Success! Response: {r.json()['candidates'][0]['content']['parts'][0]['text']}")
        else:
            print(f"Error: {r.text[:200]}")
    except Exception as e:
        print(f"Ex: {e}")
