import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Heart, RefreshCw, User, Calendar, Clock, MapPin } from 'lucide-react';
import bgImage from '../assets/birthchart_bg.png';
import PageTransition from '../components/PageTransition';
import CosmicLoader from '../components/CosmicLoader';

const InputGroup = ({ label, data, setData }) => (
    <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
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
             <div className="grid grid-cols-2 gap-2">
                <input 
                    placeholder="Lat" type="number"
                    className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-white focus:ring-purple-500"
                    value={data.lat}
                    onChange={e => setData({...data, lat: e.target.value})}
                />
                <input 
                    placeholder="Lon" type="number"
                    className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-white focus:ring-purple-500"
                    value={data.lon}
                    onChange={e => setData({...data, lon: e.target.value})}
                />
             </div>
        </div>
    </div>
  );

export default function Matchmaking() {
  const [boyData, setBoyData] = useState({ name: '', dob: '', time: '', place: 'Chennai', lat: '13.08', lon: '80.27', gender: 'male' });
  const [girlData, setGirlData] = useState({ name: '', dob: '', time: '', place: 'Chennai', lat: '13.08', lon: '80.27', gender: 'female' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleMatch = async () => {
    setLoading(true);
    setResult(null); // Clear previous result
    try {
      // Simulate API call for now or connect to backend
      const res = await axios.post('http://localhost:8000/api/astronomy/match', {
         boy: boyData,
         girl: girlData
      });
      setResult(res.data);
    } catch (e) {
      console.error(e);
      alert("Error calculating match");
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <InputGroup label="Boy's Details" data={boyData} setData={setBoyData} />
                <InputGroup label="Girl's Details" data={girlData} setData={setGirlData} />
            </div>

            <div className="text-center mb-10">
                <button 
                    onClick={handleMatch}
                    disabled={loading}
                    className="px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:scale-105 transition-transform rounded-full font-bold text-white shadow-lg shadow-purple-500/30 flex items-center gap-2 mx-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Aligning Stars..." : <><Heart className="fill-white" /> Check Compatibility</>}
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
