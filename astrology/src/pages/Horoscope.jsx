import { useState, useRef, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { ChevronLeft, Calendar as CalendarIcon, Star, Moon, Sparkles, X, ShieldAlert, Zap, GripHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import bgImage from '../assets/birthchart_bg.png';
import PageTransition from '../components/PageTransition';
import CosmicLoader from '../components/CosmicLoader';
import { getTamilDate } from '../utils/tamilCalendar';
import {
  getChandrashtama,
  getAllNakshatras,
  dateStringToISTNoon,
  approximateMoonLongitude,
  getNakshatraFromLongitude,
  getRasiFromLongitude,
  RASI_ORDER,
  NAKSHATRAS,
  RASI_NAKSHATRAS,
} from '../utils/chandrashtama';

const ZODIAC_SIGNS = [
  // Fire
  { name: "Aries", tamilName: "Mesham", dates: "Aswini, Bharani, Krithika", element: "Fire", img: "/assets/aries.png", type: "single" },
  { name: "Leo", tamilName: "Simmam", dates: "Magha, Purva Phalguni, Uttara Phalguni", element: "Fire", img: "/assets/leo.png", type: "single" },
  { name: "Sagittarius", tamilName: "Dhanusu", dates: "Moola, Purvashada, Uttarashada", element: "Fire", img: "/assets/sagittarius.png", type: "single" },
  
  // Earth
  { name: "Taurus", tamilName: "Rishabam", dates: "Krithika, Rohini, Mrigashira", element: "Earth", img: "/assets/taurus.png", type: "single" },
  { name: "Virgo", tamilName: "Kanni", dates: "Uttara Phalguni, Hasta, Chitra", element: "Earth", img: "/assets/virgo.png", type: "single" },
  { name: "Capricorn", tamilName: "Makaram", dates: "Uttarashada, Shravana, Dhanishta", element: "Earth", img: "/assets/capricorn.png", type: "single" },

  // Air
  { name: "Gemini", tamilName: "Mithunam", dates: "Mrigashira, Ardra, Punarvasu", element: "Air", img: "/assets/gemini.png", type: "single" },
  { name: "Libra", tamilName: "Thulam", dates: "Chitra, Swati, Vishakha", element: "Air", img: "/assets/libra.png", type: "single" },
  { name: "Aquarius", tamilName: "Kumbam", dates: "Dhanishta, Shatabhisha, Purva Bhadrapada", element: "Air", img: "/assets/aquarius.png", type: "single" },

  // Water
  { name: "Cancer", tamilName: "Kadagam", dates: "Punarvasu, Pushya, Ashlesha", element: "Water", img: "/assets/cancer.png", type: "single" },
  { name: "Scorpio", tamilName: "Viruchigam", dates: "Vishakha, Anuradha, Jyeshtha", element: "Water", img: "/assets/scorpio.png", type: "single" },
  { name: "Pisces", tamilName: "Meenam", dates: "Purva Bhadrapada, Uttara Bhadra, Revati", element: "Water", img: "/assets/pisces.png", type: "single" },
];

// Stable particles (useMemo prevents re-randomise on every render)
const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  x: (i * 37 + 11) % 97,
  y: (i * 53 + 7)  % 93,
  size: (i % 3) + 1.5,
  delay: (i * 0.3) % 2.5,
  dur: 2.5 + (i % 3),
}));

