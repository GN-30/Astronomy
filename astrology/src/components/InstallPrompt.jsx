import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Monitor } from 'lucide-react';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      
      // Check if user dismissed it recently
      const lastDismissed = localStorage.getItem('pwa-prompt-dismissed');
      const now = Date.now();
      
      // Show if not dismissed or dismissed more than 7 days ago
      if (!lastDismissed || now - parseInt(lastDismissed) > 7 * 24 * 60 * 60 * 1000) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // If it's iOS, we show the hint manually since there's no event
    if (isIOSDevice && !window.navigator.standalone) {
        const lastDismissed = localStorage.getItem('pwa-prompt-dismissed');
        const now = Date.now();
        if (!lastDismissed || now - parseInt(lastDismissed) > 7 * 24 * 60 * 60 * 1000) {
            // Small delay for better UX
            const timer = setTimeout(() => setIsVisible(true), 3000);
            return () => clearTimeout(timer);
        }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[100]"
      >
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl relative overflow-hidden group">
          {/* Animated Background Glow */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-500/20 blur-3xl group-hover:bg-purple-500/30 transition-colors duration-500" />
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-pink-500/20 blur-3xl group-hover:bg-pink-500/30 transition-colors duration-500" />

          <button 
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg">
              {isIOS ? <Smartphone size={24} /> : (deferredPrompt ? <Download size={24} /> : <Monitor size={24} />)}
            </div>
            
            <div className="flex-1 pr-6">
              <h3 className="text-white font-semibold text-lg leading-tight">Install AstroNova</h3>
              <p className="text-slate-400 text-sm mt-1">
                {isIOS 
                  ? "Tap the Share button and select 'Add to Home Screen' for the full experience."
                  : "Add AstroNova to your home screen for faster access and offline features."}
              </p>
            </div>
          </div>

          {!isIOS && deferredPrompt && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleInstallClick}
              className="mt-4 w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-900/20"
            >
              Install App
            </motion.button>
          )}

          {isIOS && (
             <div className="mt-3 text-[10px] text-slate-500 uppercase tracking-widest font-bold text-center">
                iOS Installation Hint
             </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallPrompt;
