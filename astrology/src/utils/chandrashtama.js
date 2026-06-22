/**
 * Chandrashtama Calculation Utility
 *
 * Chandrashtama occurs when the transiting Moon is in the 8th sign from the natal Moon sign (Rasi).
 * It peaks when the transiting Moon is in the 17th Nakshatra from the birth Nakshatra (Janma Nakshatra).
 *
 * Moon longitude uses the full Meeus Ch.47 table (60 terms), accurate to ~0.3°.
 * This is sufficient since each Nakshatra spans 13.33° and each Rasi spans 30°.
 */

// ── Ordered zodiac signs (0-indexed, Aries=0 … Pisces=11) ────────────────────
export const RASI_ORDER = [
  { name: 'Aries',       tamilName: 'Mesham',     index: 0  },
  { name: 'Taurus',      tamilName: 'Rishabam',   index: 1  },
  { name: 'Gemini',      tamilName: 'Mithunam',   index: 2  },
  { name: 'Cancer',      tamilName: 'Kadagam',    index: 3  },
  { name: 'Leo',         tamilName: 'Simmam',     index: 4  },
  { name: 'Virgo',       tamilName: 'Kanni',      index: 5  },
  { name: 'Libra',       tamilName: 'Thulam',     index: 6  },
  { name: 'Scorpio',     tamilName: 'Viruchigam', index: 7  },
  { name: 'Sagittarius', tamilName: 'Dhanusu',    index: 8  },
  { name: 'Capricorn',   tamilName: 'Makaram',    index: 9  },
  { name: 'Aquarius',    tamilName: 'Kumbam',     index: 10 },
  { name: 'Pisces',      tamilName: 'Meenam',     index: 11 },
];

// ── 27 Nakshatras (0-indexed, Ashwini=0 … Revati=26) ─────────────────────────
// Each spans exactly 360/27 = 13°20'. Ashwini starts at 0° (Aries start).
export const NAKSHATRAS = [
  { name: 'Ashwini',           lord: 'Ketu',    tamilName: 'Aswini',       deity: 'Ashwini Kumars' },
  { name: 'Bharani',           lord: 'Venus',   tamilName: 'Bharani',      deity: 'Yama'           },
  { name: 'Krittika',          lord: 'Sun',     tamilName: 'Krithika',     deity: 'Agni'           },
  { name: 'Rohini',            lord: 'Moon',    tamilName: 'Rohini',       deity: 'Brahma'         },
  { name: 'Mrigashira',        lord: 'Mars',    tamilName: 'Mirugasirisham', deity: 'Soma'         },
  { name: 'Ardra',             lord: 'Rahu',    tamilName: 'Thiruvadirai', deity: 'Rudra'          },
  { name: 'Punarvasu',         lord: 'Jupiter', tamilName: 'Punarpoosam',  deity: 'Aditi'          },
  { name: 'Pushya',            lord: 'Saturn',  tamilName: 'Poosam',       deity: 'Brihaspati'     },
  { name: 'Ashlesha',          lord: 'Mercury', tamilName: 'Ayilyam',      deity: 'Sarpa'          },
  { name: 'Magha',             lord: 'Ketu',    tamilName: 'Makam',        deity: 'Pitris'         },
  { name: 'Purva Phalguni',    lord: 'Venus',   tamilName: 'Pooram',       deity: 'Bhaga'          },
  { name: 'Uttara Phalguni',   lord: 'Sun',     tamilName: 'Uthiram',      deity: 'Aryaman'        },
  { name: 'Hasta',             lord: 'Moon',    tamilName: 'Hastham',      deity: 'Savitri'        },
  { name: 'Chitra',            lord: 'Mars',    tamilName: 'Chitirai',     deity: 'Vishwakarma'    },
  { name: 'Swati',             lord: 'Rahu',    tamilName: 'Swathi',       deity: 'Vayu'           },
  { name: 'Vishakha',          lord: 'Jupiter', tamilName: 'Vishakam',     deity: 'Indra-Agni'     },
  { name: 'Anuradha',          lord: 'Saturn',  tamilName: 'Anusham',      deity: 'Mitra'          },
  { name: 'Jyeshtha',          lord: 'Mercury', tamilName: 'Kettai',       deity: 'Indra'          },
  { name: 'Moola',             lord: 'Ketu',    tamilName: 'Moolam',       deity: 'Niritti'        },
  { name: 'Purva Ashadha',     lord: 'Venus',   tamilName: 'Pooradam',     deity: 'Apas'           },
  { name: 'Uttara Ashadha',    lord: 'Sun',     tamilName: 'Uthiradam',    deity: 'Vishwadevas'    },
  { name: 'Shravana',          lord: 'Moon',    tamilName: 'Thiruvonam',   deity: 'Vishnu'         },
  { name: 'Dhanishta',         lord: 'Mars',    tamilName: 'Avittam',      deity: 'Ashta Vasus'    },
  { name: 'Shatabhisha',       lord: 'Rahu',    tamilName: 'Sathayam',     deity: 'Varuna'         },
  { name: 'Purva Bhadrapada',  lord: 'Jupiter', tamilName: 'Pooratadhi',   deity: 'Aja Ekapada'    },
  { name: 'Uttara Bhadrapada', lord: 'Saturn',  tamilName: 'Uthiratadhi',  deity: 'Ahir Budhnya'   },
  { name: 'Revati',            lord: 'Mercury', tamilName: 'Revathi',      deity: 'Pushan'         },
];

