from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import os
import requests
import json
import random
import swisseph as swe
import datetime
import pytz
import base64
import io
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/astrology", tags=["Astrology"])

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_ANALYSIS_KEY = os.getenv("GEMINI_ANALYSIS_KEY") or GEMINI_API_KEY

def get_active_key():
    return os.getenv("GEMINI_ANALYSIS_KEY") or os.getenv("GEMINI_API_KEY")

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

        nakshatras = [
            "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
            "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
            "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
        ]

        def get_nakshatra_info(lon):
            nak_len = 360 / 27
            idx = int(lon / nak_len)
            name = nakshatras[idx % 27]
            charan = int((lon % nak_len) / (nak_len / 4)) + 1
            return name, charan

        positions = []
        rahu_lon = 0
        
        # Calculate Signs (0=Aries, 1=Taurus...)
        zodiac_signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]

        for pid, name in planets_map.items():
            res = swe.calc_ut(jd, pid, flags)
            lon = res[0][0]
            sign_idx = int(lon // 30)
            sign_name = zodiac_signs[sign_idx]
            nak_name, charan = get_nakshatra_info(lon)
            positions.append({
                "name": name, 
                "sign": sign_name, 
                "lon": lon,
                "nakshatra": nak_name,
                "charan": charan
            })
            if name == "Rahu":
                rahu_lon = lon

        # Ketu
        ketu_lon = (rahu_lon + 180.0) % 360.0
        ketu_idx = int(ketu_lon // 30)
        nak_name_k, charan_k = get_nakshatra_info(ketu_lon)
        positions.append({
            "name": "Ketu", 
            "sign": zodiac_signs[ketu_idx], 
            "lon": ketu_lon,
            "nakshatra": nak_name_k,
            "charan": charan_k
        })

        # Ascendant
        houses_res, ascmc = swe.houses_ex(jd, data.lat, data.lon, b'W', flags)
        asc_lon = ascmc[0]
        asc_idx = int(asc_lon // 30)
        ascendant = zodiac_signs[asc_idx]
        asc_nak, asc_charan = get_nakshatra_info(asc_lon)

        return {
            "ascendant": ascendant,
            "asc_nakshatra": asc_nak,
            "asc_charan": asc_charan,
            "planets": positions
        }
    except Exception as e:
        print(f"Calculation Error: {e}")
        return None


def get_local_analysis(data: BirthDetails = None):
    """Fallback deterministic analysis generator"""
    # Try accurate calculation first
    calculated = calculate_positions(data) if data else None
    
    if calculated:
        ascendant = calculated['ascendant']
        # Convert planets list to formatted dictionary for templates
        
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
                "house": str(random.randint(1, 12)), 
                "significance": significances.get(p['name'], "Influence")
            })

    else:
        # Fallback to random if no data provided
        ascendants = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
        ascendant = random.choice(ascendants)
        moon_sign = random.choice(ascendants)
        
        planetary_details = [
            {"planet": "Sun", "sign": random.choice(ascendants), "house": str(random.randint(1, 10)), "significance": "Soul & Life Path"},
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

@router.get("/search_location")
async def search_location(q: str):
    if not q or len(q) < 3:
        return []
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        # Note: verify=False is used because of SSL verification issues on some local environments
        res = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": q, "format": "json", "limit": 5},
            headers=headers,
            timeout=10,
            verify=False
        )
        res.raise_for_status()
        return res.json()
    except Exception as e:
        print(f"Geocoding Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch location data")

@router.get("/reverse_geocode")
async def reverse_geocode(lat: float, lon: float):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        res = requests.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={"lat": lat, "lon": lon, "format": "json"},
            headers=headers,
            timeout=10,
            verify=False
        )
        res.raise_for_status()
        return res.json()
    except Exception as e:
        print(f"Reverse Geocoding Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch reverse location data")

