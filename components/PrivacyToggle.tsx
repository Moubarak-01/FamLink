import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Lock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface PrivacyToggleProps {
    value: 'public' | 'private';
    onChange: (value: 'public' | 'private') => void;
}

const PrivacyToggle: React.FC<PrivacyToggleProps> = ({ value, onChange }) => {
    const { t } = useLanguage();
    const isPublic = value === 'public';

    return (
        <div className="flex flex-col gap-2">
            <div
                onClick={() => onChange(isPublic ? 'private' : 'public')}
                className={`
          relative w-20 h-10 rounded-full cursor-pointer p-1 transition-colors duration-300
          ${isPublic ? 'bg-green-400' : 'bg-gradient-to-r from-pink-500 to-purple-600'}
        `}
            >
                <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 700, damping: 30 }}
                    className={`
            bg-white w-8 h-8 rounded-full shadow-md flex items-center justify-center text-gray-700
            ${isPublic ? 'ml-0' : 'ml-auto'}
          `}
                >
                    {isPublic ? <Globe size={18} /> : <Lock size={18} />}
                </motion.div>
            </div>

            <p className="text-xs text-gray-500 font-medium">
                {isPublic
                    ? (t('privacy_public_hint') || 'Anyone can join instantly. Great for open events.')
                    : (t('privacy_private_hint') || 'Users must send a request. You approve who joins.')
                }
            </p>
        </div>
    );
};

export default PrivacyToggle;
