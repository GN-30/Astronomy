import { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Calendar as CalendarIcon, Star, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import bgImage from '../assets/birthchart_bg.png';
import PageTransition from '../components/PageTransition';
import CosmicLoader from '../components/CosmicLoader';

const ZODIAC_SIGNS = [
  // Fire
  { name: "Aries", dates: "Mar 21 - Apr 19", element: "Fire", img: "/assets/aries.png", type: "single" },
  { name: "Leo", dates: "Jul 23 - Aug 22", element: "Fire", img: "/assets/leo.png", type: "single" },
  { name: "Sagittarius", dates: "Nov 22 - Dec 21", element: "Fire", img: "/assets/sagittarius.png", type: "single" },
  
  // Earth
  { name: "Taurus", dates: "Apr 20 - May 20", element: "Earth", img: "/assets/taurus.png", type: "single" },
  { name: "Virgo", dates: "Aug 23 - Sep 22", element: "Earth", img: "/assets/virgo.png", type: "single" },
  { name: "Capricorn", dates: "Dec 22 - Jan 19", element: "Earth", img: "/assets/capricorn.png", type: "single" },

  // Air
  { name: "Gemini", dates: "May 21 - Jun 20", element: "Air", img: "/assets/gemini.png", type: "single" },
  { name: "Libra", dates: "Sep 23 - Oct 22", element: "Air", img: "/assets/libra.png", type: "single" },
  { name: "Aquarius", dates: "Jan 20 - Feb 18", element: "Air", img: "/assets/aquarius.png", type: "single" },

  // Water
  { name: "Cancer", dates: "Jun 21 - Jul 22", element: "Water", img: "/assets/cancer.png", type: "single" },
  { name: "Scorpio", dates: "Oct 23 - Nov 21", element: "Water", img: "/assets/scorpio.png", type: "single" },
  { name: "Pisces", dates: "Feb 19 - Mar 20", element: "Water", img: "/assets/pisces.png", type: "single" },
];

export default function Horoscope() {
  const { user } = useAuth();
  const [selectedSign, setSelectedSign] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('grid'); // 'grid' or 'detail'
  const [selectedDate, setSelectedDate] = useState('');
  const [error, setError] = useState(null);

  const handleSignClick = (sign) => {
    setSelectedSign(sign);
    setView('detail');
    setPrediction(null);
    setSelectedDate('');
    setError(null);
  };

  const handleDateChange = async (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    setError(null);
    if (!date) return;

    setLoading(true);
    try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const res = await axios.post(`${baseUrl}/astrology/predict`, {
            rasi: selectedSign.name,
            nakshatra: "General",
            date: date
        });
        setPrediction(res.data);
    } catch (e) {
        console.error(e);
        setError("Failed to fetch prediction. Please check your connection.");
    } finally {
        setLoading(false);
    }
  };

  const backToGrid = () => {
    setView('grid');
    setPrediction(null);
    setSelectedDate('');
  };

  return (
    <PageTransition>
        <div 
            className="min-h-screen bg-slate-950 text-white font-sans selection:bg-purple-500 pb-20 bg-cover bg-center bg-no-repeat bg-fixed"
            style={{ backgroundImage: `url(${bgImage})` }}
        >
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] fixed pointer-events-none"></div>

        <div className="relative z-10">
        {view === 'detail' && (
            <div className="pt-6 px-6">
            <button onClick={backToGrid} className="p-2 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer">
                <ChevronLeft size={24} />
            </button>
            </div>
        )}

        <AnimatePresence mode="wait">
            {view === 'grid' && (
            <motion.div 
                key="grid"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="px-6 mt-6 pb-20"
            >
                <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200">Hello {user?.name || "Guest"},</h1>
                <p className="text-slate-300 mb-8 text-lg font-light">Select your sign to reveal your cosmic path...</p>

                <div className="grid grid-cols-3 gap-y-10 gap-x-4 pb-24">
                    {ZODIAC_SIGNS.map((sign) => (
                        <motion.button
                            key={sign.name}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSignClick(sign)}
                            className="flex flex-col items-center justify-start gap-3 group cursor-pointer"
                        >
                            <div className="w-20 h-20 relative rounded-full overflow-hidden shadow-lg ring-2 ring-white/10 group-hover:ring-purple-400 group-hover:shadow-purple-500/20 transition-all duration-300 bg-slate-900/40 backdrop-blur-sm">
                                <img 
                                    src={sign.img} 
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                    alt={sign.name}
                                />
                            </div>

                            <span className={`text-sm font-medium transition-colors ${sign.name === 'Scorpio' ? 'text-purple-300 group-hover:text-purple-200' : 'text-slate-300 group-hover:text-white'}`}>
                                {sign.name}
                            </span>
                        </motion.button>
                    ))}
                </div>
            </motion.div>
            )}

            {view === 'detail' && selectedSign && (
                <motion.div 
                    key="detail"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="px-6 pb-20 flex flex-col items-center"
                >
                    <div className="flex flex-col items-center mt-4 mb-8">
                        <div className="w-32 h-32 rounded-full overflow-hidden relative shadow-2xl mb-6 ring-4 ring-white/20 shadow-purple-500/30">
                            <img 
                                src={selectedSign.img} 
                                className="w-full h-full object-cover"
                                alt={selectedSign.name}
                            />
                        </div>
                        <h2 className="text-4xl font-bold text-white tracking-wide">{selectedSign.name}</h2>
                        <p className="text-purple-300 mt-2 font-medium">{selectedSign.dates}</p>
                    </div>

                    <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
                        <label className="block text-slate-400 text-sm font-medium mb-3">Select Date for Prediction</label>
                        
                        {error && (
                            <div className="mb-4 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-500/20">
                                {error}
                            </div>
                        )}

                        <div className="relative mb-6">
                            <input 
                                type="date" 
                                className="w-full bg-slate-800/80 border border-slate-700 text-white text-lg rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent block p-4 pl-12 shadow-sm transition-all" 
                                onChange={handleDateChange}
                                value={selectedDate}
                                style={{ colorScheme: 'dark' }}
                            />
                            <CalendarIcon className="absolute left-4 top-4 text-purple-400" size={24}/>
                        </div>

                        {loading ? (
                             <div className="h-full flex flex-col items-center justify-center py-10">
                                <CosmicLoader />
                            </div>
                        ) : prediction ? (
                            <div className="space-y-4 animate-fadeIn">
                                <div className="bg-purple-900/20 rounded-xl p-5 border border-purple-500/20">
                                    <h3 className="text-sm font-bold text-purple-300 mb-2 uppercase tracking-wider flex items-center gap-2">
                                        <Star size={16}/> Prediction
                                    </h3>
                                    <p className="text-slate-200 leading-relaxed text-base italic">
                                        "{prediction.rasi_prediction}"
                                    </p>
                                </div>
                                
                                <div className="bg-blue-900/20 rounded-xl p-5 border border-blue-500/20">
                                    <h3 className="text-sm font-bold text-blue-300 mb-2 uppercase tracking-wider">Guidance</h3>
                                    <p className="text-slate-200 leading-relaxed text-sm">
                                        {prediction.nakshatra_guidance}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <p>Select a date above to reveal your reading.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
        </div>
        </div>
    </PageTransition>
  );
}
