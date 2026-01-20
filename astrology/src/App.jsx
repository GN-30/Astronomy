import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Horoscope from './pages/Horoscope';
import BirthChart from './pages/BirthChart';
import Matchmaking from './pages/Matchmaking';
import Interpretation from './pages/Interpretation';
import ChartAnalysis from './pages/ChartAnalysis';
import { motion, AnimatePresence } from 'framer-motion';
import CosmicParticles from './components/CosmicParticles';

import { useNavigate } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { useState } from 'react';

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  // Hide Navbar on Home and Login pages
  if (location.pathname === '/' || location.pathname === '/login') return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/horoscope" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            AstroMind
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/horoscope" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Horoscope</Link>
            <Link to="/chart" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Birth Chart</Link>
            <Link to="/analysis" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Analysis</Link>
            <Link to="/match" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Matchmaking</Link>
            
            {user && (
              <div className="flex items-center gap-4 pl-6 border-l border-white/10">
                 <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-white">{user.name}</p>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold border-2 border-slate-900 shadow-lg cursor-default">
                    {user.initials}
                 </div>
                 <button 
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-full transition-colors"
                    title="Logout"
                 >
                    <LogOut size={20} />
                 </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
             {user && (
                 <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold border border-slate-900 shadow-lg">
                    {user.initials}
                 </div>
             )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-300 hover:text-white p-2"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-slate-950 border-b border-white/5 px-4 pt-2 pb-6 shadow-xl animate-fadeIn">
           <div className="flex flex-col space-y-4">
              <Link 
                to="/horoscope" 
                onClick={() => setIsOpen(false)}
                className="text-base font-medium text-slate-300 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg transition-colors"
              >
                Horoscope
              </Link>
              <Link 
                to="/chart" 
                onClick={() => setIsOpen(false)}
                className="text-base font-medium text-slate-300 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg transition-colors"
              >
                Birth Chart
              </Link>
              <Link 
                to="/match" 
                onClick={() => setIsOpen(false)}
                className="text-base font-medium text-slate-300 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg transition-colors"
              >
                Matchmaking
              </Link>
              <Link 
                to="/analysis" 
                onClick={() => setIsOpen(false)}
                className="text-base font-medium text-slate-300 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg transition-colors"
              >
                Analysis
              </Link>
              <button 
                onClick={() => { handleLogout(); setIsOpen(false); }}
                className="text-base font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut size={18} /> Logout
              </button>
           </div>
        </div>
      )}
    </nav>
  );
}

function RequireAuth({ children }) {
    const { user, loading } = useAuth();
    if (loading) return null; // Or a spinner
    if (!user) return <Login />;
    return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500 selection:text-white relative overflow-hidden">
          <CosmicParticles />
          <Navbar />
          <RoutesWrapper />
        </div>
      </Router>
    </AuthProvider>
  );
}

// Wrapper to handle layout logic (margin top etc)
function RoutesWrapper() {
   const location = useLocation();
   // Remove top padding for Home and Login
   const isCleanLayout = location.pathname === '/' || location.pathname === '/login';
   
   return (
       <div className={isCleanLayout ? '' : 'pt-20 relative z-10'}>
         <AnimatePresence mode="wait">
           <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/horoscope" element={<RequireAuth><Horoscope /></RequireAuth>} />
                <Route path="/chart" element={<RequireAuth><BirthChart /></RequireAuth>} />
                <Route path="/match" element={<RequireAuth><Matchmaking /></RequireAuth>} />
                <Route path="/analysis" element={<RequireAuth><ChartAnalysis /></RequireAuth>} />
                <Route path="/interpretation" element={<RequireAuth><Interpretation /></RequireAuth>} />
           </Routes>
         </AnimatePresence>
       </div>
   )
}
