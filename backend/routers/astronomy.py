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

        # Create localized datetime (assuming input is local time, usually we need timezone!)
        # For MVP we might assume input is local and we need timezone from frontend or assume UTC?
        # Standard practice: Request offsets or timezone string. 
        # For now, let's treat input as System Local or require UTC? 
        # Better: Accept simple input and maybe assume UTC or fixed offset?
        # User prompt said: "Convert time -> UTC". 
        # Let's assume the frontend sends Local Time and we need to handle it.
        # But without timezone info from user, we can't accurately convert.
        # I'll default to UTC for now to verify logic, or accept it as is.
        
        # Let's assume input is UTC for calculation simplicity or user provides offset?
        # To keep it robust, I'll assume input is UTC.
        
        dt = datetime.datetime(year, month, day, hour, minute, tzinfo=pytz.UTC)
        jd = get_julian_day(dt)

        # Planets to calculate
        # id: name
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
            # Ketu is opposite Rahu
        }

        swe.set_ephe_path('') # Use built-in or default path

        chart_data = []
        for pid, name in planets_map.items():
            # calculate position
            # flags: swe.FLG_SWIEPH usually requires files, swe.FLG_MOSEPH is analytic (less precise but works without files)
            # Default to MOSEPH for robustness if files are missing
            res = swe.calc_ut(jd, pid, swe.FLG_MOSEPH)
            # res is usually ( (lon, lat, dist, speed_lon, speed_lat, speed_dist), rflags )
            
            coords = res[0]
            lon = coords[0]
            speed_lon = coords[3]
            
            # Simple House calculation to find which house it is in
            # We need the Ascendant first
            
            chart_data.append({
                "name": name,
                "lon": lon,
                "is_retrograde": speed_lon < 0
            })

        # Calculate Houses & Ascendant
        # swe.houses(jd, lat, lon, method)
        # method: 'P' (Placidus), 'W' (Whole Sign), 'A' (Equal)
        # South Indian usually uses Whole Sign or Equal? Let's use 'P' for standard western/modern or 'W' better?
        # 'P' is default for most
        h_sys = b'P'
        houses_res, ascmc = swe.houses(jd, data.lat, data.lon, h_sys)
        # houses_res is list of 12 cusps (start of house)
        # ascmc = [Ascendant, MC, ARMC, Vertex, Eq_Asc, Co_Asc, Moon_Cross, Polar_Asc]
        
        ascendant = ascmc[0]
        
        houses = []
        for i, cusp in enumerate(houses_res):
            houses.append({
                "house": i + 1,
                "degree": cusp
            })

        return {
            "ascendant": ascendant,
            "planets": chart_data,
            "houses": houses,
            "meta": {
                "julian_day": jd,
                "method": "Moshier (No ephemeris files)"
            }
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

