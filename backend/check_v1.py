import os
import requests
from dotenv import load_dotenv

load_dotenv()

def check_v1(name, key):
    print(f"\n--- {name} | v1 ---")
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash?key={key}"
    try:
        r = requests.get(url)
        print(f"Status {r.status_code}: {r.text}")
    except Exception as e:
        print(f"Ex: {e}")

check_v1("API_KEY", os.getenv("GEMINI_API_KEY"))
check_v1("ANALYSIS_KEY", os.getenv("GEMINI_ANALYSIS_KEY"))
