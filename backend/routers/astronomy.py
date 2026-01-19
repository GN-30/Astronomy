from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import swisseph as swe
import datetime
import pytz

router = APIRouter(prefix="/api/astronomy", tags=["Astronomy"])

class BirthDetails(BaseModel):
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

        # Handle Timezone: Assuming Input is Indian Standard Time (IST) -> UTC
        # IST is UTC + 5:30. So UTC = IST - 5:30.
        dt_ist = datetime.datetime(year, month, day, hour, minute)
        dt_utc = dt_ist - datetime.timedelta(hours=5, minutes=30)
        
        jd = get_julian_day(dt_utc)

        # Set Sidereal Mode (Lahiri Ayanamsa for Vedic Astrology)
        swe.set_sid_mode(swe.SIDM_LAHIRI)

        # Planets to calculate
        planets_map = {
            swe.SUN: "Sun",
            swe.MOON: "Moon",
            swe.MERCURY: "Mercury",
            swe.VENUS: "Venus",
            swe.MARS: "Mars",
            swe.JUPITER: "Jupiter",
            swe.SATURN: "Saturn",
            swe.URANUS: "Uranus",
            swe.NEPTUNE: "Neptune",
            swe.PLUTO: "Pluto",
            swe.MEAN_NODE: "Rahu", # North Node
        }

        swe.set_ephe_path('') 
        flags = swe.FLG_MOSEPH | swe.FLG_SIDEREAL | swe.FLG_SPEED 

        chart_data = []
        rahu_data = None

        for pid, name in planets_map.items():
            res = swe.calc_ut(jd, pid, flags)
            coords = res[0]
            lon = coords[0]
            speed_lon = coords[3]
            
            is_retro = speed_lon < 0
            
            # Special logic for Nodes if needed, but usually Mean Node speed is negative
            
            planet_info = {
                "name": name,
                "lon": lon,
                "is_retrograde": is_retro,
                "speed": speed_lon
            }
            chart_data.append(planet_info)
            
            if name == "Rahu":
                rahu_data = planet_info

        # Calculate Ketu (Opposite to Rahu)
        if rahu_data:
            ketu_lon = (rahu_data["lon"] + 180.0) % 360.0
            chart_data.append({
                "name": "Ketu",
                "lon": ketu_lon,
                "is_retrograde": True # Nodes are always retrograde (Mean)
            })

        # Calculate Houses (Sidereal)
        # Use Whole Sign (W) for Vedic Rasi Chart compatibility
        h_sys = b'W'
        houses_res, ascmc = swe.houses_ex(jd, data.lat, data.lon, h_sys, flags)
        ascendant = ascmc[0]
        
        houses = []
        for i, cusp in enumerate(houses_res):
            houses.append({
                "house": i + 1,
                "degree": cusp
            })
            
        # Debugging Print
        print(f"Chart Calc: {data.dob} {data.time} (UTC: {dt_utc})")
        for p in chart_data:
            print(f"{p['name']}: {p['lon']:.2f} Speed: {p.get('speed', 0):.6f} Retro: {p['is_retrograde']}")

        return {
            "ascendant": ascendant,
            "planets": chart_data,
            "houses": houses,
            "meta": {
                "julian_day": jd,
                "ayanamsa": "Lahiri (Sidereal)",
                "timezone": "IST assumed (-5:30)",
                "house_system": "Whole Sign"
            }
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

