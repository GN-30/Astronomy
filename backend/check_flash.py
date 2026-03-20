import os
import requests
from dotenv import load_dotenv

load_dotenv()

def list_flash(name, key):
    print(f"\n--- {name} ---")
    if not key:
        print("No key.")
        return
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
    try:
        r = requests.get(url)
        if r.status_code == 200:
            models = r.json().get('models', [])
            flash = [m['name'] for m in models if 'flash' in m['name'].lower()]
            print(f"Available Flash: {flash}")
        else:
            print(f"Error {r.status_code}: {r.text}")
    except Exception as e:
        print(f"Ex: {e}")

list_flash("API_KEY", os.getenv("GEMINI_API_KEY"))
list_flash("ANALYSIS_KEY", os.getenv("GEMINI_ANALYSIS_KEY"))
