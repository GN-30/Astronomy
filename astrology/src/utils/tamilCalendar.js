// A lightweight utility to approximate the Tamil Calendar Date given a Gregorian Date.
// Note: This relies on standard fixed transitions and is approximate (+/- 1 day on certain leap/cyclic years).

const TAMIL_MONTHS = [
  "Chithirai", "Vaikasi", "Aani", "Aadi",
  "Aavani", "Purattasi", "Aippasi", "Karthigai",
  "Margazhi", "Thai", "Masi", "Panguni"
];

// Base start dates for each Tamil month in a standard non-leap year (e.g., 2023)
// Since Tamil months follow the solar calendar, the Gregorian dates are relatively fixed.
const MONTH_START_DATES = [
  { month: 0, day: 14, name: "Chithirai" }, // Apr 14
  { month: 1, day: 15, name: "Vaikasi" },   // May 15
  { month: 2, day: 15, name: "Aani" },      // Jun 15
  { month: 3, day: 17, name: "Aadi" },      // Jul 17
  { month: 4, day: 17, name: "Aavani" },    // Aug 17
  { month: 5, day: 17, name: "Purattasi" }, // Sep 17
  { month: 6, day: 18, name: "Aippasi" },   // Oct 18
  { month: 7, day: 17, name: "Karthigai" }, // Nov 17
  { month: 8, day: 16, name: "Margazhi" },  // Dec 16
  { month: 9, day: 15, name: "Thai" },      // Jan 15 (Next year)
  { month: 10, day: 13, name: "Masi" },     // Feb 13
  { month: 11, day: 14, name: "Panguni" }   // Mar 14
];

export const getTamilDate = (dateString) => {
  if (!dateString) return null;

  const targetDate = new Date(dateString);
  const targetMonth = targetDate.getMonth(); // 0-11
  const targetDay = targetDate.getDate();
  const year = targetDate.getFullYear();

  // Find the current Tamil month
  // We need to check if the date falls before or after the transition day for the current Gregorian month
  let tamilMonthIndex = -1;
  let startGregorianDate = null;

  // Let's iterate and find where the date fits
  for (let i = 0; i < MONTH_START_DATES.length; i++) {
    // Current mapping (e.g., Apr 14 -> Chithirai)
    const current = MONTH_START_DATES[i];
    // Next mapping (e.g., May 15 -> Vaikasi)
    const nextIdx = (i + 1) % MONTH_START_DATES.length;
    const next = MONTH_START_DATES[nextIdx];

    let startMonth = i < 9 ? i + 3 : i - 9; // Map index 0 (Chithirai) to April (3)
    let endMonth = nextIdx < 9 ? nextIdx + 3 : nextIdx - 9;
    
    // For Margazhi (Dec-Jan crossover)
    let startYear = year;
    let endYear = year;
    
    // Adjust years for winter months (Thai, Masi, Panguni are early in the year)
    if (startMonth >= 9 && startMonth <= 11) { // Jan(0)=9, Feb(1)=10, Mar(2)=11 in our index mapping roughly
         // Wait, let's just map explicitly using the gregorian month of the start date
    }

    // A simpler approach: create actual JS Date objects for the transition boundaries around the target date
    const grMonth = (i + 3) % 12; // Chithirai(0) -> Apr(3)
    const grYear = (grMonth < 3) ? (i >= 9 ? year + 1 : year) : year; // Adjust year for Thai, Masi, Panguni vs Margazhi
  }

  // Rewrite logic to be much simpler using day of year or explicit date comparison
  // A clean, readable approach:
  const checkDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  
  // Transition dates for the current Gregorian year (Adjusted +1 day to match exact solar dates for the year)
  const transitions = [
    { tamilIndex: 9, date: new Date(year, 0, 15) },   // Thai starts Jan 15 (Usually 14 or 15)
    { tamilIndex: 10, date: new Date(year, 1, 13) },  // Masi starts Feb 13
    { tamilIndex: 11, date: new Date(year, 2, 15) },  // Panguni starts Mar 15
    { tamilIndex: 0, date: new Date(year, 3, 14) },   // Chithirai starts Apr 14
    { tamilIndex: 1, date: new Date(year, 4, 15) },   // Vaikasi starts May 15
    { tamilIndex: 2, date: new Date(year, 5, 15) },   // Aani starts Jun 15
    { tamilIndex: 3, date: new Date(year, 6, 17) },   // Aadi starts Jul 17
    { tamilIndex: 4, date: new Date(year, 7, 17) },   // Aavani starts Aug 17
    { tamilIndex: 5, date: new Date(year, 8, 17) },   // Purattasi starts Sep 17
    { tamilIndex: 6, date: new Date(year, 9, 18) },   // Aippasi starts Oct 18
    { tamilIndex: 7, date: new Date(year, 10, 17) },  // Karthigai starts Nov 17
    { tamilIndex: 8, date: new Date(year, 11, 16) },  // Margazhi starts Dec 16
    { tamilIndex: 9, date: new Date(year + 1, 0, 15) } // Next Thai starts Jan 15 next year
  ];

  // If the date is before Jan 15, it's Margazhi of the previous year
  if (checkDate < transitions[0].date) {
    const prevMargazhiStart = new Date(year - 1, 11, 16);
    const diffTime = Math.abs(checkDate - prevMargazhiStart);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return {
      month: TAMIL_MONTHS[8],
      day: diffDays,
      formatted: `${TAMIL_MONTHS[8]} ${diffDays}, ${year}`
    };
  }

  // Otherwise, find which boundary it falls into
  for (let i = 0; i < transitions.length - 1; i++) {
    if (checkDate >= transitions[i].date && checkDate < transitions[i + 1].date) {
      const diffTime = Math.abs(checkDate - transitions[i].date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      return {
        month: TAMIL_MONTHS[transitions[i].tamilIndex],
        day: diffDays,
        formatted: `${TAMIL_MONTHS[transitions[i].tamilIndex]} ${diffDays}, ${year}`
      };
    }
  }

  return null;
};
