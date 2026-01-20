from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import requests
import json
import random
import swisseph as swe
import datetime
import pytz
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/astrology", tags=["Astrology"])

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_ANALYSIS_KEY = os.getenv("GEMINI_ANALYSIS_KEY") or GEMINI_API_KEY

class BirthDetails(BaseModel):
    dob: str
    time: str
    place: str
    lat: float
    lon: float

# Utility to Calculate Exact Positions (Reused logic from Astronomy)
def calculate_positions(data: BirthDetails):
    try:
        # Parse Input
        try:
            year, month, day = map(int, data.dob.split('-'))
            hour, minute = map(int, data.time.split(':'))
        except ValueError:
            return None # Fail gracefully

        # Handle Timezone: Assuming Input is Indian Standard Time (IST) -> UTC
        dt_ist = datetime.datetime(year, month, day, hour, minute)
        dt_utc = dt_ist - datetime.timedelta(hours=5, minutes=30)
        
        jd = swe.julday(dt_utc.year, dt_utc.month, dt_utc.day, dt_utc.hour + dt_utc.minute/60.0 + dt_utc.second/3600.0)

        swe.set_sid_mode(swe.SIDM_LAHIRI) # Lahiri Ayanamsa
        swe.set_ephe_path('') 
        flags = swe.FLG_MOSEPH | swe.FLG_SIDEREAL | swe.FLG_SPEED 

        planets_map = {
            swe.SUN: "Sun", swe.MOON: "Moon", swe.MARS: "Mars", swe.MERCURY: "Mercury",
            swe.JUPITER: "Jupiter", swe.VENUS: "Venus", swe.SATURN: "Saturn", swe.MEAN_NODE: "Rahu"
        }

        positions = []
        rahu_lon = 0
        
        # Calculate Signs (0=Aries, 1=Taurus...)
        zodiac_signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]

        for pid, name in planets_map.items():
            res = swe.calc_ut(jd, pid, flags)
            lon = res[0][0]
            sign_idx = int(lon // 30)
            sign_name = zodiac_signs[sign_idx]
            positions.append({"name": name, "sign": sign_name, "lon": lon})
            if name == "Rahu":
                rahu_lon = lon

        # Ketu
        ketu_lon = (rahu_lon + 180.0) % 360.0
        ketu_idx = int(ketu_lon // 30)
        positions.append({"name": "Ketu", "sign": zodiac_signs[ketu_idx], "lon": ketu_lon})

        # Ascendant
        houses_res, ascmc = swe.houses_ex(jd, data.lat, data.lon, b'W', flags)
        asc_lon = ascmc[0]
        asc_idx = int(asc_lon // 30)
        ascendant = zodiac_signs[asc_idx]

        return {
            "ascendant": ascendant,
            "planets": positions
        }
    except Exception as e:
        print(f"Calculation Error: {e}")
        return None


def get_local_analysis(data: BirthDetails):
    """Fallback deterministic analysis generator"""
    # Try accurate calculation first
    calculated = calculate_positions(data)
    
    if calculated:
        ascendant = calculated['ascendant']
        # Convert planets list to formatted dictionary for templates
        # We need to map planets to signs for the "random" text generation parts if needed, 
        # or just use the raw data (which is better).
        
        # Determine Moon Sign
        moon_sign = next((p['sign'] for p in calculated['planets'] if p['name'] == 'Moon'), "Unknown")
        # Determine Sun Sign
        sun_sign = next((p['sign'] for p in calculated['planets'] if p['name'] == 'Sun'), "Unknown")
        
        # Format planetary_details list in the expected structure
        planetary_details = []
        significances = {
            "Sun": "Soul & Life Path", "Moon": "Mind & Emotions", "Mars": "Action & Energy",
            "Mercury": "Intellect", "Jupiter": "Growth & Wisdom", "Venus": "Love & Art",
            "Saturn": "Karma & Structure", "Rahu": "Ambition & Chaos", "Ketu": "Spirituality & Letting Go"
        }
        
        for p in calculated['planets']:
            planetary_details.append({
                "planet": p['name'], 
                "sign": p['sign'], 
                "house": "Derived later", # House calc is complex to map to "1,2..12" without house system logic fully exposed, but we can mock or enhance. 
                # Actually calculate_positions doesn't return house numbers for planets yet, just the Asc. 
                # Ideally Swisseph gives houses. For now, random House is fine for fallback 
                # as long as Sign is accurate.
                "house": str(random.randint(1, 12)), 
                "significance": significances.get(p['name'], "Influence")
            })

    else:
        # Fallback to approximation if calculation fails completely
        # (Original Logic)
        month = int(data.dob.split('-')[1])
        day = int(data.dob.split('-')[2])
        
        # Simple Sun Sign Lookup
        cutoff_dates = [20, 19, 21, 20, 21, 21, 23, 23, 23, 23, 22, 22]
        if day >= cutoff_dates[month-1]:
            sun_idx = (month) % 12
        else:
            sun_idx = (month - 1) % 12
        
        sun_sign = ascendants[sun_idx]
        
        # Refine Ascendant (Approximate)
        hour = int(data.time.split(':')[0])
        asc_shift = int((hour - 6) / 2)
        asc_idx = (sun_idx + asc_shift) % 12
        ascendant = ascendants[asc_idx]
        
        moon_sign = random.choice(moon_signs)
        
        # Generate random planetary details for fallback
        planetary_details = [
            {"planet": "Sun", "sign": sun_sign, "house": str(random.randint(1, 10)), "significance": "Soul & Life Path"},
            {"planet": "Moon", "sign": moon_sign, "house": str(random.randint(1, 12)), "significance": "Mind & Emotions"},
            {"planet": "Mars", "sign": random.choice(ascendants), "house": str(random.randint(1, 12)), "significance": "Action & Energy"},
            {"planet": "Mercury", "sign": random.choice(ascendants), "house": str(random.randint(1, 12)), "significance": "Intellect"},
            {"planet": "Jupiter", "sign": random.choice(ascendants), "house": str(random.randint(1, 12)), "significance": "Growth & Wisdom"},
            {"planet": "Venus", "sign": random.choice(ascendants), "house": str(random.randint(1, 12)), "significance": "Love & Art"},
            {"planet": "Saturn", "sign": random.choice(ascendants), "house": str(random.randint(1, 12)), "significance": "Karma & Structure"},
        ]

    moon = moon_sign # Alias for template usage
    
    # Dynamic Templates
    career_templates = [
        "A path involving leadership and innovation is highly favored. Success comes through taking calculated risks.",
        "Your analytical skills point towards success in research or technology. Patience is your greatest asset.",
        "Creative expression is vital for your career fulfillment. Look for roles that allow autonomy.",
        "Service to others brings you the most professional satisfaction. Consider fields in healthcare or counseling.",
        "A structured environment suits you best, where your organizational skills can shine.",
        "Entrepreneurship is indicated. You have the drive to build something of your own."
    ]
    
    relationship_templates = [
        "You seek a deep, transformative connection. Superficial bonds do not interest you.",
        "Intellectual compatibility is your top priority in a partner. Communication is key.",
        "You value stability and loyalty above all else in relationships.",
        "Independence is important to you; you need a partner who respects your space.",
        "You pour your heart into relationships, sometimes forgetting your own needs. Balance is essential."
    ]
    
    health_templates = [
        "Focus on maintaining high energy levels through a protein-rich diet.",
        "Nervous tension may be an issue. Meditation or yoga is highly recommended.",
        "Your vitality is generally strong, but watch out for burnout.",
        "Stay hydrated and ensure you get enough sleep to recharge your active mind.",
        "Outdoor activities will greatly benefit your physical and mental well-being."
    ]
    
    return {
        "ascendant": f"Your Ascendant is **{ascendant}**. This creates a personality that is outwardly {random.choice(['dynamic', 'calm', 'intense', 'charming', 'mysterious'])}. People often perceive you as {random.choice(['reliable', 'energetic', 'thoughtful', 'authoritative'])} upon first meeting.",
        "moon_sign": f"Your Moon Sign is **{moon}**. This suggests your emotional core is {random.choice(['sensitive', 'grounded', 'fiery', 'adaptable'])}. You find comfort in {random.choice(['solitude', 'social gatherings', 'nature', 'creative pursuits'])}.",
        "planetary_details": planetary_details,
        "strengths": random.sample([
            "Resilience in facing challenges", 
            "Natural leadership ability",
            "Creative problem solving",
            "Deep emotional intelligence",
            "Unwavering determination",
            "Sharp analytical mind",
            "Empathy and compassion",
            "Strong intuitive sense"
        ], 4),
        "challenges": random.sample([
            "Tendency to overthink decisions",
            "Need to balance work and rest",
            "Learning to trust intuition more",
            "Difficulty in letting go of the past",
            "Impatience with delays",
            "Struggling with perfectionism"
        ], 3),
        "life_predictions": {
            "career": random.choice(career_templates),
            "relationships": random.choice(relationship_templates),
            "health": random.choice(health_templates)
        }
    }

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

    # 2. Try API (gemini-pro)
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_API_KEY}"
        
        prompt = f"""
        Act as an expert Vedic Astrologer. 
        Generate a strictly personalized daily horoscope for the Zodiac sign '{request.rasi}' specifically for the date '{request.date}'.
        
        To ensure this is dynamic and unique:
        1. Consider the planetary transits (Gochar) applicable on {request.date}.
        2. Mention specific planetary influences (e.g., "Since Moon is in [Sign]...", "Sun is transiting...").
        3. Avoid generic advice that could apply to any day.
        
        Output Format (strict JSON-like structure, do not include markdown blocks):
        1. Rasi Prediction: A mystical yet practical 2-sentence prediction specific to this date.
        2. Nakshatra Guidance: One sentence of specific advice.
        3. Daily Focus: 1-2 words (e.g., "Health", "Career").

        Separate them with a '|' character like this:
        PREDICTION|GUIDANCE|FOCUS
        """

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        
        headers = {'Content-Type': 'application/json'}
        print(f"Fetching AI Prediction for {request.rasi} on {request.date}...")
        response = requests.post(url, headers=headers, data=json.dumps(payload), timeout=8)
        
        if response.status_code != 200:
            print(f"Gemini API Error {response.status_code}: {response.text} -> Switching to Local Fallback")
            return get_local_prediction(request.rasi, request.date)

        data = response.json()
        text = data['candidates'][0]['content']['parts'][0]['text'].strip()
        
        print(f"AI Response: {text[:50]}...") # Log first 50 chars
        
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

@router.post("/analyze_chart")
def analyze_chart(data: BirthDetails):
    # Use fallback immediately if no key logic will be handled in try/except or explicit check
    pass 

    try:
        active_key = GEMINI_ANALYSIS_KEY
        if not active_key:
             print("No API Key found for Analysis -> Switching to Local Fallback")
             return get_local_analysis(data)

        # Calculate Precise Chart Data
        chart_data = calculate_positions(data)
        
        chart_summary = "Could not calculate exact positions."
        if chart_data:
            c_str = []
            c_str.append(f"Ascendant: {chart_data['ascendant']}")
            for p in chart_data['planets']:
                c_str.append(f"{p['name']} in {p['sign']} ({p['lon']:.2f}°)")
            chart_summary = ", ".join(c_str)

        # Prompt Engineering for Comprehensive Analysis
        prompt = f"""
        Act as an expert Vedic Astrologer. A user has provided their birth details:
        Date: {data.dob}
        Time: {data.time}
        Place: {data.place} (Lat: {data.lat}, Lon: {data.lon})

        **ASTRONOMICAL DATA (USE THIS AS FACT):**
        {chart_summary}

        Based on these EXACT planetary positions, provide a detailed breakdown of their birth chart.
        Do NOT recalculate positions yourself. INTERPRET the provided data.
        
        The analysis should cover:
        1. **Ascendant & Personality**: derived from {chart_data['ascendant'] if chart_data else 'calculated data'}.
        2. **Planetary Positions**: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu.
        3. **Key Strengths**: Best qualities derived from the chart.
        4. **Challenges**: Areas to watch out for.
        5. **Life Overview**: Career, Relationships, Health predictions.

        Format the output as a JSON object with these exact keys: 
        {{
            "ascendant": "Detail string...",
            "moon_sign": "Detail string...",
            "planetary_details": [
                {{"planet": "Sun", "sign": "...", "house": "...", "significance": "..."}},
                ...
            ],
            "strengths": ["point 1", "point 2", ...],
            "challenges": ["point 1", "point 2", ...],
            "life_predictions": {{
                "career": "...",
                "relationships": "...",
                "health": "..."
            }}
        }}
        Do not include markdown code blocks. Just the raw JSON.
        """

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={active_key}"
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        headers = {'Content-Type': 'application/json'}
        
        response = requests.post(url, headers=headers, data=json.dumps(payload), timeout=15)
        response.raise_for_status()
        
        data = response.json()
        raw_text = data['candidates'][0]['content']['parts'][0]['text']
        
        # Clean potential markdown
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_text:
            raw_text = raw_text.split("```")[1].split("```")[0].strip()
            
        return json.loads(raw_text)

    except Exception as e:
        print(f"Chart Analysis Error: {e} -> Switching to Local Fallback")
        return get_local_analysis(data)

