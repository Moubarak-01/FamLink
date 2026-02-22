import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

// Stagger animation variants for form fields
export const formContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.3
        }
    }
};

export const formItemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 12
        }
    }
};

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className="min-h-screen w-full flex items-center justify-center overflow-hidden transition-colors duration-500 pt-[120px] pb-10 relative">

            {/* === ANIMATED BLOB ORBS — identical mechanic to dark mode, light-mode colours === */}
            {/* Top-left blob */}
            <div className={`absolute top-[-60px] left-[-80px] w-[480px] h-[480px] rounded-full blur-[120px] pointer-events-none animate-float-blob
                ${isDark ? 'bg-purple-600/25' : 'bg-pink-400/30'}`}
            />
            {/* Top-right blob */}
            <div className={`absolute top-[10%] right-[-80px] w-[380px] h-[380px] rounded-full blur-[100px] pointer-events-none animate-float-blob-reverse
                ${isDark ? 'bg-indigo-500/20' : 'bg-violet-400/25'}`}
            />
            {/* Bottom-center blob */}
            <div className={`absolute bottom-[0px] left-[30%] w-[420px] h-[300px] rounded-full blur-[110px] pointer-events-none animate-float-blob-slow
                ${isDark ? 'bg-pink-500/15' : 'bg-rose-300/30'}`}
            />

            {/* Auth Form Card */}
            <motion.div
                className="w-full flex items-center justify-center p-4 relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                <div className={`
                    w-full max-w-[450px] p-8 sm:p-10 
                    auth-glass-card
                    ${isDark ? 'card-glow-dark' : 'card-glow-light'}
                `}>
                    {/* Header */}
                    <div className="text-center mb-6 sm:mb-8">
                        <h2 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {title}
                        </h2>
                        <p className={`text-sm sm:text-base ${isDark ? 'text-indigo-200' : 'text-slate-500'}`}>{subtitle}</p>
                    </div>

                    {/* Form Content */}
                    {children}
                </div>
            </motion.div>
        </div>
    );
};

export default AuthLayout;