// ── Chandrashtama Card Component ─────────────────────────────────────────────
function ChandrashtamaCard({ isOpen, onClose, birthRasiName, date }) {
  const [birthNakshatra, setBirthNakshatra] = useState('');
  const [isDragging, setIsDragging]         = useState(false);
  const allNakshatras = getAllNakshatras();
  const constraintsRef = useRef(null);

  // Use IST noon for the date so the Moon position is correct for Indian users
  const targetDate = useMemo(() => {
    if (date) return dateStringToISTNoon(date);
    // No date selected → use current time
    return new Date();
  }, [date]);

  const result = useMemo(
    () => getChandrashtama(birthRasiName, birthNakshatra || null, targetDate),
    [birthRasiName, birthNakshatra, targetDate]
  );

  const isActive = result?.isChandrashtamaDay;

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.72, y: 56 },
    visible: {
      opacity: 1, scale: 1, y: 0,
      transition: { type: 'spring', stiffness: 210, damping: 24, staggerChildren: 0.06 },
    },
    exit: { opacity: 0, scale: 0.82, y: 36, transition: { duration: 0.22, ease: 'easeIn' } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
  };

  // format date label
  const dateLabel = date
    ? new Date(date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <AnimatePresence>
      {isOpen && (
        // Full-screen drag area — tap backdrop to close ONLY if not dragging
        <motion.div
          key="c8-backdrop"
          ref={constraintsRef}
          className="fixed inset-0 z-50 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ background: 'rgba(2,4,18,0.78)', backdropFilter: 'blur(7px)' }}
          onClick={() => { if (!isDragging) onClose(); }}
        >
          {/* The draggable card — centered initially, then freely draggable */}
          <motion.div
            key="c8-card"
            drag
            dragConstraints={constraintsRef}
            dragElastic={0.08}
            dragMomentum={false}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setTimeout(() => setIsDragging(false), 50)}
            onClick={e => e.stopPropagation()}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-1/2 left-1/2"
            style={{
              width: 'min(92vw, 420px)',
              translateX: '-50%',
              translateY: '-50%',
              background: 'linear-gradient(135deg, #0c0726 0%, #180938 40%, #091525 100%)',
              border: `1px solid ${isActive ? 'rgba(239,68,68,0.35)' : 'rgba(168,85,247,0.32)'}`,
              borderRadius: 24,
              overflow: 'hidden',
              boxShadow: isActive
                ? '0 0 70px rgba(239,68,68,0.22), 0 28px 56px rgba(0,0,0,0.65)'
                : '0 0 70px rgba(139,92,246,0.18), 0 28px 56px rgba(0,0,0,0.65)',
              userSelect: 'none',
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
          >
            {/* ── Star particles (non-interactive) ── */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              {PARTICLES.map(p => (
                <motion.span
                  key={p.id}
                  className="absolute rounded-full bg-white"
                  style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
                  animate={{ opacity: [0.15, 0.7, 0.15], scale: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: p.dur, delay: p.delay }}
                />
              ))}
              <motion.div
                className="absolute -top-20 -right-20 w-56 h-56 rounded-full pointer-events-none"
                style={{ background: isActive ? 'radial-gradient(circle,rgba(239,68,68,0.16) 0%,transparent 70%)' : 'radial-gradient(circle,rgba(139,92,246,0.16) 0%,transparent 70%)' }}
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ repeat: Infinity, duration: 4 }}
              />
            </div>

            {/* ── Scrollable card body (grip handle lives INSIDE so it scrolls with content) ── */}
            <div
              className="overflow-y-auto scrollbar-hide"
              style={{ maxHeight: 'min(82vh, 620px)', cursor: 'default' }}
              onClick={e => e.stopPropagation()}
              onPointerDown={e => {
                // Allow drag only when initiated from the grip handle
                if (!e.target.closest('[data-drag-handle]')) e.stopPropagation();
              }}
            >
              {/* Grip handle — scrolls with content, still initiates card drag */}
              <div
                data-drag-handle
                className="flex justify-center pt-3 pb-1 select-none"
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                <GripHorizontal size={18} className="text-slate-400 opacity-40" />
              </div>

              {/* Header */}
              <div className="relative px-5 pt-1 pb-3">
                <div className="flex items-center justify-between">
                  {/* Orbiting moon icon */}
                  <div className="relative w-11 h-11 flex-shrink-0">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Moon size={20} className={isActive ? 'text-red-400' : 'text-purple-300'} />
                    </div>
                    <motion.div
                      className="absolute inset-0"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 7, ease: 'linear' }}
                    >
                      <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
                        style={{ background: isActive ? '#f87171' : '#c084fc', boxShadow: `0 0 6px ${isActive ? '#f87171' : '#c084fc'}` }}
                      />
                    </motion.div>
                  </div>

                  <div className="text-center flex-1 mx-3">
                    <motion.h2
                      variants={itemVariants}
                      className="text-base font-bold tracking-widest uppercase"
                      style={{
                        background: isActive ? 'linear-gradient(90deg,#f87171,#fb923c)' : 'linear-gradient(90deg,#c084fc,#818cf8)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Chandrashtama
                    </motion.h2>
                    <motion.p variants={itemVariants} className="text-xs text-slate-500 mt-0.5">
                      ☽ Moon&apos;s 8th House Transit
                    </motion.p>
                  </div>

                  <button
                    onClick={onClose}
                    className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-slate-800/80 border border-slate-700 hover:bg-slate-700 transition-colors"
                    style={{ cursor: 'pointer' }}
                  >
                    <X size={14} className="text-slate-400" />
                  </button>
                </div>

                {/* Divider */}
                <motion.div
                  variants={itemVariants}
                  className="h-px w-full mt-3"
                  style={{ background: isActive ? 'linear-gradient(90deg,transparent,rgba(239,68,68,0.5),transparent)' : 'linear-gradient(90deg,transparent,rgba(139,92,246,0.5),transparent)' }}
                />
              </div>

              {/* Nakshatra selector */}
              <motion.div variants={itemVariants} className="px-5 pb-4">
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                  Birth Nakshatra <span className="text-slate-600">(optional · for peak calc)</span>
                </label>
                <select
                  value={birthNakshatra}
                  onChange={e => setBirthNakshatra(e.target.value)}
                  className="w-full bg-slate-800/70 border border-slate-700/80 text-white text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none appearance-none"
                  style={{ colorScheme: 'dark', cursor: 'pointer' }}
                >
                  <option value="">— Select Nakshatra —</option>
                  {allNakshatras.map(n => (
                    <option key={n.index} value={n.name}>{n.name} ({n.tamilName})</option>
                  ))}
                </select>
              </motion.div>

              {/* Body content */}
              <div className="px-5 pb-5 space-y-3">

                {/* Status banner */}
                <motion.div
                  variants={itemVariants}
                  className="rounded-2xl p-3.5 text-center relative overflow-hidden"
                  style={{
                    background: isActive ? 'linear-gradient(135deg,rgba(239,68,68,0.14),rgba(185,28,28,0.07))' : 'linear-gradient(135deg,rgba(139,92,246,0.1),rgba(59,130,246,0.05))',
                    border: `1px solid ${isActive ? 'rgba(239,68,68,0.28)' : 'rgba(139,92,246,0.22)'}`,
                  }}
                >
                  {isActive ? (
                    <>
                      <motion.div
                        className="flex items-center justify-center gap-2 mb-1"
                        animate={{ scale: [1, 1.04, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <ShieldAlert size={16} className="text-red-400" />
                        <span className="text-red-300 font-bold text-sm tracking-wide">Active Today!</span>
                      </motion.div>
                      <p className="text-red-200/60 text-xs">Moon is in your Chandrashtama Rasi. Exercise caution.</p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Sparkles size={14} className="text-purple-400" />
                        <span className="text-purple-200 font-semibold text-sm">
                          {result?.daysUntilStart < 1
                            ? 'Starts very soon'
                            : result?.daysUntilStart < 2
                            ? 'Starts Tomorrow'
                            : `In ~${result?.daysUntilStart?.toFixed(1)} days`}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs">Moon is safe · not in Chandrashtama Rasi.</p>
                      {result?.startDate && (
                        <p className="text-slate-500 text-xs mt-1">
                          Window: {result.startDate.toLocaleDateString('en-IN',{day:'numeric',month:'short'})} – {result.endDate.toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                        </p>
                      )}
                    </>
                  )}
                </motion.div>

                {/* Info grid */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Your Rasi</p>
                    <p className="text-white font-semibold text-sm">{result?.birthRasi?.name}</p>
                    <p className="text-purple-400 text-xs">{result?.birthRasi?.tamilName}</p>
                  </div>

                  <div className="rounded-xl p-3" style={{ background: isActive ? 'rgba(239,68,68,0.07)' : 'rgba(139,92,246,0.06)', border: `1px solid ${isActive ? 'rgba(239,68,68,0.18)' : 'rgba(139,92,246,0.14)'}` }}>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">8th Rasi (Chandra.)</p>
                    <p className={`font-semibold text-sm ${isActive ? 'text-red-300' : 'text-purple-200'}`}>{result?.chandrashtamaRasi?.name}</p>
                    <p className="text-purple-400 text-xs">{result?.chandrashtamaRasi?.tamilName}</p>
                  </div>

                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Moon's Rasi Now</p>
                    <p className="text-white font-semibold text-sm">{result?.transitRasi?.name}</p>
                    <p className="text-blue-400 text-xs">{result?.transitRasi?.tamilName}</p>
                  </div>

                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Today's Nakshatra</p>
                    <p className="text-white font-semibold text-sm">{result?.transitNakshatra?.name}</p>
                    <p className="text-blue-400 text-xs">{result?.transitNakshatra?.tamilName}</p>
                  </div>
                </motion.div>

                {/* Chandrashtama nakshatras */}
                <motion.div
                  variants={itemVariants}
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Star size={11} className="text-amber-400" />
                    Nakshatras in Chandrashtama period
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {result?.chandrashtamaNakshatras?.map((n, i) => {
                      const active = isActive && result?.transitNakshatra?.name === n.name;
                      return (
                        <motion.div
                          key={n.name}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + i * 0.07, type: 'spring', stiffness: 260 }}
                          className="px-3 py-1.5 rounded-full text-xs font-medium"
                          style={{
                            background: active ? 'rgba(239,68,68,0.2)' : 'rgba(139,92,246,0.1)',
                            border: `1px solid ${active ? 'rgba(239,68,68,0.4)' : 'rgba(139,92,246,0.25)'}`,
                            color: active ? '#fca5a5' : '#c4b5fd',
                          }}
                        >
                          {n.name}
                          {active && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse align-middle" />}
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Peak nakshatra */}
                <AnimatePresence>
                  {result?.peakNakshatra && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-xl p-4 overflow-hidden"
                      style={{ background: 'linear-gradient(135deg,rgba(251,191,36,0.07),rgba(245,158,11,0.03))', border: '1px solid rgba(251,191,36,0.18)' }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Zap size={13} className="text-amber-400" />
                        <p className="text-xs text-amber-400 uppercase tracking-wider font-semibold">Peak Intensity Nakshatra</p>
                      </div>
                      <p className="text-amber-100 font-semibold text-sm">
                        {result.peakNakshatra.name}
                        <span className="text-amber-400/70 font-normal ml-2 text-xs">({result.peakNakshatra.tamilName})</span>
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        17th star from birth · Lord: {result.peakNakshatra.lord}
                      </p>
                      {result.isPeakDay && (
                        <motion.div
                          className="mt-2 text-xs text-amber-300 font-medium flex items-center gap-1"
                          animate={{ opacity: [0.7, 1, 0.7] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                          Peak active right now!
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Moon progress bars */}
                <motion.div variants={itemVariants} className="space-y-2.5">
                  {/* Progress in Rasi */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Moon in {result?.transitRasi?.name}</span>
                      <span>{result?.moonProgress?.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg,#818cf8,#c084fc,#f472b6)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${result?.moonProgress || 0}%` }}
                        transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                  {/* Progress in Nakshatra */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>In {result?.transitNakshatra?.name}</span>
                      <span>{result?.nakshatraProgress?.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg,#34d399,#06b6d4)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${result?.nakshatraProgress || 0}%` }}
                        transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 text-center">Moon ☽ {result?.moonLongitude?.toFixed(3)}° (tropical)</p>
                </motion.div>

                {/* Footer */}
                <motion.p variants={itemVariants} className="text-center text-slate-600 text-xs pt-1">
                  Calculated for {dateLabel} · IST noon reference
                </motion.p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Chandrashtama Daily Card (shows which Rasi/Nak faces it today) ────────────
const DAILY_PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i, x: (i * 41 + 9) % 95, y: (i * 59 + 13) % 91,
  size: (i % 3) + 1.2, delay: (i * 0.28) % 2.2, dur: 2.4 + (i % 3),
}));

function ChandrashtamaDailyCard({ isOpen, onClose }) {
  const [selDate, setSelDate]   = useState(new Date().toISOString().split('T')[0]);
  const [isDragging, setIsDrag] = useState(false);
  const constraintsRef          = useRef(null);

  const targetDate = useMemo(() => dateStringToISTNoon(selDate), [selDate]);

  const info = useMemo(() => {
    const moonLon      = approximateMoonLongitude(targetDate);
    const moonRasiIdx  = getRasiFromLongitude(moonLon);
    const moonNakIdx   = getNakshatraFromLongitude(moonLon);
    // Inverse: birthRasi whose 8th sign = moonRasi
    const affRasiIdx   = (moonRasiIdx - 7 + 12) % 12;
    // Inverse: birthNak whose 17th star = moonNak
    const affNakIdx    = (moonNakIdx - 16 + 27) % 27;
    const rasiNaks     = RASI_NAKSHATRAS[affRasiIdx].map(i => NAKSHATRAS[i]);
    const nakSpan      = 360 / 27;
    return {
      moonLon,
      moonRasi: RASI_ORDER[moonRasiIdx],
      moonNak:  NAKSHATRAS[moonNakIdx],
      affRasi:  RASI_ORDER[affRasiIdx],
      affNak:   NAKSHATRAS[affNakIdx],
      rasiNaks,
      rasiPct:  Math.min(100, ((moonLon - moonRasiIdx * 30) / 30) * 100),
      nakPct:   Math.min(100, ((moonLon - moonNakIdx * nakSpan) / nakSpan) * 100),
    };
  }, [targetDate]);

  const cardV = {
    hidden:  { opacity: 0, scale: 0.74, y: 50 },
    visible: { opacity: 1, scale: 1,    y: 0,
      transition: { type: 'spring', stiffness: 220, damping: 24, staggerChildren: 0.055 } },
    exit:    { opacity: 0, scale: 0.82, y: 36, transition: { duration: 0.2, ease: 'easeIn' } },
  };
  const itemV = {
    hidden:  { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
  };
  const dateLabel = new Date(selDate + 'T12:00:00')
    .toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="cd-backdrop"
          ref={constraintsRef}
          className="fixed inset-0 z-50 overflow-hidden"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ background: 'rgba(2,4,18,0.80)', backdropFilter: 'blur(8px)' }}
          onClick={() => { if (!isDragging) onClose(); }}
        >
          <motion.div
            key="cd-card"
            drag dragConstraints={constraintsRef} dragElastic={0.07} dragMomentum={false}
            onDragStart={() => setIsDrag(true)}
            onDragEnd={() => setTimeout(() => setIsDrag(false), 50)}
            onClick={e => e.stopPropagation()}
            variants={cardV} initial="hidden" animate="visible" exit="exit"
            className="absolute top-1/2 left-1/2"
            style={{
              width: 'min(93vw, 430px)',
              translateX: '-50%', translateY: '-50%',
              background: 'linear-gradient(135deg, #0c0726 0%, #180a38 45%, #071320 100%)',
              border: '1px solid rgba(168,85,247,0.32)',
              borderRadius: 26, overflow: 'hidden',
              boxShadow: '0 0 80px rgba(139,92,246,0.18), 0 30px 60px rgba(0,0,0,0.7)',
              userSelect: 'none',
            }}
          >
            {/* Particles */}
            <div className="absolute inset-0 pointer-events-none">
              {DAILY_PARTICLES.map(p => (
                <motion.span key={p.id} className="absolute rounded-full bg-white"
                  style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
                  animate={{ opacity: [0.1, 0.65, 0.1], scale: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: p.dur, delay: p.delay }}
                />
              ))}
              <motion.div className="absolute -top-24 -right-24 w-64 h-64 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle,rgba(139,92,246,0.14) 0%,transparent 70%)' }}
                animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 5 }}
              />
            </div>

            {/* Scrollable body */}
            <div
              className="overflow-y-auto scrollbar-hide"
              style={{ maxHeight: 'min(85vh, 640px)', cursor: 'default' }}
              onClick={e => e.stopPropagation()}
              onPointerDown={e => { if (!e.target.closest('[data-drag-handle]')) e.stopPropagation(); }}
            >
              {/* Grip */}
              <div data-drag-handle className="flex justify-center pt-3 pb-1 select-none"
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
                <GripHorizontal size={18} className="text-slate-400 opacity-40" />
              </div>

              {/* Header */}
              <div className="relative px-5 pt-1 pb-3">
                <div className="flex items-center justify-between">
                  <div className="relative w-11 h-11 flex-shrink-0">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Moon size={20} className="text-purple-300" />
                    </div>
                    <motion.div className="absolute inset-0"
                      animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 7, ease: 'linear' }}>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
                        style={{ background: '#c084fc', boxShadow: '0 0 6px #c084fc' }} />
                    </motion.div>
                  </div>
                  <div className="text-center flex-1 mx-3">
                    <motion.h2 variants={itemV} className="text-base font-bold tracking-widest uppercase"
                      style={{ background: 'linear-gradient(90deg,#c084fc,#818cf8,#e879f9)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      Chandrashtama
                    </motion.h2>
                    <motion.p variants={itemV} className="text-xs text-slate-500 mt-0.5">Daily Transit Report</motion.p>
                  </div>
                  <button onClick={onClose}
                    className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-slate-800/80 border border-slate-700 hover:bg-slate-700 transition-colors"
                    style={{ cursor: 'pointer' }}>
                    <X size={14} className="text-slate-400" />
                  </button>
                </div>
                <motion.div variants={itemV} className="h-px w-full mt-3"
                  style={{ background: 'linear-gradient(90deg,transparent,rgba(139,92,246,0.5),transparent)' }} />
              </div>

              {/* Date picker */}
              <motion.div variants={itemV} className="px-5 pb-4">
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarIcon size={11} className="text-purple-400" /> Select Date
                </label>
                <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)}
                  className="w-full bg-slate-800/70 border border-slate-700/80 text-white text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none"
                  style={{ colorScheme: 'dark', cursor: 'pointer' }} />
                <p className="text-xs text-slate-600 mt-1.5 text-center">{dateLabel}</p>
              </motion.div>

              <div className="px-5 pb-6 space-y-3">
                {/* Moon position */}
                <motion.div variants={itemV} className="rounded-2xl p-4 text-center"
                  style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.1),rgba(59,130,246,0.05))',
                    border: '1px solid rgba(139,92,246,0.22)' }}>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Moon&apos;s Position</p>
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-center">
                      <p className="text-white font-bold text-base">{info.moonRasi.name}</p>
                      <p className="text-purple-400 text-xs">{info.moonRasi.tamilName}</p>
                    </div>
                    <span className="text-slate-600 text-sm">in</span>
                    <div className="text-center">
                      <p className="text-white font-bold text-base">{info.moonNak.name}</p>
                      <p className="text-blue-400 text-xs">{info.moonNak.tamilName}</p>
                    </div>
                  </div>
                  <p className="text-slate-600 text-xs mt-2">Moon ☽ {info.moonLon.toFixed(2)}°</p>
                </motion.div>

                {/* Affected Rasi */}
                <motion.div variants={itemV} className="rounded-2xl p-5 relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg,rgba(239,68,68,0.12),rgba(185,28,28,0.06))',
                    border: '1px solid rgba(239,68,68,0.3)' }}>
                  <motion.div className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{ background: 'radial-gradient(circle at center,rgba(239,68,68,0.06) 0%,transparent 70%)' }}
                    animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2.5 }} />
                  <div className="relative flex items-start gap-3">
                    <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                      <ShieldAlert size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
                    </motion.div>
                    <div className="flex-1">
                      <p className="text-xs text-red-400 uppercase tracking-wider font-semibold mb-2">Rasi under Chandrashtama</p>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-2xl font-bold text-red-200">{info.affRasi.name}</span>
                        <span className="text-red-400 text-base font-medium">({info.affRasi.tamilName})</span>
                      </div>
                      <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                        People born with <strong className="text-red-300">{info.affRasi.name}</strong> as their Moon sign are experiencing Chandrashtama.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Nakshatras in Chandrashtama */}
                <motion.div variants={itemV} className="rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Star size={11} className="text-amber-400" /> Nakshatras in Chandrashtama
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {info.rasiNaks.map((n, i) => {
                      const active = n.name === info.moonNak.name;
                      return (
                        <motion.div key={n.name}
                          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.28 + i * 0.07, type: 'spring', stiffness: 260 }}
                          className="px-3 py-1.5 rounded-full text-xs font-medium"
                          style={{ background: active ? 'rgba(239,68,68,0.2)' : 'rgba(139,92,246,0.1)',
                            border: `1px solid ${active ? 'rgba(239,68,68,0.4)' : 'rgba(139,92,246,0.25)'}`,
                            color: active ? '#fca5a5' : '#c4b5fd' }}>
                          {n.name}
                          {active && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse align-middle" />}
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Peak Nakshatra */}
                <motion.div variants={itemV} className="rounded-xl p-4"
                  style={{ background: 'linear-gradient(135deg,rgba(251,191,36,0.07),rgba(245,158,11,0.03))',
                    border: '1px solid rgba(251,191,36,0.18)' }}>
                  <p className="text-xs text-amber-400 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                    <Sparkles size={11} /> Peak Birth Star (Chandrashtama)
                  </p>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-amber-100 font-bold text-base">{info.affNak.name}</span>
                    <span className="text-amber-400/70 text-xs">({info.affNak.tamilName})</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">
                    Born under <strong className="text-amber-200">{info.affNak.name}</strong> — today is your peak Chandrashtama. Lord: {info.affNak.lord}
                  </p>
                </motion.div>

                {/* Progress bars */}
                <motion.div variants={itemV} className="space-y-2.5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Moon in {info.moonRasi.name}</span><span>{info.rasiPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg,#818cf8,#c084fc,#f472b6)' }}
                        initial={{ width: 0 }} animate={{ width: `${info.rasiPct}%` }}
                        transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Moon in {info.moonNak.name}</span><span>{info.nakPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg,#34d399,#06b6d4)' }}
                        initial={{ width: 0 }} animate={{ width: `${info.nakPct}%` }}
                        transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }} />
                    </div>
                  </div>
                </motion.div>

                <motion.p variants={itemV} className="text-center text-slate-600 text-xs pt-1">
                  IST noon reference · Meeus Ch.47
                </motion.p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Horoscope() {
  const { user } = useAuth();
  const [selectedSign, setSelectedSign] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('grid'); // 'grid' or 'detail'
  const [selectedDate, setSelectedDate] = useState('');
  const [tamilDateStr, setTamilDateStr] = useState(null);
  const [error, setError] = useState(null);
  const [showChandrashtama, setShowChandrashtama] = useState(false);
  const [showDailyChandra,   setShowDailyChandra]  = useState(false);

  const handleSignClick = (sign) => {
    setSelectedSign(sign);
    setView('detail');
    setPrediction(null);
    setSelectedDate('');
    setTamilDateStr(null);
    setError(null);
    setShowChandrashtama(false);
  };

  const handleDateChange = async (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    
    if (date) {
      const tDate = getTamilDate(date);
      setTamilDateStr(tDate ? `${tDate.month} ${tDate.day}, ${new Date(date).getFullYear()}` : null);
    } else {
      setTamilDateStr(null);
    }

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
    setTamilDateStr(null);
    setShowChandrashtama(false);
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

                {/* ── Chandrashtama Daily Button ── */}
                <motion.button
                  onClick={() => setShowDailyChandra(true)}
                  className="w-full mb-6 relative overflow-hidden rounded-2xl py-3.5 px-6 flex items-center justify-center gap-3 font-semibold tracking-wide group cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg,rgba(88,28,135,0.55) 0%,rgba(30,27,75,0.75) 60%,rgba(15,23,42,0.85) 100%)',
                    border: '1px solid rgba(168,85,247,0.38)',
                    boxShadow: '0 4px 24px rgba(139,92,246,0.14)',
                  }}
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(139,92,246,0.32)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  {/* Shimmer sweep */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: 'linear-gradient(105deg,transparent 30%,rgba(168,85,247,0.16) 50%,transparent 70%)' }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
                  />
                  {/* Orbiting moon */}
                  <span className="relative w-6 h-6 flex-shrink-0">
                    <Moon size={15} className="text-purple-300 absolute inset-0 m-auto" />
                    <motion.span className="absolute inset-0"
                      animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}>
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                        style={{ background: '#f472b6', boxShadow: '0 0 4px #f472b6' }} />
                    </motion.span>
                  </span>
                  <span className="text-sm" style={{
                    background: 'linear-gradient(90deg,#e9d5ff,#c084fc,#a78bfa)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>Chandrashtama</span>
                  <motion.div animate={{ x: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                    <Sparkles size={14} className="text-purple-400 flex-shrink-0" />
                  </motion.div>
                </motion.button>

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

                            <div className="flex flex-col items-center gap-1">
                                <span className={`text-sm font-medium transition-colors ${sign.name === 'Scorpio' ? 'text-purple-300 group-hover:text-purple-200' : 'text-slate-300 group-hover:text-white'}`}>
                                    {sign.name}
                                </span>
                                <span className="text-xs font-light text-purple-400 opacity-80 group-hover:opacity-100 transition-opacity">
                                    {sign.tamilName}
                                </span>
                            </div>
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
                        <h2 className="text-4xl font-bold text-white tracking-wide">
                            {selectedSign.name} <span className="text-2xl font-light text-purple-400">({selectedSign.tamilName})</span>
                        </h2>
                        <p className="text-purple-300 mt-2 font-medium">{selectedSign.dates}</p>
                    </div>

                    {/* ── Chandrashtama Button ── */}
                    <motion.div
                      className="w-full max-w-md mb-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <motion.button
                        onClick={() => setShowChandrashtama(true)}
                        className="w-full relative overflow-hidden rounded-2xl py-4 px-6 flex items-center justify-center gap-3 font-semibold text-base tracking-wide group cursor-pointer"
                        style={{
                          background: 'linear-gradient(135deg, rgba(88,28,135,0.6) 0%, rgba(30,27,75,0.8) 60%, rgba(15,23,42,0.9) 100%)',
                          border: '1px solid rgba(168,85,247,0.4)',
                          boxShadow: '0 4px 24px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
                        }}
                        whileHover={{
                          scale: 1.02,
                          boxShadow: '0 8px 32px rgba(139,92,246,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Shimmer layer */}
                        <motion.div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{
                            background: 'linear-gradient(105deg, transparent 30%, rgba(168,85,247,0.15) 50%, transparent 70%)',
                          }}
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                        />

                        {/* Orbiting dot */}
                        <div className="relative w-8 h-8 flex-shrink-0">
                          <Moon size={18} className="text-purple-300 absolute inset-0 m-auto" />
                          <motion.div
                            className="absolute inset-0"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                          >
                            <div
                              className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-pink-400"
                              style={{ boxShadow: '0 0 6px #f472b6' }}
                            />
                          </motion.div>
                        </div>

                        <span
                          style={{
                            background: 'linear-gradient(90deg, #e9d5ff, #c084fc, #a78bfa)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          Chandrashtama
                        </span>

                        <motion.div
                          className="flex-shrink-0"
                          animate={{ x: [0, 3, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                        >
                          <Sparkles size={16} className="text-purple-400" />
                        </motion.div>
                      </motion.button>
                    </motion.div>

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

                        {/* Tamil Date Display */}
                        <AnimatePresence>
                            {tamilDateStr && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginTop: -8 }}
                                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                    className="mb-8 flex justify-center overflow-hidden"
                                >
                                    <div className="bg-purple-900/40 text-purple-200 text-sm font-medium px-4 py-2 rounded-lg border border-purple-500/30 flex items-center gap-2 shadow-lg shadow-purple-500/10">
                                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                                        {tamilDateStr}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

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

        {/* ── Chandrashtama Personal Card ── */}
        <ChandrashtamaCard
          isOpen={showChandrashtama}
          onClose={() => setShowChandrashtama(false)}
          birthRasiName={selectedSign?.name || 'Aries'}
          date={selectedDate || new Date().toISOString().split('T')[0]}
        />

        {/* ── Chandrashtama Daily Transit Card ── */}
        <ChandrashtamaDailyCard
          isOpen={showDailyChandra}
          onClose={() => setShowDailyChandra(false)}
        />
    </PageTransition>
  );
}