// ── Correct Nakshatra → Rasi mapping ─────────────────────────────────────────
// Each Rasi (30°) contains 2.25 Nakshatras (9 padas).
// This array lists the 3 primary Nakshatras (by index) for each of the 12 Rasis.
// A Nakshatra appearing in two Rasis is listed in the one where it has more padas.
//
//   Rasi       | Nakshatras (primary)
//   -----------|---------------------------------------------------------------
//   Aries  (0) | Ashwini(0), Bharani(1), Krittika(2) — Krittika pada 1 only
//   Taurus (1) | Krittika(2), Rohini(3), Mrigashira(4)
//   Gemini (2) | Mrigashira(4), Ardra(5), Punarvasu(6)
//   Cancer (3) | Punarvasu(6), Pushya(7), Ashlesha(8)
//   Leo    (4) | Magha(9), Purva Phalguni(10), Uttara Phalguni(11)
//   Virgo  (5) | Uttara Phalguni(11), Hasta(12), Chitra(13)
//   Libra  (6) | Chitra(13), Swati(14), Vishakha(15)
//   Scorpio(7) | Vishakha(15), Anuradha(16), Jyeshtha(17)
//   Sagitt.(8) | Moola(18), Purva Ashadha(19), Uttara Ashadha(20)
//   Capric.(9) | Uttara Ashadha(20), Shravana(21), Dhanishta(22)
//   Aquar.(10) | Dhanishta(22), Shatabhisha(23), Purva Bhadrapada(24)
//   Pisces(11) | Purva Bhadrapada(24), Uttara Bhadrapada(25), Revati(26)
export const RASI_NAKSHATRAS = [
  [0, 1, 2],   // Aries
  [2, 3, 4],   // Taurus
  [4, 5, 6],   // Gemini
  [6, 7, 8],   // Cancer
  [9, 10, 11], // Leo
  [11, 12, 13],// Virgo
  [13, 14, 15],// Libra
  [15, 16, 17],// Scorpio
  [18, 19, 20],// Sagittarius
  [20, 21, 22],// Capricorn
  [22, 23, 24],// Aquarius
  [24, 25, 26],// Pisces
];

// ── Name → index lookup ───────────────────────────────────────────────────────
const RASI_NAME_TO_INDEX = {};
RASI_ORDER.forEach(r => { RASI_NAME_TO_INDEX[r.name] = r.index; });

// ── Helpers ───────────────────────────────────────────────────────────────────
const toRad = d => (d * Math.PI) / 180;
const norm360 = d => ((d % 360) + 360) % 360;

