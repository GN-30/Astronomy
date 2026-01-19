from fastapi import APIRouter
from pydantic import BaseModel
import os
import requests
import json
import random
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/astrology", tags=["Astrology"])

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

class PredictionRequest(BaseModel):
    rasi: str
    nakshatra: str
    date: str = None

def get_local_prediction(rasi, date):
    """Fallback generator using deterministic randomness based on date/sign"""
    templates = [
        "The stars suggest a day of reflection for {rasi}. {date} brings clarity to your inner thoughts.",
        "Energy levels are high for {rasi} today. Use this momentum to tackle pending tasks.",
        "A surprising encounter might shift your perspective. Stay open to new ideas, {rasi}.",
        "Financial caution is advised on {date}. Focus on long-term stability rather than quick gains.",
        "Relationships take center stage. Communication is your strongest asset today, {rasi}.",
        "The cosmos aligns to support your creative endeavors. unexpected inspiration strikes.",
        "Patience will be tested, but perseverance yields results. Trust the process.",
        "A good day for health and wellness. Listen to your body's needs."
    ]
    
    # Create a deterministic seed
    seed_str = f"{rasi}-{date}"
    random.seed(seed_str)
    
    prediction = random.choice(templates).format(rasi=rasi, date=date)
    guidance = random.choice([
        "Trust your intuition.", 
        "Avoid making hasty decisions.",
        "Seek counsel from a friend.",
        "Take a moment to breathe.",
        "Focus on the present moment."
    ])
    focus = random.choice(["Health", "Career", "Family", "Creativity", "Finance", "Love"])
    
    return {
        "rasi_prediction": prediction,
        "nakshatra_guidance": guidance,
        "daily_focus": focus
    }

@router.post("/predict")
def get_prediction(request: PredictionRequest):
    # 1. Validation
    if not GEMINI_API_KEY:
        print("Using Local Fallback: No API Key")
        return get_local_prediction(request.rasi, request.date)

    # 2. Try API (gemini-1.5-flash)
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        
        prompt = f"""
        Act as an expert Vedic Astrologer. 
        Generate a personalized daily horoscope for the Zodiac sign '{request.rasi}' for the date '{request.date}'.
        
        Output Format (strict JSON-like structure, do not include markdown blocks):
        1. Rasi Prediction: A mystical yet practical 2-sentence prediction.
        2. Nakshatra Guidance: One sentence of specific advice.
        3. Daily Focus: 1-2 words (e.g., "Health", "Career").

        Separate them with a '|' character like this:
        PREDICTION|GUIDANCE|FOCUS
        """

        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        
        headers = {'Content-Type': 'application/json'}
        response = requests.post(url, headers=headers, data=json.dumps(payload), timeout=5)
        
        if response.status_code != 200:
            print(f"Gemini API Error {response.status_code}: {response.text} -> Switching to Local Fallback")
            return get_local_prediction(request.rasi, request.date)

        data = response.json()
        text = data['candidates'][0]['content']['parts'][0]['text'].strip()
        
        parts = text.split('|')
        
        if len(parts) >= 3:
            prediction = parts[0].strip()
            guidance = parts[1].strip()
            focus = parts[2].strip()
        else:
            prediction = text
            guidance = "Trust the universal flow."
            focus = "Balance"

        return {
            "rasi_prediction": prediction,
            "nakshatra_guidance": guidance,
            "daily_focus": focus
        }

    except Exception as e:
        print(f"Backend Exception: {e} -> Switching to Local Fallback")
        return get_local_prediction(request.rasi, request.date)
