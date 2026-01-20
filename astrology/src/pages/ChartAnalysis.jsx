import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Sparkles, BookOpen, Heart, Briefcase, Activity } from 'lucide-react';
import bgImage from '../assets/birthchart_bg.png'; // Reusing the background
import PageTransition from '../components/PageTransition';
import CosmicLoader from '../components/CosmicLoader';

export default function ChartAnalysis() {
  const [formData, setFormData] = useState({
    dob: '',
    time: '',
    place: 'Chennai',
    lat: '13.0827',
    lon: '80.2707'
  });
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateAnalysis = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const res = await axios.post(`${baseUrl}/astrology/analyze_chart`, {
        ...formData,
        lat: parseFloat(formData.lat),
        lon: parseFloat(formData.lon)
      });
      setAnalysis(res.data);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || "Error generating analysis. Please try again.";
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
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] fixed pointer-events-none"></div>
        
        <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300 mb-2">
                    Detailed Chart Analysis
                </h1>
                <p className="text-slate-400">Unlock the secrets of your personality and destiny</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Section */}
                <div className="lg:col-span-1">
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl sticky top-24">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Sparkles size={20} className="text-purple-400"/> Enter Details
                        </h2>
                        <form onSubmit={generateAnalysis} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Date of Birth</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 text-slate-500" size={16} />
                                    <input 
                                        type="date" name="dob" required
                                        value={formData.dob} onChange={handleChange}
                                        className="w-full bg-slate-800 border-slate-700 rounded-lg pl-10 py-2.5 text-white focus:ring-purple-500 focus:border-purple-500"
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
                                        className="w-full bg-slate-800 border-slate-700 rounded-lg pl-10 py-2.5 text-white focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Place</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 text-slate-500" size={16} />
                                    <input 
                                        type="text" name="place" required
                                        value={formData.place} onChange={handleChange}
                                        className="w-full bg-slate-800 border-slate-700 rounded-lg pl-10 py-2.5 text-white focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input 
                                    type="number" step="any" name="lat" placeholder="Lat" required
                                    value={formData.lat} onChange={handleChange}
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg py-2.5 px-3 text-white"
                                />
                                <input 
                                    type="number" step="any" name="lon" placeholder="Lon" required
                                    value={formData.lon} onChange={handleChange}
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg py-2.5 px-3 text-white"
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full mt-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-3 rounded-lg shadow-lg active:scale-95 transition-all cursor-pointer"
                            >
                                {loading ? "Analyzing..." : "Get Analysis"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-2">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center min-h-[500px]">
                            <CosmicLoader />
                            <p className="mt-4 text-purple-300 animate-pulse">Consulting the stars...</p>
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
                                    <BookOpen size={20}/> Core Identity
                                </h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="bg-slate-800/50 p-4 rounded-lg">
                                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Ascendant (Lagna)</p>
                                        <p className="text-white leading-relaxed">{analysis.ascendant}</p>
                                    </div>
                                    <div className="bg-slate-800/50 p-4 rounded-lg">
                                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Moon Sign (Rasi)</p>
                                        <p className="text-white leading-relaxed">{analysis.moon_sign}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Planetary Details */}
                            <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6">
                                <h3 className="text-xl font-bold text-blue-300 mb-4">Planetary Positions</h3>
                                <div className="space-y-3">
                                    {analysis.planetary_details.map((p, idx) => (
                                        <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                                            <div className="mb-2 md:mb-0">
                                                <span className="font-bold text-white block">{p.planet}</span>
                                                <span className="text-xs text-slate-400">In {p.sign} ({p.house} House)</span>
                                            </div>
                                            <p className="text-sm text-slate-300 md:max-w-xs">{p.significance}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Strengths & Weaknesses */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-slate-900/80 border border-green-900/30 rounded-xl p-6">
                                    <h3 className="text-lg font-bold text-green-400 mb-3">Strengths</h3>
                                    <ul className="list-disc list-inside space-y-2 text-slate-300 text-sm">
                                        {analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                                <div className="bg-slate-900/80 border border-red-900/30 rounded-xl p-6">
                                    <h3 className="text-lg font-bold text-red-400 mb-3">Challenges</h3>
                                    <ul className="list-disc list-inside space-y-2 text-slate-300 text-sm">
                                        {analysis.challenges.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                            </div>

                            {/* Life Predictions */}
                            <div className="bg-gradient-to-br from-slate-900 to-indigo-950/50 border border-indigo-500/20 rounded-xl p-6">
                                <h3 className="text-xl font-bold text-indigo-300 mb-4">Life Overview</h3>
                                <div className="grid gap-6 md:grid-cols-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 text-indigo-200 font-semibold">
                                            <Briefcase size={16} /> Career
                                        </div>
                                        <p className="text-sm text-slate-300 leading-relaxed">{analysis.life_predictions.career}</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 text-pink-200 font-semibold">
                                            <Heart size={16} /> Relationships
                                        </div>
                                        <p className="text-sm text-slate-300 leading-relaxed">{analysis.life_predictions.relationships}</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 text-green-200 font-semibold">
                                            <Activity size={16} /> Health
                                        </div>
                                        <p className="text-sm text-slate-300 leading-relaxed">{analysis.life_predictions.health}</p>
                                    </div>
                                </div>
                            </div>

                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl min-h-[400px]">
                            <BookOpen size={48} className="mb-4 opacity-50" />
                            <p>Enter your birth details to receive a comprehensive analysis</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </PageTransition>
  );
}