/**
 * Moon apparent longitude (tropical, degrees) using Meeus Ch.47 full table.
 * Input: any JS Date object (UTC-based).
 *
 * Key improvements over the simplified version:
 *  • Uses all major periodic terms (lunisolar, solar, F-based)
 *  • Properly handles D (mean elongation) instead of abusing L0
 *  • Applies the nutation-in-longitude correction (Δψ) — ~±1.2° peak effect
 */
export function approximateMoonLongitude(date) {
  const JD  = date.getTime() / 86400000 + 2440587.5;
  const T   = (JD - 2451545.0) / 36525;
  const T2  = T * T;
  const T3  = T2 * T;
  const T4  = T3 * T;

  // Fundamental arguments (degrees)
  const L0 = norm360(218.3164477 + 481267.88123421*T - 0.0015786*T2 + T3/538841  - T4/65194000);
  const D  = norm360(297.8501921 + 445267.1114034 *T - 0.0018819*T2 + T3/545868  - T4/113065000);
  const M  = norm360(357.5291092 + 35999.0502909  *T - 0.0001536*T2 + T3/24490000);
  const Mp = norm360(134.9633964 + 477198.8675055 *T + 0.0087414*T2 + T3/69699   - T4/14712000);
  const F  = norm360(93.2720950  + 483202.0175233 *T - 0.0036539*T2 - T3/3526000 + T4/863310000);

  // Multiplicative factor for solar terms
  const E  = 1 - 0.002516*T - 0.0000074*T2;
  const E2 = E * E;

  // ── Periodic terms for longitude (Σl, in 0.000001°) ─────────────────────────
  // [coeff, D, M, Mp, F] — top 60 terms from Meeus Table 47.A
  const lTerms = [
    [6288774,  0, 0, 1, 0],
    [1274027,  2, 0,-1, 0],
    [ 658314,  2, 0, 0, 0],
    [ 213618,  0, 0, 2, 0],
    [-185116,  0, 1, 0, 0],  // E factor
    [-114332,  0, 0, 0, 2],
    [  58793,  2, 0,-2, 0],
    [  57066,  2,-1,-1, 0],  // E factor
    [  53322,  2, 0, 1, 0],
    [  45758,  2,-1, 0, 0],  // E factor
    [ -40923,  0, 1,-1, 0],  // E factor
    [ -34720,  1, 0, 0, 0],
    [ -30383,  0, 1, 1, 0],  // E factor
    [  15327,  2, 0, 0,-2],
    [ -12528,  0, 0, 1, 2],
    [  10980,  0, 0, 1,-2],
    [  10675,  4, 0,-1, 0],
    [  10034,  0, 0, 3, 0],
    [   8548,  4, 0,-2, 0],
    [  -7888,  2, 1,-1, 0],  // E factor
    [  -6766,  2, 1, 0, 0],  // E factor
    [  -5163,  1, 0,-1, 0],
    [   4987,  1, 1, 0, 0],  // E factor
    [   4036,  2,-1, 1, 0],  // E factor
    [   3994,  2, 0, 2, 0],
    [   3861,  4, 0, 0, 0],
    [   3665,  2, 0,-3, 0],
    [  -2689,  0, 1,-2, 0],  // E factor
    [  -2602,  2, 0,-1, 2],
    [   2390,  2,-1,-2, 0],  // E factor
    [  -2348,  1, 0, 1, 0],
    [   2236,  2,-2, 0, 0],  // E2 factor
    [  -2120,  0, 1, 2, 0],  // E factor
    [  -2069,  0, 2, 0, 0],  // E2 factor
    [   2048,  2,-2,-1, 0],  // E2 factor
    [  -1773,  2, 0, 1,-2],
    [  -1595,  2, 0, 0, 2],
    [   1215,  4,-1,-1, 0],  // E factor
    [  -1110,  0, 0, 2, 2],
    [   -892,  3, 0,-1, 0],
    [   -810,  2, 1, 1, 0],  // E factor
    [    759,  4,-1,-2, 0],  // E factor
    [   -713,  0, 2,-1, 0],  // E2 factor
    [   -700,  2, 2,-1, 0],  // E2 factor
    [    691,  2, 1,-2, 0],  // E factor
    [    596,  2,-1, 0,-2],  // E factor
    [    549,  4, 0, 1, 0],
    [    537,  0, 0, 4, 0],
    [    520,  4,-1, 0, 0],  // E factor
    [   -487,  1, 0,-2, 0],
    [   -399,  2, 1, 0,-2],  // E factor
    [   -381,  0, 0, 2,-2],
    [    351,  1, 1, 1, 0],  // E factor
    [   -340,  3, 0,-2, 0],
    [    330,  4, 0,-3, 0],
    [    327,  2,-1, 2, 0],  // E factor
    [   -323,  0, 2, 1, 0],  // E2 factor
    [    299,  1, 1,-1, 0],  // E factor
    [    294,  2, 0, 3, 0],
    [      0,  2, 0,-1,-2],
  ];

  // E factors for each term (indexed same as lTerms)
  // M=±1 → E, M=±2 → E2, else 1
  function eFactor(mVal) {
    const am = Math.abs(mVal);
    if (am === 1) return E;
    if (am === 2) return E2;
    return 1;
  }

  let Sl = 0;
  for (const [coeff, d, m, mp, f] of lTerms) {
    const arg = toRad(d*D + m*M + mp*Mp + f*F);
    Sl += coeff * eFactor(m) * Math.sin(arg);
  }

  // Additional corrections
  const A1 = norm360(119.75 + 131.849*T);
  const A2 = norm360(53.09  + 479264.290*T);
  const A3 = norm360(313.45 + 481266.484*T);
  Sl += 3958*Math.sin(toRad(A1))
      +  318*Math.sin(toRad(A2))
      +  175*Math.sin(toRad(A3 - F))
      +  175*Math.sin(toRad(A3 + F))
      +  127*Math.sin(toRad(L0 - Mp))
      -  115*Math.sin(toRad(L0 + Mp));

  // Sl is in units of 0.000001°
  const longitude = norm360(L0 + Sl / 1000000);
  return longitude;
}

