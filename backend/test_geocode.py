import requests
import json

def test_geocode():
    q = "Hampi"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    try:
        print(f"Testing geocode for: {q}")
        res = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": q, "format": "json", "limit": 5},
            headers=headers,
            timeout=10,
            verify=False
        )
        print(f"Status Code: {res.status_code}")
        print(f"Response: {res.text[:200]}")
    except Exception as e:
        print(f"Exception: {str(e)}")

if __name__ == "__main__":
    test_geocode()
