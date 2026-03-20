import { useState, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Navigation,
  Search,
  RefreshCw,
  Sun,
  Moon,
  Sparkles,
  Info,
  Stars,
  Compass,
  Activity,
  Zap,
  Clock9,
  Hourglass,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import bgImage from "../assets/birthchart_bg.png";
import PageTransition from "../components/PageTransition";
import CosmicLoader from "../components/CosmicLoader";

const InfoCard = ({ title, value, icon: Icon, color, tamilTitle, endTime }) => (
  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-4 rounded-xl hover:border-purple-500/50 transition-all group">
    <div className="flex items-center gap-3 mb-2">
      <div className={`p-2 rounded-lg ${color} bg-opacity-20`}>
        <Icon size={20} className={color.replace('bg-', 'text-')} />
      </div>
      <h4 className="text-slate-400 text-sm font-medium">{title} {tamilTitle && <span className="text-[10px] opacity-70">({tamilTitle})</span>}</h4>
    </div>
    <p className="text-white text-lg font-bold group-hover:text-purple-300 transition-colors uppercase tracking-wide">
      {value || "---"}
    </p>
    {endTime && endTime !== "---" && (
      <p className="text-[10px] text-slate-500 mt-1 font-medium bg-slate-950/40 py-1 px-2 rounded-md inline-block">Ends at {endTime}</p>
    )}
  </div>
);

const TAMIL_MAPPINGS = {
  signs: {
    "Aries": "Mesham", "Taurus": "Rishabham", "Gemini": "Mithunam", "Cancer": "Kadagam",
    "Leo": "Simmam", "Virgo": "Kanni", "Libra": "Thulaam", "Scorpio": "Viruchigam",
    "Sagittarius": "Dhanusu", "Capricorn": "Magaram", "Aquarius": "Kumbam", "Pisces": "Meenam"
  },
  elements: {
    "Tithi": "Thithi", "Vara": "Vaaram", "Nakshatra": "Natchathiram", "Yoga": "Yogam", "Karana": "Karanam"
  }
};

export default function Panchangam() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    time: "12:00",
    place: "Chennai",
    lat: "13.08",
    lon: "80.27",
  });

  const [panchangamData, setPanchangamData] = useState(null);
  const [loading, setLoading] = useState(false);
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

    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
    try {
      setIsSearching(true);
      const res = await axios.get(`${baseUrl}/astrology/search_location`, {
        params: { q: query },
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
      place: loc.display_name.split(",")[0],
      lat: parseFloat(loc.lat).toFixed(4),
      lon: parseFloat(loc.lon).toFixed(4),
    });
    setShowDropdown(false);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude.toFixed(4);
        const lon = position.coords.longitude.toFixed(4);
        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
        try {
          const res = await axios.get(`${baseUrl}/astrology/reverse_geocode`, {
            params: { lat, lon },
          });
          const placeName = res.data.address.city || res.data.address.town || res.data.name || "Current Location";
          setFormData({ ...formData, place: placeName, lat, lon });
        } catch {
          setFormData({ ...formData, place: "Current Location", lat, lon });
        }
      });
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    setPanchangamData(null);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
      const res = await axios.post(`${baseUrl}/astronomy/panchangam`, {
        date: formData.date,
        time: formData.time,
        lat: parseFloat(formData.lat),
        lon: parseFloat(formData.lon),
      });
      setPanchangamData(res.data);
    } catch (err) {
      console.error(err);
      alert("Error calculating Panchangam details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div
        className="min-h-screen py-10 px-4 pb-24 bg-cover bg-center bg-fixed text-white"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-[2px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-yellow-400 via-orange-500 to-red-500 mb-2"
            >
              Daily Panchangam
            </motion.h1>
            <p className="text-slate-300">The five elements of time (Vedic Calendar)</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6 border-b border-slate-800 mb-6">
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 text-slate-500" size={18} />
                  <input
                    type="date"
                    className="w-full bg-slate-800 border-slate-700 rounded-lg pl-10 p-3 text-white focus:ring-2 focus:ring-orange-500 outline-hidden transition-all"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1">Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 text-slate-500" size={18} />
                  <input
                    type="time"
                    className="w-full bg-slate-800 border-slate-700 rounded-lg pl-10 p-3 text-white focus:ring-2 focus:ring-orange-500 outline-hidden transition-all"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1 md:col-span-2 lg:col-span-1">
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1">Location</label>
                <div className="flex gap-2 relative">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-slate-500" size={18} />
                    <input
                      type="text"
                      placeholder="Place..."
                      className="w-full bg-slate-800 border-slate-700 rounded-lg pl-10 p-3 text-white focus:ring-2 focus:ring-orange-500 outline-hidden transition-all"
                      value={formData.place}
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
                    onClick={getCurrentLocation}
                    className="bg-slate-800 hover:bg-slate-700 px-3 rounded-lg border border-slate-700 text-orange-400 transition-colors cursor-pointer"
                  >
                    <Navigation size={18} />
                  </button>

                  {showDropdown && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-50 max-h-48 overflow-y-auto">
                      {searchResults.map((loc, idx) => (
                        <div
                          key={idx}
                          onClick={() => selectLocation(loc)}
                          className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0"
                        >
                          <p className="text-white text-sm font-medium">{loc.display_name.split(",")[0]}</p>
                          <p className="text-slate-400 text-[10px] truncate">{loc.display_name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

            <button
              onClick={handleCalculate}
              disabled={loading}
              className="w-full bg-linear-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all text-lg cursor-pointer flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="animate-spin" size={24} /> : <Sparkles size={24} />}
              {loading ? "Calculating..." : "Get Panchangam"}
            </button>
          </div>

          {loading && (
            <div className="flex justify-center py-10">
              <CosmicLoader />
            </div>
          )}

          <AnimatePresence>
            {panchangamData && !loading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                 <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/40 backdrop-blur-sm p-6 rounded-2xl border border-slate-800/50 mb-4">
                    <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-yellow-500/20">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-500/20 rounded-full">
                                <Sun className="text-yellow-400" size={28} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Sunrise (Suryodayam)</p>
                                <p className="text-2xl font-black text-yellow-50">{panchangamData.sunrise}</p>
                            </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] text-slate-500 uppercase">Sun Sign</p>
                           <p className="font-bold text-orange-300">
                             {panchangamData.sun_sign} ({TAMIL_MAPPINGS.signs[panchangamData.sun_sign]})
                           </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-indigo-500/20">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/20 rounded-full">
                                <Moon className="text-indigo-400" size={28} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Sunset (Suryastamanam)</p>
                                <p className="text-2xl font-black text-indigo-50">{panchangamData.sunset}</p>
                            </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] text-slate-500 uppercase">Moon Sign</p>
                           <p className="font-bold text-blue-300">
                             {panchangamData.moon_sign} ({TAMIL_MAPPINGS.signs[panchangamData.moon_sign]})
                           </p>
                        </div>
                    </div>
                 </div>

                 <div className="md:col-span-2 lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                    <InfoCard title="Tithi" tamilTitle={TAMIL_MAPPINGS.elements.Tithi} value={panchangamData.tithi} endTime={panchangamData.tithi_end} icon={Moon} color="bg-blue-500" />
                    <InfoCard title="Vara" tamilTitle={TAMIL_MAPPINGS.elements.Vara} value={panchangamData.vara} icon={Compass} color="bg-yellow-500" />
                    <InfoCard title="Nakshatra" tamilTitle={TAMIL_MAPPINGS.elements.Nakshatra} value={panchangamData.nakshatra} endTime={panchangamData.nakshatra_end} icon={Stars} color="bg-purple-500" />
                    <InfoCard title="Yoga" tamilTitle={TAMIL_MAPPINGS.elements.Yoga} value={panchangamData.yoga} endTime={panchangamData.yoga_end} icon={Activity} color="bg-green-500" />
                    <InfoCard title="Karana" tamilTitle={TAMIL_MAPPINGS.elements.Karana} value={panchangamData.karana} icon={Zap} color="bg-indigo-500" />
                 </div>

                 <div className="md:col-span-2 lg:col-span-3 bg-slate-950/80 border border-slate-800 p-6 rounded-2xl">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-300">
                        <Clock size={20} className="text-orange-400" /> Important Daily Timings
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="relative group">
                            <div className="flex items-center gap-3 mb-2">
                                <AlertTriangle size={18} className="text-red-500" />
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rahu Kaalam</span>
                            </div>
                            <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl group-hover:border-red-500/30 transition-colors">
                                <p className="text-white text-lg font-bold tracking-tight">{panchangamData.rahu_kaalam}</p>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="flex items-center gap-3 mb-2">
                                <Clock9 size={18} className="text-orange-500" />
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Yama Gandam</span>
                            </div>
                            <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl group-hover:border-orange-500/30 transition-colors">
                                <p className="text-white text-lg font-bold tracking-tight">{panchangamData.yama_gandam}</p>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="flex items-center gap-3 mb-2">
                                <Hourglass size={18} className="text-slate-400" />
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Gulika Kaalam</span>
                            </div>
                            <div className="p-4 bg-slate-500/5 border border-slate-500/10 rounded-xl group-hover:border-slate-500/30 transition-colors">
                                <p className="text-white text-lg font-bold tracking-tight">{panchangamData.gulika_kaalam}</p>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="flex items-center gap-3 mb-2">
                                <CheckCircle2 size={18} className="text-green-500" />
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nalla Neram</span>
                            </div>
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl group-hover:border-green-500/40 transition-all ring-1 ring-green-500/10">
                                <p className="text-white text-lg font-bold tracking-tight">{panchangamData.nalla_neram}</p>
                                <div className="absolute -top-1 -right-1">
                                    <Sparkles size={12} className="text-green-400 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>
                

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