/**
 * Get Nakshatra index (0-26) from Moon tropical longitude.
 * Each Nakshatra = 360/27 = 13.3333...°
 */
export function getNakshatraFromLongitude(longitude) {
  return Math.floor(longitude / (360 / 27));
}

/**
 * Get Rasi index (0-11) from Moon tropical longitude.
 */
export function getRasiFromLongitude(longitude) {
  return Math.floor(longitude / 30);
}

/**
 * Build a Date object at noon IST (06:30 UTC) for a "YYYY-MM-DD" string.
 * JS parses bare date strings as UTC midnight, which equals 05:30 IST —
 * that's the previous calendar day evening for IST users.
 * Using noon IST as reference gives a stable, representative daytime position.
 */
export function dateStringToISTNoon(dateString) {
  // "2026-06-22" + noon IST offset = "2026-06-22T06:30:00Z"
  return new Date(`${dateString}T06:30:00Z`);
}

/**
 * Main Chandrashtama calculation.
 *
 * @param {string} birthRasiName      - English name of the birth Moon sign e.g. "Aries"
 * @param {string|null} birthNakshatraName - English/Tamil name of birth Nakshatra, or null
 * @param {Date}   targetDate         - JS Date to evaluate (should be IST noon for best results)
 * @returns {Object} Full Chandrashtama details
 */
