import { useState, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  RefreshCw,
  User,
  Calendar,
  Clock,
  Navigation,
  Search,
  Sparkles,
} from "lucide-react";
import bgImage from "../assets/birthchart_bg.png";
import PageTransition from "../components/PageTransition";
import CosmicLoader from "../components/CosmicLoader";

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
    setData({ ...data, place: value });

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(() => {
      searchLocation(value);
    }, 500);
  };

  const selectLocation = (loc) => {
    setData({
      ...data,
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

          const placeName =
            res.data.address.city ||
            res.data.address.town ||
            res.data.name ||
            "Current Location";

          setData({ ...data, place: placeName, lat, lon });
        } catch {
          setData({ ...data, place: "Current Location", lat, lon });
        }
      });
    }
  };

  return (
    <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700 backdrop-blur-sm relative transition-all hover:border-slate-600">
      <div className="flex items-center mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <User
            size={20}
            className={data.gender === "male" ? "text-blue-400" : "text-pink-400"}
          />
          {label}
        </h3>
      </div>

      <div className="space-y-4">
        <div className="relative">
             <User className="absolute left-3 top-3 text-slate-500" size={16} />
             <input
              placeholder="Name"
              className="w-full bg-slate-800 border-slate-700 rounded-lg pl-10 p-3 text-white focus:ring-2 focus:ring-purple-500 outline-hidden transition-all"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
            />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-3 text-slate-500" size={16} />
            <input
              type="date"
              className="w-full bg-slate-800 border-slate-700 rounded-lg pl-10 p-3 text-white focus:ring-2 focus:ring-purple-500 outline-hidden transition-all"
              value={data.dob}
              onChange={(e) => setData({ ...data, dob: e.target.value })}
              style={{ colorScheme: 'dark' }}
            />
          </div>
          <div className="relative">
            <Clock className="absolute left-3 top-3 text-slate-500" size={16} />
            <input
              type="time"
              className="w-full bg-slate-800 border-slate-700 rounded-lg pl-10 p-3 text-white focus:ring-2 focus:ring-purple-500 outline-hidden transition-all"
              value={data.time}
              onChange={(e) => setData({ ...data, time: e.target.value })}
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>

        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Birth Place..."
                className="w-full bg-slate-800 border-slate-700 rounded-lg pl-10 p-3 text-white focus:ring-2 focus:ring-purple-500 outline-hidden transition-all"
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
              className="bg-slate-800 hover:bg-slate-700 px-3 rounded-lg border border-slate-700 text-purple-400 transition-colors cursor-pointer"
              title="Use Current Location"
            >
              <Navigation size={18} />
            </button>
          </div>

          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-50 max-h-48 overflow-y-auto overflow-hidden">
              {searchResults.map((loc, idx) => (
                <div
                  key={idx}
                  onClick={() => selectLocation(loc)}
                  className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0 transition-colors"
                >
                  <p className="text-white text-sm font-medium">
                    {loc.display_name.split(",")[0]}
                  </p>
                  <p className="text-slate-400 text-[10px] truncate">
                    {loc.display_name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Matchmaking() {
  const [boyData, setBoyData] = useState({
    name: "Boy",
    dob: "",
    time: "",
    place: "Chennai",
    lat: "13.08",
    lon: "80.27",
    gender: "male",
  });

  const [girlData, setGirlData] = useState({
    name: "Girl",
    dob: "",
    time: "",
    place: "Chennai",
    lat: "13.08",
    lon: "80.27",
    gender: "female",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleMatch = async () => {
    setLoading(true);
    setResult(null);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

      const res = await axios.post(`${baseUrl}/astronomy/match`, {
        boy: {
          ...boyData,
          lat: parseFloat(boyData.lat),
          lon: parseFloat(boyData.lon),
        },
        girl: {
          ...girlData,
          lat: parseFloat(girlData.lat),
          lon: parseFloat(girlData.lon),
        },
      });

      setResult(res.data);
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.detail || e.message || "Error calculating match");
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
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-[2px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-pink-400 to-purple-400 mb-2">
              Kundli Milan
            </h1>
            <p className="text-slate-300">Check astrological compatibility</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <InputGroup label="Boy's Details" data={boyData} setData={setBoyData} />
            <InputGroup label="Girl's Details" data={girlData} setData={setGirlData} />
          </div>

          <div className="text-center mb-10">
            <button
              onClick={handleMatch}
              disabled={loading}
              className="px-8 py-4 bg-linear-to-r from-pink-600 to-purple-600 hover:scale-105 transition-transform rounded-full font-bold text-white shadow-lg shadow-purple-500/30 flex items-center gap-2 mx-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                "Aligning Stars..."
              ) : (
                <>
                  <Heart className="fill-white" /> Check Compatibility
                </>
              )}
            </button>
          </div>

          {loading && (
            <div className="flex justify-center mt-10">
              <CosmicLoader />
            </div>
          )}

          <AnimatePresence>
            {result && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-10 bg-slate-900/90 border border-purple-500/30 p-8 rounded-2xl backdrop-blur-md max-w-3xl mx-auto shadow-2xl"
              >
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                    {result.score}
                    <span className="text-2xl text-slate-400">/ 36</span>
                  </div>
                  <div className="h-1 w-24 bg-linear-to-r from-pink-500 to-purple-500 mx-auto rounded-full mb-4 opacity-50"></div>
                  <p className="text-purple-300 text-lg font-medium flex items-center justify-center gap-2">
                    <Sparkles size={18} /> {result.verdict}
                  </p>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-inner">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <BookOpen size={18} className="text-purple-400" /> Analysis
                  </h3>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm italic">
                    "{result.analysis}"
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}

function BookOpen({ size, className }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}