import React from 'react';

export default function NorthIndianChart({ data }) {
  // Dimensions
  const size = 400;
  const center = size / 2;
  
  // House Polygons (Standard North Indian Diamond Layout)
  // Coordinates based on 400x400 box
  const houses = {
    1:  `200,200 100,100 200,0 300,100`, // Top Diamond
    2:  `100,100 0,0 200,0`,             // Top Left
    3:  `0,0 0,200 100,100`,             // Left Top
    4:  `200,200 100,100 0,200 100,300`, // Left Diamond
    5:  `0,200 0,400 100,300`,           // Left Bottom
    6:  `100,300 0,400 200,400`,         // Bottom Left
    7:  `200,200 100,300 200,400 300,300`, // Bottom Diamond
    8:  `200,400 400,400 300,300`,       // Bottom Right
    9:  `400,400 400,200 300,300`,       // Right Bottom
    10: `200,200 300,300 400,200 300,100`, // Right Diamond
    11: `400,200 400,0 300,100`,         // Right Top
    12: `300,100 400,0 200,0`            // Top Right
  };

  // Text Positions (Where to place planet text in each house)
  const textPos = {
    1:  { x: 200, y: 130 },
    2:  { x: 100, y: 40 },
    3:  { x: 40, y: 100 },
    4:  { x: 100, y: 200 },
    5:  { x: 40, y: 300 },
    6:  { x: 100, y: 360 },
    7:  { x: 200, y: 300 },
    8:  { x: 300, y: 360 },
    9:  { x: 360, y: 300 },
    10: { x: 300, y: 200 },
    11: { x: 360, y: 100 },
    12: { x: 300, y: 40 }
  };

  // Sign Number Positions (Where to put the small Rasi number)
  // usually in the corner of the house
  const signNumPos = {
    1:  { x: 200, y: 180 }, 
    2:  { x: 180, y: 20 },
    3:  { x: 20, y: 180 },
    4:  { x: 120, y: 200 },
    5:  { x: 20, y: 220 },
    6:  { x: 180, y: 380 },
    7:  { x: 200, y: 220 },
    8:  { x: 220, y: 380 },
    9:  { x: 380, y: 220 },
    10: { x: 280, y: 200 },
    11: { x: 380, y: 180 },
    12: { x: 220, y: 20 }
  };

  // Logic:
  // Identify Ascendant Sign Index (0-11)
  const ascIndex = Math.floor(data.ascendant / 30);

  // Distribute Planets into Houses relative to Ascendant
  const housePlanets = {}; // { 1: [], 2: [], ... }
  for (let i = 1; i <= 12; i++) housePlanets[i] = [];

  data.planets.forEach(p => {
    const planetSignIndex = Math.floor(p.lon / 30);
    // House = (PlanetSign - AscSign + 12) % 12 + 1
    const houseNum = ((planetSignIndex - ascIndex + 12) % 12) + 1;
    housePlanets[houseNum].push({
       name: p.name.substring(0, 2), // Short name
       isRetro: p.is_retrograde
    });
  });

  // Also add 'ASC' to House 1 explicitly? 
  // In North Indian, House 1 IS Ascendant by definition. 
  // We usually write the Sign Number there.

  return (
    <svg viewBox="0 0 400 400" className="w-full h-full bg-white text-xs font-serif shadow-lg rounded-lg border-2 border-amber-800">
      <defs>
         <linearGradient id="paperLines" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="100%" stopColor="#fef3c7" />
         </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#paperLines)" />

      {/* Draw Houses */}
      {Object.entries(houses).map(([num, points]) => (
        <polygon 
            key={num} 
            points={points} 
            fill="none" 
            stroke="#78350f" 
            strokeWidth="1.5"
        />
      ))}

      {/* Draw Sign Numbers (Rasi Numbers) */}
      {/* House 1 has Ascendant Sign Number, House 2 has Asc+1, etc. */}
      {Array(12).fill().map((_, i) => {
         const houseNum = i + 1;
         // Sign Number displayed is 1-based (Aries=1, Pisces=12)
         const signNum = ((ascIndex + i) % 12) + 1;
         const pos = signNumPos[houseNum];
         return (
             <text 
                key={`sign-${houseNum}`}
                x={pos.x} y={pos.y} 
                textAnchor="middle" 
                alignmentBaseline="middle"
                className="fill-amber-900/40 text-[10px] font-bold"
             >
                {signNum}
             </text>
         )
      })}

      {/* Draw Planets */}
      {Object.entries(housePlanets).map(([houseNum, planets]) => {
         const pos = textPos[houseNum];
         return (
             <g key={`p-${houseNum}`} transform={`translate(${pos.x}, ${pos.y})`}>
                {planets.map((p, i) => (
                    <text 
                        key={i} 
                        y={i * 12 - (planets.length * 6)} 
                        x={0}
                        textAnchor="middle"
                        className={`font-semibold ${p.isRetro ? "fill-red-600" : "fill-slate-900"}`}
                        style={{ fontSize: '11px' }}
                    >
                        {p.name}{p.isRetro ? "ᴿ" : ""}
                    </text>
                ))}
             </g>
         )
      })}
      
      <text x="390" y="390" textAnchor="end" className="text-[8px] fill-amber-900/50">North Indian Style</text>
    </svg>
  );
}
