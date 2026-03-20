import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")
print(f"Testing key: {key[:10]}...")

def test_url(url_template):
    url = url_template.format(key=key)
    payload = {"contents": [{"parts": [{"text": "Hello, are you working?"}]}]}
    try:
        r = requests.post(url, headers={'Content-Type': 'application/json'}, data=json.dumps(payload))
        print(f"URL: {url_template[:60]}... | Status: {r.status_code}")
        if r.status_code != 200:
            print(f"Error: {r.text}")
    except Exception as e:
        print(f"Ex: {e}")

# Try common permutations
test_url("https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={key}")
test_url("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}")
test_url("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={key}")
