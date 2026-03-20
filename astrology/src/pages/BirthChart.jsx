import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Clock, RefreshCw, Download, Navigation, Search } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import bgImage from '../assets/birthchart_bg.png';
import NorthIndianChart from '../components/NorthIndianChart';
import PageTransition from '../components/PageTransition';
import CosmicLoader from '../components/CosmicLoader';

export default function BirthChart() {
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    time: '',
    place: 'Chennai',
    lat: '13.0827',
    lon: '80.2707' 
  });
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const chartRef = useRef(null);
  const downloadContainerRef = useRef(null);
  const [chartType, setChartType] = useState('south'); // 'south' or 'north'
  const [activeChart, setActiveChart] = useState('rasi'); // 'rasi' or 'navamsa'
  const [expandedDashaPath, setExpandedDashaPath] = useState('');

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const searchLocation = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: {
          q: query,
          format: 'json',
          limit: 5,
        }
      });
      setSearchResults(res.data);
      setShowDropdown(true);
    } catch (err) {
      console.error("Error fetching locations:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlaceChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, place: value });
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      searchLocation(value);
    }, 500);
  };

  const selectLocation = (loc) => {
    setFormData({
      ...formData,
      place: loc.display_name.split(',')[0],
      lat: parseFloat(loc.lat).toFixed(4),
      lon: parseFloat(loc.lon).toFixed(4)
    });
    setShowDropdown(false);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude.toFixed(4);
          const lon = position.coords.longitude.toFixed(4);
          
          try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            const res = await axios.get(`${baseUrl}/astrology/reverse_geocode`, {
              params: { lat, lon }
            });
            const placeName = res.data.address.city || res.data.address.town || res.data.name || "Current Location";
            setFormData({ ...formData, place: placeName, lat, lon });
          } catch (err) {
             setFormData({ ...formData, place: 'Current Location', lat, lon });
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Could not access your location. Please check browser permissions.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const generateChart = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const res = await axios.post(`${baseUrl}/astronomy/chart`, {
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
    if (!downloadContainerRef.current) {
        alert("Preparing chart for download... Please try clicking again in a moment.");
        return;
    }
    
    // We must give the browser enough time to paint the newly visible container
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: 'a4'
        });

        // Use custom specific dimensions for A4
        const a4Width = pdf.internal.pageSize.getWidth();
        const a4Height = pdf.internal.pageSize.getHeight();

        // 1. Capture Page 1: The Charts
        const page1El = document.getElementById('pdf-page-1');
        const imgData1 = await toPng(page1El, { 
            backgroundColor: '#0f172a',
            quality: 1
        });
        
        if (!imgData1 || imgData1 === 'data:,') {
             throw new Error("Failed to render the Charts page (Browser returned empty capture)");
        }
        
        const imgProps1 = pdf.getImageProperties(imgData1);
        const pdfHeight1 = (imgProps1.height * a4Width) / imgProps1.width;
        
        pdf.addImage(imgData1, 'PNG', 0, 0, a4Width, pdfHeight1);

        // 2. Capture Page 2: The entire Dasha Tree (Expanded)
        const page2El = document.getElementById('pdf-page-2');
        const imgData2 = await toPng(page2El, { 
            backgroundColor: '#0f172a',
            quality: 1
        });
        
        if (!imgData2 || imgData2 === 'data:,') {
             throw new Error("Failed to render the Dashas page (Browser returned empty capture)");
        }
        
        const imgProps2 = pdf.getImageProperties(imgData2);
        const pdfHeight2 = (imgProps2.height * a4Width) / imgProps2.width;
        
        // Ensure Page 2 might span multiple PDF pages if wildly long, but we'll print it on its own page
        pdf.addPage();
        
        // Simple pagination for highly nested tables
        let position = 0;
        let leftHeight = pdfHeight2;

        while (leftHeight > 0) {
            pdf.addImage(imgData2, 'PNG', 0, position, a4Width, pdfHeight2);
            leftHeight -= a4Height;
            position -= a4Height;
            if (leftHeight > 0) {
                pdf.addPage();
            }
        }
        
        pdf.save(`Full-Vedic-Astrology-Report-${formData.name || 'Chart'}.pdf`);
        
    } catch (err) {
        console.error("Download failed:", err);
        alert(`Download failed: ${err.message}`);
    } finally {
        setIsDownloading(false);
    }
  };

  return (
    <PageTransition>
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
                <div className="relative">
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Name</label>
                  <div className="relative">
                    <input 
                      type="text" name="name" required autoComplete="off"
                      value={formData.name} onChange={handleChange}
                      placeholder="Enter full name"
                      className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Place of Birth</label>
                  <div className="flex gap-2 relative">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 text-slate-500" size={16} />
                      <input 
                        type="text" name="place" required autoComplete="off"
                        value={formData.place} onChange={handlePlaceChange}
                        onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                        placeholder="Search city..."
                        className="w-full bg-slate-800 border-slate-700 rounded-lg pl-10 py-2.5 text-white focus:ring-purple-500 focus:border-purple-500"
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-3">
                          <RefreshCw className="animate-spin text-slate-500" size={16} />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-lg border border-slate-700 text-purple-400 hover:text-purple-300 transition-colors"
                      title="Use Current Location"
                    >
                      <Navigation size={20} />
                    </button>
                    
                    {showDropdown && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-12 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                        {searchResults.map((loc, idx) => (
                          <div 
                            key={idx}
                            onClick={() => selectLocation(loc)}
                            className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0"
                          >
                            <p className="text-white text-sm font-medium">{loc.display_name.split(',')[0]}</p>
                            <p className="text-slate-400 text-xs truncate">{loc.display_name}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Manual Coordinates Fallback */}
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1 px-1">Latitude</label>
                      <input 
                        type="text" name="lat" required
                        value={formData.lat} onChange={handleChange}
                        placeholder="13.0827"
                        className="w-full bg-slate-800/50 border-slate-700/50 rounded-lg px-3 py-2 text-white text-xs focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1 px-1">Longitude</label>
                      <input 
                        type="text" name="lon" required
                        value={formData.lon} onChange={handleChange}
                        placeholder="80.2707"
                        className="w-full bg-slate-800/50 border-slate-700/50 rounded-lg px-3 py-2 text-white text-xs focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

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
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center min-h-[500px]">
                  <CosmicLoader />
              </div>
            ) : chartData ? (
              <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
              >
                
                {/* Type Toggle */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/80 p-2 rounded-lg border border-slate-700 mx-auto w-full max-w-2xl">
                  
                  {/* Chart Selection Toggle */}
                  <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 w-full sm:w-auto">
                    <button 
                        onClick={() => setActiveChart('rasi')}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-bold transition-all cursor-pointer ${activeChart === 'rasi' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        Rasi (D1)
                    </button>
                    <button 
                        onClick={() => setActiveChart('navamsa')}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-bold transition-all cursor-pointer ${activeChart === 'navamsa' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        Navamsa (D9)
                    </button>
                  </div>

                  {/* Style Toggle */}
                  <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 w-full sm:w-auto">
                    <button 
                        onClick={() => setChartType('south')}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-bold transition-all cursor-pointer ${chartType === 'south' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        South Style
                    </button>
                    <button 
                        onClick={() => setChartType('north')}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-bold transition-all cursor-pointer ${chartType === 'north' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        North Style
                    </button>
                  </div>
                </div>

                {/* Capture Area */}
                <div ref={chartRef} data-chart-container className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-white">
                                {formData.name ? `${formData.name}'s ` : ''}{activeChart === 'rasi' ? 'Janma Kundli (Rasi - D1)' : 'Navamsa Chart (D9)'}
                            </h3>
                            <p className="text-sm text-slate-400">{formData.dob} at {formData.time} ({chartType === 'south' ? 'South' : 'North'} Style)</p>
                        </div>
                    </div>
                    
                    {/* Main Chart Visualization */}
                    <div className="bg-white rounded-lg p-4 shadow-xl aspect-square max-w-md mx-auto relative overflow-hidden text-black">
                      {chartType === 'south' ? (
                          <SouthIndianChart 
                              data={activeChart === 'navamsa' ? { planets: chartData.navamsa_planets, ascendant: chartData.navamsa_ascendant } : chartData} 
                              title={activeChart === 'navamsa' ? 'Navamsa (D9)' : 'Rāsi Chart'}
                          />
                      ) : (
                          <NorthIndianChart 
                              data={activeChart === 'navamsa' ? { planets: chartData.navamsa_planets, ascendant: chartData.navamsa_ascendant } : chartData} 
                          />
                      )}
                    </div>
                </div>

                {/* Download Button */}
                <button 
                  onClick={() => {
                      setIsDownloading(true);
                      // Trigger the actual download logic after a tiny delay so React mounts the hidden container
                      setTimeout(handleDownload, 100); 
                  }}
                  disabled={isDownloading}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {isDownloading ? <RefreshCw className="animate-spin" size={20} /> : <Download size={20} />} 
                  {isDownloading ? "Generating Multi-Page PDF..." : "Download Full PDF Report"}
                </button>
                
                {/* Planetary Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto mt-6">
                  <table className="min-w-full divide-y divide-slate-800">
                    <thead className="bg-slate-950">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Planet</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Nakshatra</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Charan</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Longitude</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-slate-900 divide-y divide-slate-800">
                      {chartData.planets.map((planet) => (
                        <tr key={planet.name} className="hover:bg-slate-800/50 cursor-default">
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{planet.name}</td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-300">{planet.nakshatra || "..."}</td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-300">{planet.charan || "..."}</td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                            {Math.floor(planet.lon)}° {(planet.lon % 1 * 60).toFixed(0)}'
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                            {planet.is_retrograde ? <span className="text-red-400 font-bold">R</span> : <span className="text-green-400">D</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Vimshottari Dasha Table */}
                {chartData.dashas && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mt-6">
                    <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center sm:flex-row flex-col gap-2">
                      <div>
                        <h3 className="text-lg font-bold text-white">Vimshottari Dasha Periods</h3>
                        <p className="text-xs text-slate-400">120 Year Cycle mapped from birth time</p>
                      </div>
                      <div className="text-[10px] text-slate-500 flex gap-2">
                         <span>Mahadasha</span>
                         <span>• Bhukti</span>
                         <span>• Pratyantar</span>
                         <span>• Sookshma</span>
                         <span>• Praana</span>
                      </div>
                    </div>
                    <div className="w-full overflow-x-auto">
                        <div className="min-w-[500px]">
                            <div className="flex items-center justify-between p-3 bg-slate-950/50 text-xs font-medium text-slate-400 uppercase tracking-wider border-b border-slate-800">
                               <div className="w-1/3 pl-10">Dasha Lord</div>
                               <div className="w-1/4">Start Date</div>
                               <div className="w-1/4">End Date</div>
                               <div className="w-1/6 text-right pr-4">Duration</div>
                            </div>
                            <div className="flex flex-col">
                               {chartData.dashas.map((dasha, idx) => (
                                 <DashaNode 
                                    key={`dasha-${idx}`} 
                                    dasha={dasha} 
                                    level={1} 
                                    expandedPath={expandedDashaPath} 
                                    setExpandedPath={setExpandedDashaPath} 
                                    path={`dasha-${idx}`} 
                                 />
                               ))}
                            </div>
                        </div>
                    </div>
                  </div>
                )}

                {/* Hidden containers for full PDF download - ONLY rendered when downloading */}
                {isDownloading && (
                  <div className="absolute top-0 left-[-9999px] z-[-50] bg-slate-900">
                    <div ref={downloadContainerRef} className="flex flex-col gap-10">
                        
                        {/* PAGE 1: CHARTS AND PLANETS */}
                      {/* Using inline styles with standard hex/rgb colors to prevent html2canvas oklch parsing errors */}
                      <div id="pdf-page-1" style={{ backgroundColor: '#0f172a', color: '#ffffff' }} className="p-8 w-[1000px] flex flex-col gap-8">
                        <div style={{ borderBottom: '1px solid #334155' }} className="text-center pb-6">
                            <h2 style={{ color: '#818cf8' }} className="text-4xl font-bold mb-2">
                                {formData.name ? `${formData.name}'s ` : ''}Vedic Astrology Report
                            </h2>
                            <p style={{ color: '#cbd5e1' }} className="text-xl">
                                DOB: {formData.dob} | Time: {formData.time} | Place: {formData.place}
                            </p>
                            <p style={{ color: '#94a3b8' }} className="text-md mt-1">({chartType === 'south' ? 'South' : 'North'} Indian Style)</p>
                        </div>
    
                        <div className="flex gap-8 justify-center items-stretch">
                            <div style={{ backgroundColor: '#020617', borderColor: '#1e293b' }} className="flex-1 p-6 rounded-xl border flex flex-col items-center">
                            <h3 className="text-2xl font-bold mb-6 text-center">Janma Kundli (Rasi - D1)</h3>
                            <div style={{ backgroundColor: '#ffffff', color: '#000000' }} className="rounded-lg p-4 w-full aspect-square shadow-xl">
                                {chartType === 'south' ? (
                                    <SouthIndianChart data={chartData} title="Rāsi Chart" />
                                ) : (
                                    <NorthIndianChart data={chartData} />
                                )}
                            </div>
                            </div>
    
                            <div style={{ backgroundColor: '#020617', borderColor: '#1e293b' }} className="flex-1 p-6 rounded-xl border flex flex-col items-center">
                            <h3 className="text-2xl font-bold mb-6 text-center">Navamsa Chart (D9)</h3>
                            <div style={{ backgroundColor: '#ffffff', color: '#000000' }} className="rounded-lg p-4 w-full aspect-square shadow-xl">
                                {chartType === 'south' ? (
                                    <SouthIndianChart data={{ planets: chartData.navamsa_planets, ascendant: chartData.navamsa_ascendant }} title="Navamsa (D9)" />
                                ) : (
                                    <NorthIndianChart data={{ planets: chartData.navamsa_planets, ascendant: chartData.navamsa_ascendant }} />
                                )}
                            </div>
                            </div>
                        </div>
    
                        <div style={{ backgroundColor: '#020617', borderColor: '#1e293b' }} className="rounded-xl border p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold">Planetary Positions</h3>
                                <div className="text-sm text-slate-400">
                                    Ascendant: <span className="text-white font-bold">{chartData.asc_nakshatra}</span> Charan <span className="text-white font-bold">{chartData.asc_charan}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                            {chartData.planets.map((planet) => (
                                <div key={`p1-${planet.name}`} style={{ borderBottom: '1px solid #1e293b' }} className="flex justify-between pb-2 text-sm">
                                    <div className="flex gap-2">
                                        <span className="font-semibold text-indigo-300 w-16">{planet.name}</span>
                                        <span className="text-slate-200">{planet.nakshatra} ({planet.charan})</span>
                                    </div>
                                    <span style={{ color: '#cbd5e1' }}>
                                    {Math.floor(planet.lon)}° {(planet.lon % 1 * 60).toFixed(0)}'
                                    {planet.is_retrograde && <span style={{ color: '#f87171', marginLeft: '0.25rem' }}>R</span>}
                                    </span>
                                </div>
                            ))}
                            </div>
                        </div>
                      </div>

                      {/* PAGE 2: FULL DASHA TREE */}
                      <div id="pdf-page-2" style={{ backgroundColor: '#0f172a', color: '#ffffff' }} className="p-8 w-[1000px] flex flex-col pb-32">
                         <div style={{ backgroundColor: '#020617', borderBottom: '1px solid #1e293b' }} className="px-6 py-4 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-bold">Expanded Vimshottari Dashas</h3>
                                <p style={{ color: '#94a3b8' }} className="text-sm">Complete 120-Year Breakdown</p>
                            </div>
                         </div>
                         <div className="w-full">
                            <div style={{ backgroundColor: 'rgba(2, 6, 23, 0.5)', borderBottom: '1px solid #1e293b', color: '#94a3b8' }} className="flex items-center justify-between p-3 text-sm font-medium uppercase tracking-wider">
                                <div className="w-1/3 pl-10">Dasha Level</div>
                                <div className="w-1/4">Start</div>
                                <div className="w-1/4">End</div>
                                <div className="w-1/6 text-right pr-4">Duration</div>
                            </div>
                            <div style={{ backgroundColor: '#020617', borderColor: '#1e293b' }} className="flex flex-col border mt-2">
                               {chartData.dashas?.map((dasha, idx) => (
                                 <StaticDashaNode 
                                    key={`static-dasha-${idx}`} 
                                    dasha={dasha} 
                                    level={1} 
                                 />
                               ))}
                            </div>
                         </div>
                      </div>

                    </div>
                  </div>
                )}

              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl min-h-[400px]">
                <MapPin size={48} className="mb-4 opacity-50" />
                <p>Enter birth details to generate the chart</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

const DashaNode = ({ dasha, level = 1, expandedPath, setExpandedPath, path }) => {
  const isExpanded = expandedPath.startsWith(path);
  const isExactMatch = expandedPath === path;
  
  const hasSublevels = dasha.sub_levels && dasha.sub_levels.length > 0;
  
  const handleToggle = () => {
    if (!hasSublevels) return;
    
    if (isExpanded) {
      if (isExactMatch) {
         const parentPath = path.includes('-') ? path.substring(0, path.lastIndexOf('-')) : '';
         setExpandedPath(parentPath);
      } else {
         setExpandedPath(path);
      }
    } else {
      setExpandedPath(path);
    }
  };

  const levelColors = {
    1: 'text-indigo-400 font-bold bg-slate-900',
    2: 'text-purple-400 bg-slate-800/80',
    3: 'text-pink-400 bg-slate-800/60',
    4: 'text-rose-400 text-sm bg-slate-800/40',
    5: 'text-amber-400 text-sm bg-slate-800/20'
  };

  const pl = 10 + (level - 1) * 20;

  const levelNames = {
    1: 'Mahadasha',
    2: 'Bhukti',
    3: 'Pratyantar',
    4: 'Sookshma',
    5: 'Praana'
  };

  return (
    <div className="flex flex-col border-b border-slate-800/30 w-full">
      <div 
        className={`flex items-center justify-between p-3 cursor-pointer transition-colors hover:brightness-125 ${levelColors[level]}`}
        style={{ paddingLeft: `${pl}px` }}
        onClick={handleToggle}
      >
        <div className="flex items-center gap-2 w-1/3 min-w-[150px]">
           <span className="w-5 flex-shrink-0 text-slate-500 text-center">
             {hasSublevels ? (isExpanded ? '▼' : '▶') : '•'}
           </span>
           <span className="flex items-baseline gap-1.5 flex-wrap">
             <span>{dasha.lord}</span>
             <span className="text-[10px] opacity-70 font-normal uppercase tracking-wider">({levelNames[level]})</span>
           </span>
        </div>
        <div className="w-1/4 text-sm text-slate-300 min-w-[100px]">{dasha.start}</div>
        <div className="w-1/4 text-sm text-slate-300 min-w-[100px]">{dasha.end}</div>
        <div className="w-1/6 text-sm text-slate-400 text-right pr-4 min-w-[80px]">
           {dasha.duration_years >= 1 ? `${dasha.duration_years.toFixed(2)} Y` : `${(dasha.duration_years * 365.25).toFixed(0)} D`}
        </div>
      </div>
      
      {isExpanded && hasSublevels && (
        <div className="flex flex-col w-full border-l border-slate-700/50">
           {dasha.sub_levels.map((sub, idx) => (
             <DashaNode 
               key={`sub-${path}-${idx}`} 
               dasha={sub} 
               level={level + 1} 
               expandedPath={expandedPath} 
               setExpandedPath={setExpandedPath}
               path={`${path}-${idx}`} 
             />
           ))}
        </div>
      )}
    </div>
  );
}

// Static forced-open version of DashaNode for the PDF Export
const StaticDashaNode = ({ dasha, level = 1 }) => {
  const hasSublevels = dasha.sub_levels && dasha.sub_levels.length > 0;
  
  // Using pure hex codes instead of tailwind classes because html2canvas fails on oklch variables
  const getLevelStyle = (lvl) => {
      switch(lvl) {
          case 1: return { color: '#818cf8', fontWeight: 'bold', backgroundColor: '#0f172a', borderTop: '2px solid #334155' };
          case 2: return { color: '#c084fc', backgroundColor: 'rgba(30, 41, 59, 0.8)', borderTop: '1px solid #1e293b' };
          case 3: return { color: '#f472b6', backgroundColor: 'rgba(30, 41, 59, 0.6)', borderTop: '1px solid #1e293b' };
          case 4: return { color: '#fb7185', fontSize: '0.875rem', backgroundColor: 'rgba(30, 41, 59, 0.4)' };
          case 5: return { color: '#fbbf24', fontSize: '0.875rem', backgroundColor: 'rgba(30, 41, 59, 0.2)' };
          default: return {};
      }
  };

  const pl = 10 + (level - 1) * 20;

  const levelNames = {
    1: 'Mahadasha',
    2: 'Bhukti',
    3: 'Pratyantar',
    4: 'Sookshma',
    5: 'Praana'
  };

  // Skip printing level 5 because it will literally crash the PDF rendering with tens of thousands of rows
  // A full 120 year cycle up to Depth 3 is already thousands of rows. 
  // We will stop rendering at depth 2 (Bhukti) for the PDF to prevent exceeding browser Canvas height limits (~16k pixels)
  if (level > 2) return null;

  return (
    <div className="flex flex-col w-full">
      <div 
        className="flex items-center justify-between p-2.5"
        style={{ paddingLeft: `${pl}px`, ...getLevelStyle(level) }}
      >
        <div className="flex items-center gap-2 w-1/3 min-w-[150px]">
           <span style={{ color: '#64748b' }} className="w-5 flex-shrink-0 text-center">-</span>
           <span className="flex items-baseline gap-1.5 flex-wrap">
             <span>{dasha.lord}</span>
             <span style={{ opacity: 0.7, fontSize: '10px' }} className="font-normal uppercase tracking-wider">({levelNames[level]})</span>
           </span>
        </div>
        <div style={{ color: '#cbd5e1' }} className="w-1/4 text-sm min-w-[100px]">{dasha.start}</div>
        <div style={{ color: '#cbd5e1' }} className="w-1/4 text-sm min-w-[100px]">{dasha.end}</div>
        <div style={{ color: '#94a3b8' }} className="w-1/6 text-sm text-right pr-4 min-w-[80px]">
           {dasha.duration_years >= 1 ? `${dasha.duration_years.toFixed(2)} Y` : `${(dasha.duration_years * 365.25).toFixed(0)} D`}
        </div>
      </div>
      
      {hasSublevels && (
        <div style={{ borderColor: 'rgba(51, 65, 85, 0.3)' }} className="flex flex-col w-full border-l">
           {dasha.sub_levels.map((sub, idx) => (
             <StaticDashaNode 
               key={`static-sub-${idx}`} 
               dasha={sub} 
               level={level + 1} 
             />
           ))}
        </div>
      )}
    </div>
  );
};

// Simple South Indian Chart Component
function SouthIndianChart({ data, title = "Rāsi Chart" }) {
  const signPlanets = Array(12).fill().map(() => []);
  
  data.planets.forEach(p => {
    const signIndex = Math.floor(p.lon / 30);
    signPlanets[signIndex].push(p.name.substring(0, 2)); 
  });

  const ascIndex = Math.floor(data.ascendant / 30);
  signPlanets[ascIndex].push("ASC");

  const renderCell = (signIndex, label) => (
    <div style={{ backgroundColor: '#fffbeb', borderColor: 'rgba(120, 53, 15, 0.2)', color: '#78350f' }} className="border w-full h-full p-1 relative text-xs font-semibold flex flex-wrap content-start gap-1">
      {signPlanets[signIndex].map((p, i) => (
         <span key={i} style={{ backgroundColor: '#fef3c7' }} className="px-1 rounded">{p}</span>
      ))}
      <span style={{ opacity: 0.4 }} className="absolute bottom-0 right-1 text-[10px] uppercase">{label}</span>
      {/* Highlight Ascendant House */}
      {signIndex === ascIndex && <div style={{ backgroundColor: '#ef4444' }} className="absolute top-0 right-0 w-2 h-2 rounded-bl-lg" title="Lagna" />}
    </div>
  );

  return (
    <div style={{ borderColor: '#92400e' }} className="w-full h-full grid grid-cols-4 grid-rows-4 border-2">
      {/* Row 1 */}
      {renderCell(11, "Pisces")}
      {renderCell(0, "Aries")}
      {renderCell(1, "Taurus")}
      {renderCell(2, "Gemini")}

      {/* Row 2 */}
      {renderCell(10, "Aquarius")}
      <div style={{ backgroundColor: 'rgba(255, 251, 235, 0.5)' }} className="col-span-2 row-span-2 flex items-center justify-center">
        <div className="text-center">
            <h3 style={{ color: '#78350f' }} className="font-serif text-xl font-bold">{title}</h3>
            <p style={{ color: '#b45309' }} className="text-[10px]">South Indian Style</p>
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