@router.post("/predict")
def get_prediction(request: PredictionRequest):
    # 1. Validation
    if not GEMINI_API_KEY:
        print("Using Local Fallback: No API Key")
        return get_local_prediction(request.rasi, request.date)

    # 2. Try API (gemini-pro)
    try:
        active_key = get_active_key()
        if not active_key:
            return get_local_prediction(request.rasi, request.date)
            
        prompt = f"""
        Act as an expert Vedic Astrologer. Provide a personalized daily horoscope prediction based on:
        Sign (Rasi): {request.rasi}
        Nakshatra: {request.nakshatra}
        Date: {request.date}
        
        Important: Use the Sign (Rasi) as the primary influencer. Provide practical, encouraging advice.
        
        Output format:
        <Sign Prediction> | <Nakshatra/General Guidance> | <Daily Focus Keyword>
        """
        
        url = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={active_key}"
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
        if 'candidates' not in data or not data['candidates']:
             return get_local_prediction(request.rasi, request.date)

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

@router.post("/analyze_image")
async def analyze_image(file: UploadFile = File(...)):
    try:
        # Check file size (4MB limit for Gemini)
        file_size = 0
        contents = await file.read()
        file_size = len(contents)
        if file_size > 4 * 1024 * 1024:  # 4MB
            raise HTTPException(status_code=400, detail="Image file too large. Maximum size is 4MB.")

        active_key = get_active_key()
        if not active_key:
            raise HTTPException(status_code=500, detail="API Key missing")

        base64_image = base64.b64encode(contents).decode('utf-8')

        prompt = """
        Act as an expert Vedic Astrologer. Analyze this birth chart image.
        Extract the following information:
        1. Ascendant (Lagna) sign and Nakshatra.
        2. All 9 planets (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu) - their Signs, Nakshatras, Charans, and Houses.

        Then, provide a detailed astrological analysis covering:
        - Personality traits
        - Key Strengths and Challenges
        - Life predictions (Career, Relationships, Health)

        Format the entire response as a JSON object with these keys: 
        {
            "ascendant": "string",
            "asc_nakshatra": "string",
            "asc_charan": number,
            "moon_sign": "string",
            "planetary_details": [
                {"planet": "...", "sign": "...", "nakshatra": "...", "charan": ..., "house": "...", "significance": "..."}
            ],
            "strengths": ["string", ...],
            "challenges": ["string", ...],
            "life_predictions": {
                "career": "string",
                "relationships": "string",
                "health": "string"
            }
        }
        Return ONLY valid JSON. No markdown backticks.
        """

        url = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={active_key}"
        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": file.content_type,
                            "data": base64_image
                        }
                    }
                ]
            }]
        }
        
        headers = {'Content-Type': 'application/json'}
        print(f"DEBUG: Sending request to {url}")
        print(f"DEBUG: Payload parts count: {len(payload['contents'][0]['parts'])}")
        print(f"DEBUG: API Key exists: {bool(active_key)}")
        response = requests.post(url, headers=headers, data=json.dumps(payload), timeout=30)
        
        print(f"DEBUG: Response status: {response.status_code}")
        print(f"DEBUG: Response text: {response.text[:500]}")
        
        if response.status_code != 200:
            try:
                error_data = response.json()
                if 'error' in error_data:
                    error_msg = error_data['error'].get('message', str(error_data['error']))
                else:
                    error_msg = str(error_data)
            except:
                error_msg = response.text
            
            print(f"Gemini Vision Error: {error_msg}")
            raise HTTPException(status_code=response.status_code, detail=f"Gemini API Error: {error_msg}")

        data = response.json()
        raw_text = data['candidates'][0]['content']['parts'][0]['text'].strip()
        
        # Clean potential markdown
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_text:
            raw_text = raw_text.split("```")[1].split("```")[0].strip()

        try:
            return json.loads(raw_text)
        except json.JSONDecodeError as je:
            print(f"JSON Parse Error: {je}")
            print(f"Raw response: {raw_text}")
            raise HTTPException(status_code=500, detail="AI returned invalid response format")

    except Exception as e:
        print(f"Image Analysis Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze_match_images")
