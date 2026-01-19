import { useState, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Clock, RefreshCw, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import bgImage from '../assets/birthchart_bg.png';
import NorthIndianChart from '../components/NorthIndianChart';

export default function BirthChart() {
  const [formData, setFormData] = useState({
    dob: '',
    time: '',
    place: 'Chennai',
    lat: '13.0827',
    lon: '80.2707' 
  });
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const chartRef = useRef(null);
  const [chartType, setChartType] = useState('south'); // 'south' or 'north'

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
// ... (keep generateChart same)

  const generateChart = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/api/astronomy/chart', {
        ...formData,
        lat: parseFloat(formData.lat),
        lon: parseFloat(formData.lon)
      });
      setChartData(res.data);
    } catch (err) {
      console.error(err);
      alert("Error generating chart");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!chartRef.current) {
        alert("Chart not found. Please regenerate.");
        return;
    }
    
    try {
        const dataUrl = await toPng(chartRef.current, { 
            cacheBust: true, 
            backgroundColor: '#0f172a',
            style: { transform: 'scale(1)' } 
        });
        
        const link = document.createElement('a');
        link.download = `birth-chart-${chartType}-${formData.dob || 'chart'}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (err) {
        console.error("Download failed:", err);
        alert(`Download failed: ${err.message}`);
    }
  };

  return (
    <div 
      className="min-h-screen py-10 px-4 pb-24 bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] fixed pointer-events-none"></div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* Input Form */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sticky top-24">
            <h2 className="text-2xl font-bold text-white mb-6">Birth Details</h2>
            <form onSubmit={generateChart} className="space-y-4">
              {/* ... inputs same ... */}
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 text-slate-500" size={16} />
                  <input 
                    type="date" name="dob" required
                    value={formData.dob} onChange={handleChange}
                    className="w-full bg-slate-800 border-slate-700 rounded-lg pl-10 py-2.5 text-white focus:ring-purple-500 focus:border-purple-500 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Time of Birth</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 text-slate-500" size={16} />
                  <input 
                    type="time" name="time" required
                    value={formData.time} onChange={handleChange}
                    className="w-full bg-slate-800 border-slate-700 rounded-lg pl-10 py-2.5 text-white focus:ring-purple-500 focus:border-purple-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Latitude</label>
                   <input 
                      type="number" step="any" name="lat" required
                      value={formData.lat} onChange={handleChange}
                      className="w-full bg-slate-800 border-slate-700 rounded-lg py-2.5 px-3 text-white focus:ring-purple-500 focus:border-purple-500"
                    />
                </div>
                <div>
                   <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Longitude</label>
                   <input 
                      type="number" step="any" name="lon" required
                      value={formData.lon} onChange={handleChange}
                      className="w-full bg-slate-800 border-slate-700 rounded-lg py-2.5 px-3 text-white focus:ring-purple-500 focus:border-purple-500"
                    />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-purple-900/20 active:scale-95 transition-all cursor-pointer"
              >
                {loading ? <RefreshCw className="animate-spin mx-auto" /> : "Generate Chart"}
              </button>
            </form>
          </div>
        </div>

        {/* Chart Display */}
        <div className="lg:col-span-2">
          {chartData ? (
            <div className="space-y-6">
              
              {/* Type Toggle */}
              <div className="flex bg-slate-900/80 p-1 rounded-lg border border-slate-700 w-fit mx-auto">
                 <button 
                    onClick={() => setChartType('south')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${chartType === 'south' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                 >
                    South Indian
                 </button>
                 <button 
                    onClick={() => setChartType('north')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${chartType === 'north' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                 >
                    North Indian
                 </button>
              </div>

              {/* Capture Area */}
              <div ref={chartRef} data-chart-container className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-end mb-4">
                      <div>
                          <h3 className="text-xl font-bold text-white">Janma Kundli</h3>
                          <p className="text-sm text-slate-400">{formData.dob} at {formData.time} ({chartType === 'south' ? 'South' : 'North'} Style)</p>
                      </div>
                  </div>
                  
                  {/* Main Chart Visualization */}
                  <div className="bg-white rounded-lg p-4 shadow-xl aspect-square max-w-md mx-auto relative overflow-hidden text-black">
                    {chartType === 'south' ? (
                        <SouthIndianChart data={chartData} />
                    ) : (
                        <NorthIndianChart data={chartData} />
                    )}
                  </div>
              </div>

              {/* Download Button */}
              <button 
                onClick={handleDownload}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Download size={20} /> Download Chart Image
              </button>
              
              {/* Planetary Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mt-6">
                <table className="min-w-full divide-y divide-slate-800">
                  <thead className="bg-slate-950">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Planet</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Longitude</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-900 divide-y divide-slate-800">
                    {chartData.planets.map((planet) => (
                      <tr key={planet.name} className="hover:bg-slate-800/50 cursor-default">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{planet.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          {Math.floor(planet.lon)}° {(planet.lon % 1 * 60).toFixed(0)}'
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          {planet.is_retrograde ? <span className="text-red-400 font-bold">R</span> : <span className="text-green-400">D</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl min-h-[400px]">
              <MapPin size={48} className="mb-4 opacity-50" />
              <p>Enter birth details to generate the chart</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple South Indian Chart Component
function SouthIndianChart({ data }) {
  const signPlanets = Array(12).fill().map(() => []);
  
  data.planets.forEach(p => {
    const signIndex = Math.floor(p.lon / 30);
    signPlanets[signIndex].push(p.name.substring(0, 2)); 
  });

  const ascIndex = Math.floor(data.ascendant / 30);
  signPlanets[ascIndex].push("ASC");

  const renderCell = (signIndex, label) => (
    <div className="border border-amber-900/20 w-full h-full p-1 relative bg-amber-50 text-amber-900 text-xs font-semibold flex flex-wrap content-start gap-1">
      {signPlanets[signIndex].map((p, i) => (
         <span key={i} className="bg-amber-100 px-1 rounded">{p}</span>
      ))}
      <span className="absolute bottom-0 right-1 text-[10px] opacity-40 uppercase">{label}</span>
      {/* Highlight Ascendant House */}
      {signIndex === ascIndex && <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-bl-lg" title="Lagna" />}
    </div>
  );

  return (
    <div className="w-full h-full grid grid-cols-4 grid-rows-4 border-2 border-amber-800">
      {/* Row 1 */}
      {renderCell(11, "Pisces")}
      {renderCell(0, "Aries")}
      {renderCell(1, "Taurus")}
      {renderCell(2, "Gemini")}

      {/* Row 2 */}
      {renderCell(10, "Aquarius")}
      <div className="col-span-2 row-span-2 flex items-center justify-center bg-amber-50/50">
        <div className="text-center">
            <h3 className="font-serif text-amber-900 text-xl font-bold">Rāsi Chart</h3>
            <p className="text-[10px] text-amber-700">South Indian Style</p>
        </div>
      </div>
      {renderCell(3, "Cancer")}

      {/* Row 3 */}
      {renderCell(9, "Capricorn")}
      {renderCell(4, "Leo")}

      {/* Row 4 */}
      {renderCell(8, "Sagittarius")}
      {renderCell(7, "Scorpio")}
      {renderCell(6, "Libra")}
      {renderCell(5, "Virgo")}
    </div>
  );
}
