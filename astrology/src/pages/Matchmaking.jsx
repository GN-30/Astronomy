import { useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, RefreshCw, User, Calendar, Clock, MapPin, Upload, Edit3, Navigation, Search } from 'lucide-react';
import bgImage from '../assets/birthchart_bg.png';
import PageTransition from '../components/PageTransition';
import CosmicLoader from '../components/CosmicLoader';
import FileUploader from '../components/FileUploader';

const InputGroup = ({ label, data, setData }) => {
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchTimeout = useRef(null);

    const searchLocation = async (query) => {
        if (!query || query.length < 3) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        setIsSearching(true);
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                params: { q: query, format: 'json', limit: 5 }
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
        setData({ ...data, place: value });
        
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            searchLocation(value);
        }, 500);
    };

    const selectLocation = (loc) => {
        setData({
            ...data,
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
                        const res = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
                            params: { lat, lon, format: 'json' }
                        });
                        const placeName = res.data.address.city || res.data.address.town || res.data.name || "Current Location";
                        setData({ ...data, place: placeName, lat, lon });
                    } catch (err) {
                        setData({ ...data, place: 'Current Location', lat, lon });
                    }
                }
            );
        }
    };

    return (
        <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700 backdrop-blur-sm relative">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <User size={20} className={data.gender === 'male' ? "text-blue-400" : "text-pink-400"} />
                {label}
            </h3>
            <div className="space-y-3">
                <input 
                    placeholder="Name" 
                    className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-white focus:ring-purple-500"
                    value={data.name}
                    onChange={e => setData({...data, name: e.target.value})}
                />
                <div className="flex gap-2">
                    <input 
                        type="date" 
                        className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-white focus:ring-purple-500"
                        value={data.dob}
                        onChange={e => setData({...data, dob: e.target.value})}
                    />
                    <input 
                        type="time" 
                        className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-white focus:ring-purple-500"
                        value={data.time}
                        onChange={e => setData({...data, time: e.target.value})}
                    />
                </div>
                
                {/* Location Search Row */}
                <div className="relative">
                    <div className="flex gap-2 relative">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 text-slate-500" size={16} />
                            <input 
                                type="text" placeholder="Birth Place..."
                                className="w-full bg-slate-800 border-slate-700 rounded-lg pl-10 p-3 text-white focus:ring-purple-500"
                                value={data.place}
                                onChange={handlePlaceChange}
                                onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                                autoComplete="off"
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
                            className="bg-slate-800 hover:bg-slate-700 px-3 rounded-lg border border-slate-700 text-purple-400 transition-colors"
                            title="Use Current Location"
                        >
                            <Navigation size={18} />
                        </button>
                    </div>

                    {/* Dropdown */}
                    {showDropdown && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                            {searchResults.map((loc, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => selectLocation(loc)}
                                    className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0"
                                >
                                    <p className="text-white text-sm font-medium">{loc.display_name.split(',')[0]}</p>
                                    <p className="text-slate-400 text-[10px] truncate">{loc.display_name}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center px-1">
                    <div className="flex gap-3 text-[10px] text-slate-500 font-mono">
                        <span>LAT: {data.lat}</span>
                        <span>LON: {data.lon}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function Matchmaking() {
  const [mode, setMode] = useState('manual'); // 'manual' or 'upload'
  const [boyData, setBoyData] = useState({ name: '', dob: '', time: '', place: 'Chennai', lat: '13.08', lon: '80.27', gender: 'male' });
  const [girlData, setGirlData] = useState({ name: '', dob: '', time: '', place: 'Chennai', lat: '13.08', lon: '80.27', gender: 'female' });
  const [boyFile, setBoyFile] = useState(null);
  const [girlFile, setGirlFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleMatch = async () => {
    setLoading(true);
    setResult(null);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      
      if (mode === 'upload') {
        if (!boyFile || !girlFile) {
          alert("Please upload both Kundli charts to continue.");
          setLoading(false);
          return;
        }
        
        const formData = new FormData();
        formData.append('boy_chart', boyFile);
        formData.append('girl_chart', girlFile);
        formData.append('boy_name', boyData.name || 'Boy');
        formData.append('girl_name', girlData.name || 'Girl');

        const res = await axios.post(`${baseUrl}/astronomy/match_images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setResult(res.data);
      } else {
        const res = await axios.post(`${baseUrl}/astronomy/match`, {
           boy: { ...boyData, lat: parseFloat(boyData.lat), lon: parseFloat(boyData.lon) },
           girl: { ...girlData, lat: parseFloat(girlData.lat), lon: parseFloat(girlData.lon) }
        });
        setResult(res.data);
      }
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.detail || "Error calculating match");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
        <div 
        className="min-h-screen py-10 px-4 pb-24 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${bgImage})` }}
        >
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] fixed pointer-events-none"></div>
        
        <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">Kundli Milan</h1>
                <p className="text-slate-300">Check astrological compatibility</p>
            </div>

            {/* Mode Toggle */}
            <div className="flex justify-center mb-8">
                <div className="bg-slate-900/80 p-1 rounded-xl border border-slate-700 flex backdrop-blur-sm">
                    <button 
                        onClick={() => { setMode('manual'); setResult(null); }}
                        className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${mode === 'manual' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Edit3 size={16} /> Manual Entry
                    </button>
                    <button 
                        onClick={() => { setMode('upload'); setResult(null); }}
                        className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${mode === 'upload' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Upload size={16} /> Upload Charts
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <AnimatePresence mode="wait">
                    {mode === 'manual' ? (
                        <motion.div 
                            key="manual-view" 
                            initial={{ opacity: 0, x: -20 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: -20 }}
                            className="contents"
                        >
                            <InputGroup label="Boy's Details" data={boyData} setData={setBoyData} />
                            <InputGroup label="Girl's Details" data={girlData} setData={setGirlData} />
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="upload-view" 
                            initial={{ opacity: 0, x: 20 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: 20 }}
                            className="contents"
                        >
                            <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700 backdrop-blur-sm space-y-4">
                                <h3 className="text-xl font-bold text-blue-400 flex items-center gap-2 mb-2">
                                    <User size={20} /> Boy's Chart
                                </h3>
                                <input 
                                    placeholder="Full Name" 
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-white focus:ring-purple-500 mb-2"
                                    value={boyData.name}
                                    onChange={e => setBoyData({...boyData, name: e.target.value})}
                                />
                                <FileUploader label="Upload Rasi Chart (D1)" onFileSelect={setBoyFile} />
                            </div>
                            <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700 backdrop-blur-sm space-y-4">
                                <h3 className="text-xl font-bold text-pink-400 flex items-center gap-2 mb-2">
                                    <User size={20} /> Girl's Chart
                                </h3>
                                <input 
                                    placeholder="Full Name" 
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-white focus:ring-purple-500 mb-2"
                                    value={girlData.name}
                                    onChange={e => setGirlData({...girlData, name: e.target.value})}
                                />
                                <FileUploader label="Upload Rasi Chart (D1)" onFileSelect={setGirlFile} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="text-center mb-10">
                <button 
                    onClick={handleMatch}
                    disabled={loading}
                    className="px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:scale-105 transition-transform rounded-full font-bold text-white shadow-lg shadow-purple-500/30 flex items-center gap-2 mx-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Aligning Stars..." : <><Heart className="fill-white" /> {mode === 'upload' ? 'Analyze Uploads' : 'Check Compatibility'}</>}
                </button>
            </div>

            {loading && (
                <div className="flex justify-center mt-10">
                    <CosmicLoader />
                </div>
            )}

            {result && !loading && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-10 bg-slate-900/90 border border-purple-500/30 p-8 rounded-2xl backdrop-blur-md max-w-3xl mx-auto"
                >
                    <div className="text-center mb-6">
                        <div className="text-5xl font-bold text-white mb-2">{result.score} <span className="text-2xl text-slate-400">/ 36</span></div>
                        <p className="text-purple-300 text-lg font-medium">{result.verdict}</p>
                    </div>
                    
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                        <h3 className="text-lg font-bold text-white mb-3">Analysis</h3>
                        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{result.analysis}</p>
                    </div>
                </motion.div>
            )}
        </div>
        </div>
    </PageTransition>
  );
}
