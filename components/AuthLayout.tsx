import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import ThreeDCharacter from './ThreeDCharacter';

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
            {/* Background Gradient */}
            <div className={`fixed inset-0 z-0 ${isDark ? 'bg-gradient-to-br from-indigo-900/20 via-black to-purple-900/20' : 'bg-gradient-to-br from-pink-50 via-white to-purple-50'}`} />

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

