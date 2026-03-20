import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
r = requests.get(url)
with open("available_models.txt", "w", encoding="utf-8") as f:
    if r.status_code == 200:
        models = r.json().get('models', [])
        for m in models:
            f.write(f"{m['name']} | {m['supportedGenerationMethods']}\n")
    else:
        f.write(f"Error {r.status_code}: {r.text}\n")
print("Done writing to available_models.txt")
