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
        <div className="flex flex-col items-center justify-center p-6 w-full">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3">
                    {t('welcome_title')}
                </h1>
                <p className="text-[var(--text-secondary)] text-base max-w-sm mx-auto leading-relaxed">
                    {t('welcome_subtitle')}
                </p>
            </motion.div>

            <div className="flex flex-col gap-4 w-full max-w-sm">
                {/* Parent Button */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectUserType('parent')}
                    className="group relative w-full p-6 h-32 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg overflow-hidden flex flex-col items-center justify-center gap-1"
                >
                    <div className="text-3xl mb-1">🏠</div>
                    <div className="text-xl font-bold">{t('welcome_parent_button')}</div>
                    <div className="text-pink-100 text-sm font-medium opacity-90">{t('welcome_parent_subtext')}</div>
                </motion.button>

                {/* Nanny Button */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectUserType('nanny')}
                    className="group relative w-full p-6 h-32 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg overflow-hidden flex flex-col items-center justify-center gap-1"
                >
                    <div className="text-3xl mb-1">💼</div>
                    <div className="text-xl font-bold">{t('welcome_nanny_button')}</div>
                    <div className="text-purple-100 text-sm font-medium opacity-90">{t('welcome_nanny_subtext')}</div>
                </motion.button>
            </div>

            <div className="mt-8 text-[var(--text-secondary)] text-sm font-medium">
                {t('welcome_already_account')}{' '}
                <button
                    onClick={onLogin}
                    className="text-[var(--accent-primary)] font-bold hover:underline ml-1"
                >
                    {t('button_login')}
                </button>
            </div>
        </div>
    );
};

export default WelcomeScreen;
