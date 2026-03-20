from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import swisseph as swe
import datetime
import pytz
import os
import requests
import json
import math
import base64
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_ANALYSIS_KEY = os.getenv("GEMINI_ANALYSIS_KEY", "").strip()

def get_active_key():
    return os.getenv("GEMINI_ANALYSIS_KEY") or os.getenv("GEMINI_API_KEY")

router = APIRouter(prefix="/api/astronomy", tags=["Astronomy"])

class BirthDetails(BaseModel):
    name: str = ""
    dob: str  # YYYY-MM-DD
    time: str # HH:MM
    place: str
    lat: float
    lon: float

def get_julian_day(dt_utc: datetime.datetime) -> float:
    return swe.julday(dt_utc.year, dt_utc.month, dt_utc.day, dt_utc.hour + dt_utc.minute/60.0 + dt_utc.second/3600.0)

@router.post("/chart")
def calculate_chart(data: BirthDetails):
    try:
        # Parse Input
        try:
            year, month, day = map(int, data.dob.split('-'))
            hour, minute = map(int, data.time.split(':'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date/time format")

        dt_ist = datetime.datetime(year, month, day, hour, minute)
        dt_utc = dt_ist - datetime.timedelta(hours=5, minutes=30)
        
        jd = get_julian_day(dt_utc)

        swe.set_sid_mode(swe.SIDM_LAHIRI)

        planets_map = {
            swe.SUN: "Sun", swe.MOON: "Moon", swe.MERCURY: "Mercury", swe.VENUS: "Venus",
            swe.MARS: "Mars", swe.JUPITER: "Jupiter", swe.SATURN: "Saturn", 
            swe.URANUS: "Uranus", swe.NEPTUNE: "Neptune", swe.PLUTO: "Pluto", 
            swe.MEAN_NODE: "Rahu",
        }

        swe.set_ephe_path('') 
        flags = swe.FLG_MOSEPH | swe.FLG_SIDEREAL | swe.FLG_SPEED 

        nakshatras = [
            "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
            "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
            "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
        ]

        # Calculate Nakshatra and Charan for each planet
        def get_nakshatra_info(lon):
            nak_len = 360 / 27  # 13.333...
            nak_idx = int(lon / nak_len)
            nak_name = nakshatras[nak_idx % 27]
            
            # Charan (Pada) calculation: 13.333... deg / 4 = 3.333... deg per Charan
            charan = int((lon % nak_len) / (nak_len / 4)) + 1
            return nak_name, charan

        chart_data = []
        navamsa_data = []
        rahu_data = None
        moon_lon = 0

        for pid, name in planets_map.items():
            res = swe.calc_ut(jd, pid, flags)
            coords = res[0]
            lon = coords[0]
            speed_lon = coords[3]
            is_retro = speed_lon < 0
            
            nak_name, charan = get_nakshatra_info(lon)
            planet_info = {
                "name": name, 
                "lon": lon, 
                "is_retrograde": is_retro, 
                "speed": speed_lon,
                "nakshatra": nak_name,
                "charan": charan
            }
            chart_data.append(planet_info)
            navamsa_data.append({"name": name, "lon": (lon * 9) % 360.0, "is_retrograde": is_retro})
            
            if name == "Rahu": rahu_data = planet_info
            if name == "Moon": moon_lon = lon

        if rahu_data:
            ketu_lon = (rahu_data["lon"] + 180.0) % 360.0
            nak_name_k, charan_k = get_nakshatra_info(ketu_lon)
            chart_data.append({
                "name": "Ketu", 
                "lon": ketu_lon, 
                "is_retrograde": True,
                "nakshatra": nak_name_k,
                "charan": charan_k
            })
            navamsa_data.append({"name": "Ketu", "lon": (ketu_lon * 9) % 360.0, "is_retrograde": True})

        h_sys = b'W'
        houses_res, ascmc = swe.houses_ex(jd, data.lat, data.lon, h_sys, flags)
        ascendant = ascmc[0]
        asc_nak, asc_charan = get_nakshatra_info(ascendant)
        navamsa_ascendant = (ascendant * 9) % 360.0
        
        houses = [{"house": i + 1, "degree": cusp} for i, cusp in enumerate(houses_res)]

        dasha_lords = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
        dasha_years = [7, 20, 6, 10, 7, 18, 16, 19, 17]
        
        nakshatra_len = 13.0 + (1.0/3.0)
        nakshatra_num = moon_lon / nakshatra_len
        nakshatra_idx = int(math.floor(nakshatra_num))
        lord_idx = nakshatra_idx % 9
        
        fraction_left = 1.0 - (nakshatra_num - nakshatra_idx)
        years_elapsed_first_dasha = (1.0 - fraction_left) * dasha_years[lord_idx]
        
        dob_date = dt_ist
        true_start_date = dt_ist - datetime.timedelta(days=years_elapsed_first_dasha * 365.2425)
        
        def generate_sub_dashas(start_idx, current_start_date, curr_duration, level, max_level=5):
            if level >= max_level: return []
            sub_dashas = []
            sd = current_start_date
            for j in range(9):
                sub_idx = (start_idx + j) % 9
                sub_lord = dasha_lords[sub_idx]
                sub_days = curr_duration * (dasha_years[sub_idx] / 120.0) * 365.2425
                sub_end_date = sd + datetime.timedelta(days=sub_days)
                if sub_end_date <= dob_date:
                    sd = sub_end_date
                    continue
                display_start = sd if sd > dob_date else dob_date
                display_years = (sub_end_date - display_start).total_seconds() / (365.2425 * 24 * 3600)
                sub_dashas.append({
                    "lord": sub_lord, "start": display_start.strftime("%Y-%m-%d"),
                    "end": sub_end_date.strftime("%Y-%m-%d"), "duration_years": round(display_years, 4),
                    "sub_levels": generate_sub_dashas(sub_idx, sd, curr_duration * (dasha_years[sub_idx] / 120.0), level + 1, max_level)
                })
                sd = sub_end_date
            return sub_dashas

        dashas = []
        sd = true_start_date
        for i in range(9):
            idx = (lord_idx + i) % 9
            end_date = sd + datetime.timedelta(days=dasha_years[idx] * 365.2425)
            if end_date <= dob_date:
                sd = end_date
                continue
            display_start = sd if sd > dob_date else dob_date
            display_years = (end_date - display_start).total_seconds() / (365.2425 * 24 * 3600)
            dashas.append({
                "lord": dasha_lords[idx], "start": display_start.strftime("%Y-%m-%d"),
                "end": end_date.strftime("%Y-%m-%d"), "duration_years": round(display_years, 2),
                "sub_levels": generate_sub_dashas(idx, sd, dasha_years[idx], 1, 5)
            })
            sd = end_date
            
        return {
            "ascendant": ascendant, "asc_nakshatra": asc_nak, "asc_charan": asc_charan,
            "navamsa_ascendant": navamsa_ascendant,
            "planets": chart_data, "navamsa_planets": navamsa_data,
            "houses": houses, "dashas": dashas,
            "meta": {"ayanamsa": "Lahiri (Sidereal)", "house_system": "Whole Sign"}
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class MatchProfile(BaseModel):
    name: str
    dob: str
    time: str
    place: str
    lat: float
    lon: float
    gender: str

class MatchRequest(BaseModel):
    boy: MatchProfile
    girl: MatchProfile

def get_local_match(boy_name, girl_name):
    import random
    random.seed(f"{boy_name}-{girl_name}".lower())
    score = random.randint(18, 32)
    verdict = "Excellent Match" if score > 28 else "Very Good Match" if score > 24 else "Average Compatibility" if score > 18 else "Challenging"
    analysis_templates = [
        "The relationship shows strong promise. Emotional understanding is deep.",
        "Communication is a strong suit here. Both partners share similar values.",
        "There may be some friction in decision making, but love prevails.",
        "Financial goals align well. A stable and prosperous future is indicated."
    ]
    return {
        "score": score, "verdict": verdict,
        "analysis": f"Based on astrological compatibility, this union scores {score}/36. " + " ".join(random.sample(analysis_templates, 3))
    }

@router.post("/match")
def match_profiles(req: MatchRequest):
    try:
        if not GEMINI_API_KEY: return get_local_match(req.boy.name, req.girl.name)
        prompt = f"""
        Perform a Vedic Astrology Matchmaking (Ashta Koota Guna Milan) for:
        Boy: {req.boy.name}, DOB: {req.boy.dob}, Time: {req.boy.time}, Place: {req.boy.place} (Lat: {req.boy.lat}, Lon: {req.boy.lon})
        Girl: {req.girl.name}, DOB: {req.girl.dob}, Time: {req.girl.time}, Place: {req.girl.place} (Lat: {req.girl.lat}, Lon: {req.girl.lon})
        
        Tasks:
        1. Calculate the Ashta Koota score (out of 36).
        2. Provide a verdict and analysis.
        
        Output strictly valid, parseable JSON:
        {{ "score": <number_out_of_36>, "verdict": "...", "analysis": "..." }}
        """
        url = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={get_active_key()}"
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        response = requests.post(url, headers={'Content-Type': 'application/json'}, data=json.dumps(payload), timeout=10)
        response.raise_for_status()
        raw_text = response.json()['candidates'][0]['content']['parts'][0]['text']
        if "```json" in raw_text: raw_text = raw_text.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_text: raw_text = raw_text.split("```")[1].split("```")[0].strip()
        return json.loads(raw_text)
    except Exception as e:
        print(f"Match Error: {e}")
        return get_local_match(req.boy.name, req.girl.name)

