import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

def check_key(name, key):
    print(f"--- Checking {name} ---")
    if not key:
        print("Key not found.")
        return
    
    # Try v1beta models list
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
    try:
        response = requests.get(url)
        print(f"v1beta status: {response.status_code}")
        if response.status_code == 200:
            models = response.json().get('models', [])
            flash_names = [m['name'] for m in models if 'flash' in m['name'].lower()]
            print(f"Flash models in v1beta: {flash_names}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

    # Try v1 models list
    url = f"https://generativelanguage.googleapis.com/v1/models?key={key}"
    try:
        response = requests.get(url)
        print(f"v1 status: {response.status_code}")
        if response.status_code == 200:
            models = response.json().get('models', [])
            flash_names = [m['name'] for m in models if 'flash' in m['name'].lower()]
            print(f"Flash models in v1: {flash_names}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

api_key = os.getenv("GEMINI_API_KEY")
analysis_key = os.getenv("GEMINI_ANALYSIS_KEY")

check_key("GEMINI_API_KEY", api_key)
check_key("GEMINI_ANALYSIS_KEY", analysis_key)
