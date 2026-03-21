import swisseph as swe
import datetime

# Test Ecliptic (default)
jd = swe.julday(2026, 3, 21, 12.0)
flags = swe.FLG_MOSEPH
try:
    res = swe.calc_ut(jd, swe.SUN, flags)
    print(f"Ecliptic res type: {type(res)}")
    print(f"Ecliptic res len: {len(res)}")
    print(f"Ecliptic res content: {res}")
except Exception as e:
    print(f"Ecliptic Error: {e}")

flags = swe.FLG_MOSEPH | swe.FLG_EQUATORIAL
try:
    res = swe.calc_ut(jd, swe.SUN, flags)
    print(f"res[0]: {res[0]}")
    print(f"res[1]: {res[1]}")
    print(f"res[2]: {res[2]}")
    print(f"FULL: {res}")
except Exception as e:
    print(f"Error accessing elements: {e}")

# Test with ALT/AZ just in case
try:
    geopos = (80.27, 13.08, 0) # lon, lat, alt
    # azalt might return different things in different versions
    res_equ_full = swe.calc_ut(jd, swe.SUN, flags)
    res_equ = res_equ_full[0]
    ra, dec, dist = res_equ[0], res_equ[1], res_equ[2]
    azalt_res = swe.azalt(jd, swe.EQU2HOR, geopos, 0, 0, (ra, dec, dist))
    print(f"AzAlt Result type: {type(azalt_res)}")
    print(f"AzAlt FULL: {azalt_res}")
    if isinstance(azalt_res, (tuple, list)):
        print(f"AzAlt len: {len(azalt_res)}")
        for i, val in enumerate(azalt_res):
            print(f"AzAlt[{i}]: {val}")
except Exception as e:
    import traceback
    print(f"AzAlt Error: {e}\n{traceback.format_exc()}")
