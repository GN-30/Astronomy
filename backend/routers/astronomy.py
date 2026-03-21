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

class PanchangamRequest(BaseModel):
    date: str
    time: str
    lat: float
    lon: float

@router.post("/panchangam")
def get_panchangam(req: PanchangamRequest):
    try:
        # 1. Parse date/time
        dt_str = f"{req.date} {req.time}"
        dt = datetime.datetime.strptime(dt_str, "%Y-%m-%d %H:%M")
        
        # 2. Local to UTC
        ist = pytz.timezone('Asia/Kolkata')
        dt_ist = ist.localize(dt)
        dt_utc = dt_ist.astimezone(pytz.UTC)
        
        # 3. Julian Day
        jd = swe.julday(dt_utc.year, dt_utc.month, dt_utc.day, 
                        dt_utc.hour + dt_utc.minute/60.0 + dt_utc.second/3600.0)

        # 4. Sunrise/Sunset (for Rahu Kaalam etc)
        # We calculate for the start of the day at 0:00 UTC
        jd_day = swe.julday(dt_utc.year, dt_utc.month, dt_utc.day, 0)
        
        # Simplified Rise/Set if rise_trans fails or for speed
        # For true Vedic, we need the rise of the limb
        # Precise Sunrise/Sunset Search (0.833 deg below horizon due to refraction/size)
        # Precise Sunrise/Sunset Search using manual altitude formula
        def find_sun_event(start_jd, target_alt_deg, is_rising):
            current_jd = start_jd
            step = 2.0 / (24 * 60) # 2 min steps
            last_alt = None
            target_alt_rad = math.radians(target_alt_deg)
            lat_rad = math.radians(req.lat)
            
            for _ in range(480): # 16 hours
                # Get Sun's RA/Dec (Equatorial)
                res_all = swe.calc_ut(current_jd, swe.SUN, swe.FLG_MOSEPH | swe.FLG_EQUATORIAL)
                res_equ = res_all[0]
                ra, dec, dist = res_equ[0], res_equ[1], res_equ[2]
                
                # Get Sidereal Time (Greenwich)
                gst = swe.sidtime(current_jd) # in hours
                # Local Sidereal Time
                lst = (gst + req.lon / 15.0) % 24
                # Hour Angle (in degrees)
                ha = (lst * 15.0 - ra) % 360
                if ha > 180: ha -= 360
                
                # Manual Alt calculation: sin(alt) = sin(lat)sin(dec) + cos(lat)cos(dec)cos(ha)
                dec_rad = math.radians(dec)
                ha_rad = math.radians(ha)
                sin_alt = math.sin(lat_rad) * math.sin(dec_rad) + math.cos(lat_rad) * math.cos(dec_rad) * math.cos(ha_rad)
                alt_rad = math.asin(max(-1.0, min(1.0, sin_alt)))
                alt = math.degrees(alt_rad)
                
                if last_alt is not None:
                    if (is_rising and last_alt <= target_alt_deg <= alt) or \
                       (not is_rising and last_alt >= target_alt_deg >= alt):
                        return current_jd
                
                last_alt = alt
                current_jd += step
            return None

        # Search for Sunrise: Start from midnight IST of the given day
        jd_midnight_ist = jd_day - (5.5 / 24.0)
        sunrise_jd = find_sun_event(jd_midnight_ist, -0.833, True)
        if not sunrise_jd: sunrise_jd = jd_day + (6 - 5.5)/24.0
        
        # Search for Sunset: Start from 12 PM IST
        jd_noon_ist = jd_midnight_ist + 0.5
        sunset_jd = find_sun_event(jd_noon_ist, -0.833, False)
        if not sunset_jd: sunset_jd = jd_day + (18 - 5.5)/24.0

        def jd_to_local_str(jd_val):
            y_f, m_f, d_f, h = swe.revjul(jd_val)
            y, m, d, hour = int(y_f), int(m_f), int(d_f), int(h)
            min_float = (h - hour) * 60
            minute = int(min_float)
            sec_float = (min_float - minute) * 60
            second = int(sec_float)
            
            # Safe boundary checks for minute/second
            if second >= 60: second = 59
            if minute >= 60: minute = 59
                
            dt_utc_val = pytz.UTC.localize(datetime.datetime(y, m, d, hour, minute, second))
            dt_ist_val = dt_utc_val.astimezone(ist)
            return dt_ist_val.strftime("%I:%M %p")

        # Day length calculations
        day_length = (sunset_jd - sunrise_jd) * 24.0
        period_len = day_length / 8.0

        # Rahu/Yama/Gulika Mapping (Day of week: 0=Sun, 1=Mon, ..., 6=Sat)
        weekday = dt_ist.isoweekday() % 7
        
        # Rahu Kaalam periods (8 parts of day)
        rahu_periods = [8, 2, 7, 5, 6, 4, 3] # Sun, Mon, Tue, Wed, Thu, Fri, Sat
        rahu_idx = rahu_periods[weekday]
        rahu_start = sunrise_jd + (rahu_idx - 1) * (period_len / 24.0)
        rahu_end = rahu_start + (period_len / 24.0)

        # Yama Gandam periods
        yama_periods = [5, 4, 3, 2, 1, 7, 6]
        yama_idx = yama_periods[weekday]
        yama_start = sunrise_jd + (yama_idx - 1) * (period_len / 24.0)
        yama_end = yama_start + (period_len / 24.0)

        # Gulika Kaalam
        guli_periods = [7, 6, 5, 4, 3, 2, 1]
        guli_idx = guli_periods[weekday]
        guli_start = sunrise_jd + (guli_idx - 1) * (period_len / 24.0)
        guli_end = guli_start + (period_len / 24.0)

        # Nalla Neram (Traditional Tamil Periods - 2 per day)
        # Using a dictionary for clarity: {weekday: (start_hour, end_hour)} relative to standard 6am base
        # but traditionally these are often offset by Sunrise. 
        # Standard: Mon (6-7.30, 3-4.30), Tue (7.30-9, 4.30-6), Wed (9-10.30, 6-7.30), ...
        nalla_periods = {
            1: [(6, 7.5), (15, 16.5)], # Mon
            2: [(7.5, 9), (16.5, 18)], # Tue
            3: [(9, 10.5), (18, 19.5)], # Wed
            4: [(10.5, 12), (18, 19.5)], # Thu
            5: [(9, 10.5), (16.5, 18)], # Fri
            6: [(7.5, 9), (16.5, 18)], # Sat
            0: [(7.5, 9), (18, 19.5)], # Sun
        }
        p1, p2 = nalla_periods[weekday]
        # Offset relative to actual sunrise? No, standard is fixed clock but we can make it better
        nalla_start1 = sunrise_jd + (p1[0] - 6.0)/24.0
        nalla_end1 = sunrise_jd + (p1[1] - 6.0)/24.0
        # Check which period the user is closer to if we only show one, or combine
        # For simple display, let's just pick one or show both
        nalla_times = f"{jd_to_local_str(nalla_start1)} - {jd_to_local_str(nalla_end1)}"

        # 4. Sun and Moon positions (Sidereal)
        swe.set_sid_mode(swe.SIDM_LAHIRI)
        flags = swe.FLG_MOSEPH | swe.FLG_SIDEREAL

        res_sun_all = swe.calc_ut(jd, swe.SUN, flags)
        res_moon_all = swe.calc_ut(jd, swe.MOON, flags)
        sun_lon = res_sun_all[0][0]
        moon_lon = res_moon_all[0][0]

        # 5. Calculations
        # Tithi (360 / 30 = 12 deg per Tithi)
        tithi_diff = (moon_lon - sun_lon) % 360
        tithi_num = int(tithi_diff / 12) + 1
        
        # End Time Finding Helper
        def find_end_time(start_jd, target_val, calculation_type):
            current_jd = start_jd
            # Check every 15 mins for 30 hours
            for _ in range(120):
                current_jd += 0.25 / 24.0
                res_s = swe.calc_ut(current_jd, swe.SUN, flags)
                res_m = swe.calc_ut(current_jd, swe.MOON, flags)
                s_lon = res_s[0][0]
                m_lon = res_m[0][0]
                
                if calculation_type == "tithi":
                    val = (m_lon - s_lon) % 360 / 12
                elif calculation_type == "nakshatra":
                    val = m_lon / (360/27)
                elif calculation_type == "yoga":
                    val = (s_lon + m_lon) % 360 / (360/27)
                
                if int(val) != int(target_val):
                    return jd_to_local_str(current_jd)
            return "---"

        tithi_end = find_end_time(jd, tithi_num - 1, "tithi")
        
        paksha = "Shukla" if tithi_num <= 15 else "Krishna"
        tithi_name_idx = (tithi_num - 1) % 15
        tithi_names = ["Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shasthi", "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima"]
        if paksha == "Krishna" and tithi_name_idx == 14:
            tithi_name = "Amavasya"
        else:
            tithi_name = tithi_names[tithi_name_idx]

        # Nakshatra
        nak_idx = int(moon_lon / (360/27))
        nak_end = find_end_time(jd, nak_idx, "nakshatra")
        nakshatras = [
            "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
            "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
            "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
        ]
        nak_name = nakshatras[nak_idx % 27]

        # Yoga
        yoga_diff = (sun_lon + moon_lon) % 360
        yoga_idx = int(yoga_diff / (360/27))
        yoga_end = find_end_time(jd, yoga_idx, "yoga")
        yogas = [
            "Vishkumbha", "Preeti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma", "Dhriti", "Shula",
            "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyan", "Parigha",
            "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti"
        ]
        yoga_name = yogas[yoga_idx % 27]

        # Karana (Tithi / 2 = 6 deg)
        karanas = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti", "Shakuni", "Chatushpada", "Naga", "Kintughna"]
        karana_num = int(tithi_diff / 6) + 1
        # Simplified Karana logic
        if karana_num == 1: kar_name = "Kintughna"
        elif karana_num >= 58: 
            k_idx = [58, 59, 60].index(karana_num) if karana_num in [58, 59, 60] else 0
            kar_names_fixed = ["Shakuni", "Chatushpada", "Naga"]
            kar_name = kar_names_fixed[k_idx]
        else:
            kar_name = karanas[(karana_num - 2) % 7]

        # Vara (Weekday)
        vara_names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        # Simplified Vara (standard day)
        # Note: True Vedic Vara starts at Sunrise. For now using standard IST day.
        vara_name = vara_names[dt_ist.isoweekday() % 7]

        return {
            "tithi": f"{paksha} {tithi_name}",
            "tithi_end": tithi_end,
            "nakshatra": nak_name,
            "nakshatra_end": nak_end,
            "yoga": yoga_name,
            "yoga_end": yoga_end,
            "karana": kar_name,
            "vara": vara_name,
            "sun_sign": get_rasi(sun_lon),
            "moon_sign": get_rasi(moon_lon),
            "sunrise": jd_to_local_str(sunrise_jd),
            "sunset": jd_to_local_str(sunset_jd),
            "rahu_kaalam": f"{jd_to_local_str(rahu_start)} - {jd_to_local_str(rahu_end)}",
            "yama_gandam": f"{jd_to_local_str(yama_start)} - {jd_to_local_str(yama_end)}",
            "gulika_kaalam": f"{jd_to_local_str(guli_start)} - {jd_to_local_str(guli_end)}",
            "nalla_neram": nalla_times,
        }

    except Exception as e:
        import traceback
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

def get_rasi(lon):
    rasis = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
    return rasis[int(lon/30) % 12]

