import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

interface LandingPageProps {
    onFinish: () => void;
    onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onFinish, onLogin }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className="min-h-full flex flex-col items-center justify-center p-4 pt-10 pb-10 relative overflow-hidden font-sans transition-colors duration-500">

            {/* === ANIMATED BLOB ORBS — visible in BOTH modes === */}
            {/* Top-left blob */}
            <div className={`absolute top-[-80px] left-[-60px] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none animate-float-blob
                ${isDark ? 'bg-purple-600/20' : 'bg-pink-400/25'}`}
            />
            {/* Top-right blob */}
            <div className={`absolute top-[5%] right-[-100px] w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none animate-float-blob-reverse
                ${isDark ? 'bg-indigo-500/20' : 'bg-purple-400/20'}`}
            />
            {/* Bottom-center blob */}
            <div className={`absolute bottom-[-60px] left-1/3 w-[450px] h-[350px] rounded-full blur-[110px] pointer-events-none animate-float-blob-slow
                ${isDark ? 'bg-pink-500/15' : 'bg-cyan-400/20'}`}
            />

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`rounded-[2rem] p-8 md:p-10 max-w-[28rem] w-full relative z-10 transition-colors duration-500
                    ${isDark
                        ? 'bg-[#1c1a27]/80 backdrop-blur-xl'
                        : 'bg-white/60 backdrop-blur-xl'
                    }`}
            >
                <div className="text-center mb-8">
                    <h1 className={`text-3xl md:text-4xl font-extrabold mb-4 tracking-tight
                        ${isDark
                            ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400'
                            : 'text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600'
                        }`}>
                        Welcome to FamLink
                    </h1>
                    <p className={`text-sm md:text-base leading-relaxed px-2 ${isDark ? 'text-[#a09fa6]' : 'text-slate-500'}`}>
                        We connect families with trusted providers to create a happy, supportive community. Tell us who you are to get started.
                    </p>
                </div>

                <div className="space-y-4">
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onFinish}
                        className="w-full bg-gradient-to-r from-[#fc466b] to-[#3f5efb] hover:from-[#fd5c7d] hover:to-[#506dfc] text-white rounded-2xl p-6 transition-all shadow-[0_8px_30px_rgb(252,70,107,0.3)] flex flex-col items-center justify-center group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-3xl mb-1 block">🏠</span>
                        <span className="text-lg font-bold tracking-wide">I'm a Parent</span>
                        <span className="text-sm font-medium opacity-90 mt-1">Find trusted help</span>
                    </motion.button>
                </div>

                <div className={`mt-8 pt-4 text-center flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2`}>
                    <span className={`text-sm font-medium ${isDark ? 'text-[#a09fa6]' : 'text-slate-500'}`}>Already have an account?</span>
                    <button
                        onClick={onLogin}
                        className="text-pink-500 font-bold text-sm hover:text-pink-400 transition-colors"
                    >
                        Log In
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default LandingPage;