async def analyze_match_images(
    boy_chart: UploadFile = File(...), 
    girl_chart: UploadFile = File(...),
    boy_name: str = Form("Boy"),
    girl_name: str = Form("Girl")
):
    try:
        # Check file sizes
        boy_contents = await boy_chart.read()
        girl_contents = await girl_chart.read()
        if len(boy_contents) > 4 * 1024 * 1024 or len(girl_contents) > 4 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image files too large. Maximum size is 4MB each.")

        active_key = get_active_key()
        if not active_key:
            raise HTTPException(status_code=500, detail="API Key missing")

        boy_b64 = base64.b64encode(boy_contents).decode('utf-8')
        girl_b64 = base64.b64encode(girl_contents).decode('utf-8')

        prompt = f"""
        Act as an expert Vedic Astrologer. Analyze these two birth chart images for matchmaking compatibility.
        Chart 1 (Boy): {boy_name}
        Chart 2 (Girl): {girl_name}

        Compare their planetary positions, Nakshatras, and overall chart compatibility (Ashta Koota logic).
        Provide a compatibility score out of 36, a verdict, and a detailed analysis of their relationship potential.

        Format the entire response as a JSON object with these keys: 
        {{
            "score": number,
            "verdict": "string",
            "analysis": "string"
        }}
        Return ONLY valid JSON. No markdown backticks.
        """

        url = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={active_key}"
        payload = {
            "contents": [{{
                "parts": [
                    {{"text": prompt}},
                    {{
                        "inline_data": {{
                            "mime_type": boy_chart.content_type,
                            "data": boy_b64
                        }}
                    }},
                    {{
                        "inline_data": {{
                            "mime_type": girl_chart.content_type,
                            "data": girl_b64
                        }}
                    }}
                ]
            }}]
        }
        
        headers = {{'Content-Type': 'application/json'}}
        response = requests.post(url, headers=headers, data=json.dumps(payload), timeout=45)
        
        if response.status_code != 200:
            try:
                error_data = response.json()
                if 'error' in error_data:
                    error_msg = error_data['error'].get('message', str(error_data['error']))
                else:
                    error_msg = str(error_data)
            except:
                error_msg = response.text
            print(f"Gemini Match Vision Error: {error_msg}")
            raise HTTPException(status_code=response.status_code, detail=f"Gemini API Error: {error_msg}")

        data = response.json()
        raw_text = data['candidates'][0]['content']['parts'][0]['text'].strip()
        
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_text:
            raw_text = raw_text.split("```")[1].split("```")[0].strip()

        try:
            return json.loads(raw_text)
        except json.JSONDecodeError as je:
            print(f"Match JSON Parse Error: {je}")
            print(f"Raw response: {raw_text}")
            raise HTTPException(status_code=500, detail="AI returned invalid response format")

    except Exception as e:
        print(f"Match Analysis Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze_chart")
def analyze_chart(data: BirthDetails):
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
            c_str.append(f"Ascendant: {chart_data['ascendant']} (Nakshatra: {chart_data['asc_nakshatra']}, Charan: {chart_data['asc_charan']})")
            for p in chart_data['planets']:
                c_str.append(f"{p['name']} in {p['sign']} (Nakshatra: {p['nakshatra']}, Charan: {p['charan']}, Lon: {p['lon']:.2f}°)")
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
        Do NOT recalculate positions yourself. INTERPRET the provided data, especially considering the Nakshatra and Charan.
        
        The analysis should cover:
        1. **Ascendant & Personality**: derived from {chart_data['ascendant']} ({chart_data['asc_nakshatra']}).
        2. **Planetary Positions**: Interpretation of planets in their respective signs and Nakshatras.
        3. **Key Strengths**: Best qualities derived from the chart.
        4. **Challenges**: Areas to watch out for.
        5. **Life Overview**: Career, Relationships, Health predictions.

        Format the output as a JSON object with these exact keys: 
        {{
            "ascendant": "Detail string...",
            "asc_nakshatra": "{chart_data['asc_nakshatra']}",
            "asc_charan": {chart_data['asc_charan']},
            "moon_sign": "Detail string...",
            "planetary_details": [
                {{"planet": "Sun", "sign": "...", "nakshatra": "...", "charan": ..., "house": "...", "significance": "..."}},
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

        url = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={active_key}"
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


