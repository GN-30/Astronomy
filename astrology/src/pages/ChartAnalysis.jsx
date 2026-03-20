import { useState, useRef } from "react";
import axios from "axios";
import { AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Sparkles,
  BookOpen,
  Heart,
  Briefcase,
  Activity,
  RefreshCw,
  Navigation,
  Search,
} from "lucide-react";
import bgImage from "../assets/birthchart_bg.png";
import PageTransition from "../components/PageTransition";
import CosmicLoader from "../components/CosmicLoader";

export default function ChartAnalysis() {
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    time: "",
    place: "Chennai",
    lat: "13.0827",
    lon: "80.2707",
  });
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

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
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
    try {
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
        const baseUrl =
          import.meta.env.VITE_API_URL || "http://localhost:8000/api";
        try {
          const res = await axios.get(`${baseUrl}/astrology/reverse_geocode`, {
            params: { lat, lon },
          });
          const placeName =
            res.data.address.city ||
            res.data.address.town ||
            res.data.name ||
            "Current Location";
          setFormData({ ...formData, place: placeName, lat, lon });
        } catch (err) {
          setFormData({ ...formData, place: "Current Location", lat, lon });
        }
      });
    }
  };

  const generateAnalysis = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setAnalysis(null);
    try {
      const baseUrl =
        import.meta.env.VITE_API_URL || "http://localhost:8000/api";

      const res = await axios.post(`${baseUrl}/astrology/analyze_chart`, {
        ...formData,
        lat: parseFloat(formData.lat),
        lon: parseFloat(formData.lon),
      });
      setAnalysis(res.data);
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.detail ||
        "Error generating analysis. Please try again.";
      alert(msg);
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-[2px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-purple-400 to-pink-300 mb-2">
              Detailed Chart Analysis
            </h1>
            <p className="text-slate-400">
              Unlock the secrets of your personality and destiny
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input Section */}
            <div className="lg:col-span-1">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl sticky top-24">
                <div className="flex items-center mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles size={20} className="text-purple-400" /> Enter
                    Details
                  </h2>
                </div>

                <form onSubmit={generateAnalysis} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                      Name
                    </label>
                        <input
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Full Name"
                          className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-purple-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                            Date of Birth
                          </label>
                          <div className="relative">
                            <Calendar
                              className="absolute left-3 top-3 text-slate-500"
                              size={16}
                            />
                            <input
                              type="date"
                              name="dob"
                              required
                              value={formData.dob}
                              onChange={handleChange}
                              className="w-full bg-slate-800 border-slate-700 rounded-lg pl-10 py-2.5 text-white focus:ring-purple-500 focus:border-purple-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                            Time of Birth
                          </label>
                          <div className="relative">
                            <Clock
                              className="absolute left-3 top-3 text-slate-500"
                              size={16}
                            />
                            <input
                              type="time"
                              name="time"
                              required
                              value={formData.time}
                              onChange={handleChange}
                              className="w-full bg-slate-800 border-slate-700 rounded-lg pl-10 py-2.5 text-white focus:ring-purple-500 focus:border-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                          Place of Birth
                        </label>
                        <div className="flex gap-2 relative">
                          <div className="relative flex-1">
                            <Search
                              className="absolute left-3 top-3 text-slate-500"
                              size={16}
                            />
                            <input
                              type="text"
                              name="place"
                              required
                              autoComplete="off"
                              value={formData.place}
                              onChange={handlePlaceChange}
                              onFocus={() => {
                                if (searchResults.length > 0)
                                  setShowDropdown(true);
                              }}
                              onBlur={() =>
                                setTimeout(() => setShowDropdown(false), 200)
                              }
                              placeholder="Search city..."
                              className="w-full bg-slate-800 border-slate-700 rounded-lg pl-10 py-2.5 text-white focus:ring-purple-500 focus:border-purple-500"
                            />
                            {isSearching && (
                              <div className="absolute right-3 top-3">
                                <RefreshCw
                                  className="animate-spin text-slate-500"
                                  size={16}
                                />
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

                          {/* Autocomplete Dropdown */}
                          {showDropdown && searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-12 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                              {searchResults.map((loc, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => selectLocation(loc)}
                                  className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0"
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

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 bg-linear-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-3 rounded-lg shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    {loading ? "Analyzing..." : "Get Analysis"}
                  </button>
                </form>
              </div>
            </div>

            {/* Results Section */}
            <div className="lg:col-span-2">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center min-h-125">
                  <CosmicLoader />
                  <p className="mt-4 text-purple-300 animate-pulse">
                    Consulting the stars...
                  </p>
                </div>
              ) : analysis ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Core Identity */}
                  <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-pink-300 mb-4 flex items-center gap-2">
                      <BookOpen size={20} /> Core Identity
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="bg-slate-800/50 p-4 rounded-lg">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                          Ascendant (Lagna)
                        </p>
                        <p className="text-white leading-relaxed font-medium">
                          {analysis.ascendant}
                          {analysis.asc_nakshatra && (
                            <span className="block text-xs text-slate-400 mt-1 font-normal">
                              Nakshatra:{" "}
                              <span className="text-purple-300">
                                {analysis.asc_nakshatra}
                              </span>
                              , Charan:{" "}
                              <span className="text-purple-300">
                                {analysis.asc_charan}
                              </span>
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="bg-slate-800/50 p-4 rounded-lg">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                          Moon Sign (Rasi)
                        </p>
                        <p className="text-white leading-relaxed">
                          {analysis.moon_sign}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Planetary Details */}
                  <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-blue-300 mb-4">
                      Planetary Positions
                    </h3>
                    <div className="space-y-3">
                      {analysis.planetary_details.map((p, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col md:flex-row md:items-center justify-between bg-slate-800/30 p-3 rounded-lg border border-slate-700/50"
                        >
                          <div className="mb-2 md:mb-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white block">
                                {p.planet}
                              </span>
                              {p.nakshatra && (
                                <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                                  {p.nakshatra} ({p.charan})
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400">
                              In {p.sign} ({p.house} House)
                            </span>
                          </div>
                          <p className="text-sm text-slate-300 md:max-w-xs">
                            {p.significance}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-900/80 border border-green-900/30 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-green-400 mb-3">
                        Strengths
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-slate-300 text-sm">
                        {analysis.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-slate-900/80 border border-red-900/30 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-red-400 mb-3">
                        Challenges
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-slate-300 text-sm">
                        {analysis.challenges.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Life Predictions */}
                  <div className="bg-linear-to-br from-slate-900 to-indigo-950/50 border border-indigo-500/20 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-indigo-300 mb-4">
                      Life Overview
                    </h3>
                    <div className="grid gap-6 md:grid-cols-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2 text-indigo-200 font-semibold">
                          <Briefcase size={16} /> Career
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {analysis.life_predictions.career}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2 text-pink-200 font-semibold">
                          <Heart size={16} /> Relationships
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {analysis.life_predictions.relationships}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2 text-green-200 font-semibold">
                          <Activity size={16} /> Health
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {analysis.life_predictions.health}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl min-h-100">
                  <BookOpen size={48} className="mb-4 opacity-50" />
                  <p>
                    Enter your birth details to receive a comprehensive analysis
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
