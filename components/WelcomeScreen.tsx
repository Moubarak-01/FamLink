import React from 'react';
import { motion } from 'framer-motion';
import { UserType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface WelcomeScreenProps {
    onSelectUserType: (type: UserType) => void;
    onLogin: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectUserType, onLogin }) => {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="dynamic-glass relative z-10 w-full max-w-md mx-auto p-6 sm:p-10"
            >
                <div className="text-center mb-8 sm:mb-10">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] to-purple-600 mb-4 tracking-tight">
                        {t('welcome_title')}
                    </h1>
                    <p className="text-[var(--text-secondary)] text-sm sm:text-base leading-relaxed px-2">
                        {t('welcome_subtitle')}
                    </p>
                </div>

                <div className="flex flex-col gap-4 sm:gap-5 w-full">
                    {/* Parent Button */}
                    <motion.button
                        whileHover={{ scale: 1.03, translateY: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelectUserType('parent')}
                        className="group relative w-full p-4 sm:p-6 h-28 sm:h-32 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25 overflow-hidden flex flex-col items-center justify-center gap-1 transition-all"
                    >
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300"></div>
                        <div className="text-3xl sm:text-4xl mb-1 transform group-hover:scale-110 transition-transform duration-300">🏠</div>
                        <div className="text-lg sm:text-xl font-bold">{t('welcome_parent_button')}</div>
                        <div className="text-pink-100 text-xs sm:text-sm font-medium opacity-90">{t('welcome_parent_subtext')}</div>
                    </motion.button>

                    {/* Nanny Button */}
                    <motion.button
                        whileHover={{ scale: 1.03, translateY: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelectUserType('nanny')}
                        className="group relative w-full p-4 sm:p-6 h-28 sm:h-32 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25 overflow-hidden flex flex-col items-center justify-center gap-1 transition-all"
                    >
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300"></div>
                        <div className="text-3xl sm:text-4xl mb-1 transform group-hover:scale-110 transition-transform duration-300">💼</div>
                        <div className="text-lg sm:text-xl font-bold">{t('welcome_nanny_button')}</div>
                        <div className="text-purple-100 text-xs sm:text-sm font-medium opacity-90">{t('welcome_nanny_subtext')}</div>
                    </motion.button>
                </div>

                <div className="mt-8 sm:mt-10 text-center text-[var(--text-secondary)] text-sm font-medium">
                    {t('welcome_already_account')}{' '}
                    <button
                        onClick={onLogin}
                        className="text-[var(--accent-primary)] font-bold hover:text-pink-600 dark:hover:text-pink-400 hover:underline ml-1 transition-colors"
                    >
                        {t('button_login')}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default WelcomeScreen;
