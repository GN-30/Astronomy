import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [name, setName] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (name.trim()) {
      login(name);
      navigate('/horoscope');
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-950 flex flex-col items-center justify-between py-12 px-6">
      
      {/* Background Image Layer - Keeping the Mystic Wheel */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black" />
         <img 
            src="/mystic_zodiac_wheel_background.png" 
            alt="Zodiac Background" 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] max-w-none opacity-60 mix-blend-screen animate-spin-slow"
            style={{ animationDuration: '120s' }}
         />
         <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/20" />
      </div>

      {/* Quote Content */}
      <div className="relative z-10 mt-20 max-w-lg text-center">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 1, delay: 0.2 }}
        >
            <h1 className="text-4xl sm:text-6xl font-light text-slate-300 leading-tight">
              Millionaires don't use Horoscope, but <span className="font-bold text-white block mt-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">Billionaires do...</span>
            </h1>
        </motion.div>
      </div>

      {/* Access Button */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="relative z-10 w-full max-w-xs mb-12"
      >
        <button 
            onClick={() => setIsLoginOpen(true)}
            className="group relative flex items-center justify-center w-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white font-medium py-4 rounded-full transition-all overflow-hidden cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
        >
          <span className="relative z-10 flex items-center gap-2 text-lg">
            Get Started <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </button>
        <p className="text-center text-slate-500 text-xs mt-4">Based on J.P. Morgan's famous quote</p>
      </motion.div>

      {/* Login Modal Popup */}
      <AnimatePresence>
        {isLoginOpen && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
            >
                <div className="absolute inset-0" onClick={() => setIsLoginOpen(false)} /> {/* Overlay click to close */}
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md bg-slate-900/90 border border-slate-700/50 p-8 rounded-3xl shadow-2xl"
                >
                    <button 
                        onClick={() => setIsLoginOpen(false)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                    >
                        <X size={20} />
                    </button>

                    <h2 className="text-3xl font-bold text-white mb-2">Welcome</h2>
                    <p className="text-slate-400 mb-6">Enter your name to reveal your destiny.</p>
                    
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black/40 border border-slate-700 rounded-xl px-5 py-4 text-white text-lg placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-center"
                            placeholder="Your Name"
                            autoFocus
                        />
                        </div>
                        
                        <button 
                        type="submit"
                        disabled={!name.trim()}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            Continue <ArrowRight size={20} />
                        </button>
                    </form>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
