import os
import requests
from dotenv import load_dotenv

load_dotenv()

def check_model_details(name, key, model_name):
    print(f"\n--- {name} | {model_name} ---")
    url = f"https://generativelanguage.googleapis.com/v1beta/{model_name}?key={key}"
    try:
        r = requests.get(url)
        if r.status_code == 200:
            data = r.json()
            methods = data.get('supportedGenerationMethods', [])
            print(f"Supported methods: {methods}")
        else:
            print(f"Error {r.status_code}: {r.text}")
    except Exception as e:
        print(f"Ex: {e}")

key1 = os.getenv("GEMINI_API_KEY")
key2 = os.getenv("GEMINI_ANALYSIS_KEY")

for k_name, k in [("API_KEY", key1), ("ANALYSIS_KEY", key2)]:
    check_model_details(k_name, k, "models/gemini-1.5-flash")
    check_model_details(k_name, k, "models/gemini-1.5-flash-latest")
    check_model_details(k_name, k, "models/gemini-pro")