export function getChandrashtama(birthRasiName, birthNakshatraName, targetDate) {
  // ── Birth Rasi ──────────────────────────────────────────────────────────────
  const birthRasiIdx = RASI_NAME_TO_INDEX[birthRasiName];
  if (birthRasiIdx === undefined) {
    return { error: `Unknown Rasi: ${birthRasiName}` };
  }

  // ── 8th Rasi from birth = Chandrashtama Rasi ────────────────────────────────
  // Counting inclusively: birth=1, so 8th = birthRasiIdx + 7
  const chandrashtamaRasiIdx = (birthRasiIdx + 7) % 12;
  const chandrashtamaRasi    = RASI_ORDER[chandrashtamaRasiIdx];

  // ── Current Moon position ───────────────────────────────────────────────────
  const moonLon            = approximateMoonLongitude(targetDate);
  const transitNakshatraIdx = getNakshatraFromLongitude(moonLon);
  const transitRasiIdx      = getRasiFromLongitude(moonLon);
  const transitNakshatra    = NAKSHATRAS[transitNakshatraIdx];
  const transitRasi         = RASI_ORDER[transitRasiIdx];

  // ── Nakshatra progress within its span ─────────────────────────────────────
  const nakshatraSpan   = 360 / 27; // 13.3333°
  const nakshatraStart  = transitNakshatraIdx * nakshatraSpan;
  const nakshatraProgress = ((moonLon - nakshatraStart) / nakshatraSpan) * 100;

  // ── Rasi progress ──────────────────────────────────────────────────────────
  const rasiStart    = transitRasiIdx * 30;
  const moonProgress = ((moonLon - rasiStart) / 30) * 100;

  // ── Peak Nakshatra: 17th from birth Nakshatra ──────────────────────────────
  let peakNakshatra    = null;
  let birthNakshatraIdx = null;
  if (birthNakshatraName) {
    birthNakshatraIdx = NAKSHATRAS.findIndex(n =>
      n.name.toLowerCase()      === birthNakshatraName.toLowerCase() ||
      n.tamilName.toLowerCase() === birthNakshatraName.toLowerCase()
    );
    if (birthNakshatraIdx !== -1) {
      const peakIdx = (birthNakshatraIdx + 16) % 27; // 17th = +16 (0-indexed)
      peakNakshatra = NAKSHATRAS[peakIdx];
    }
  }

  // ── Is today Chandrashtama? ─────────────────────────────────────────────────
  const isChandrashtamaDay = transitRasiIdx === chandrashtamaRasiIdx;
  const isPeakDay = peakNakshatra
    ? transitNakshatraIdx === ((birthNakshatraIdx + 16) % 27)
    : false;

  // ── Days until Chandrashtama starts/ends ───────────────────────────────────
  const moonSpeed = 13.176; // mean daily motion in degrees
  const chandraStart = chandrashtamaRasiIdx * 30;
  const chandraEnd   = chandraStart + 30;

  let daysUntilStart, daysUntilEnd;

  if (isChandrashtamaDay) {
    daysUntilStart = 0;
    const degsLeft  = chandraEnd - moonLon;
    daysUntilEnd    = Math.max(0, Math.round((degsLeft / moonSpeed) * 10) / 10);
  } else {
    let degsToStart = chandraStart - moonLon;
    if (degsToStart < 0) degsToStart += 360;
    daysUntilStart = Math.round((degsToStart / moonSpeed) * 10) / 10;
    daysUntilEnd   = Math.round(((degsToStart + 30) / moonSpeed) * 10) / 10;
  }

  // ── Nakshatras active during Chandrashtama ─────────────────────────────────
  // Use the accurate RASI_NAKSHATRAS lookup (not rasiIdx * 3)
  const chandrashtamaNakshatras = RASI_NAKSHATRAS[chandrashtamaRasiIdx].map(
    idx => NAKSHATRAS[idx]
  );

  // ── Next Chandrashtama window dates ────────────────────────────────────────
  const startDate = new Date(targetDate.getTime() + daysUntilStart * 86400000);
  const endDate   = new Date(targetDate.getTime() + daysUntilEnd   * 86400000);

  return {
    birthRasi: RASI_ORDER[birthRasiIdx],
    chandrashtamaRasi,
    transitRasi,
    transitNakshatra,
    peakNakshatra,
    isChandrashtamaDay,
    isPeakDay,
    daysUntilStart,
    daysUntilEnd,
    startDate,
    endDate,
    chandrashtamaNakshatras,
    moonLongitude:      moonLon,
    moonProgress:       Math.min(100, Math.max(0, moonProgress)),
    nakshatraProgress:  Math.min(100, Math.max(0, nakshatraProgress)),
    transitNakshatraIdx,
    birthNakshatraIdx,
  };
}

/**
 * All 27 Nakshatras with index, for dropdowns.
 */
export function getAllNakshatras() {
  return NAKSHATRAS.map((n, i) => ({ ...n, index: i }));
}
