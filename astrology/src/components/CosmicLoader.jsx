import { motion } from 'framer-motion';

export default function CosmicLoader() {
    return (
        <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative w-24 h-24">
                {/* Orbital Ring 1 */}
                <motion.div 
                    className="absolute inset-0 border-2 border-purple-500 rounded-full border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Orbital Ring 2 */}
                <motion.div 
                    className="absolute inset-2 border-2 border-pink-500 rounded-full border-b-transparent"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Center Star */}
                <motion.div 
                    className="absolute inset-0 flex items-center justify-center text-yellow-300"
                    animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                     </svg>
                </motion.div>
            </div>
            <motion.p 
                className="text-purple-300 font-medium tracking-widest text-sm uppercase"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            >
                Consulting the Stars...
            </motion.p>
        </div>
    );
}
