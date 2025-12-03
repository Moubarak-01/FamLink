import React from 'react';
import { UserType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface WelcomeScreenProps {
  onSelectUserType: (type: UserType) => void;
  onLogin: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectUserType, onLogin }) => {
  const { t } = useLanguage();
  return (
    <div className="p-8 text-center">
      <div className="mb-6">
        <span className="text-5xl">🌸</span>
      </div>
      <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-3">{t('welcome_title')}</h2>
      <p className="text-[var(--text-secondary)] mb-8 max-w-lg mx-auto">
        {t('welcome_subtitle')}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => onSelectUserType('parent')}
          className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-bold py-4 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300 ease-in-out"
        >
          <div className="text-2xl mb-1">🏡</div>
          <h3 className="font-semibold">{t('welcome_parent_button')}</h3>
          <p className="text-sm font-light">{t('welcome_parent_subtext')}</p>
        </button>
        <button
          onClick={() => onSelectUserType('nanny')}
          className="bg-[var(--accent-secondary)] hover:bg-[var(--accent-secondary-hover)] text-white font-bold py-4 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300 ease-in-out"
        >
          <div className="text-2xl mb-1">💼</div>
          <h3 className="font-semibold">{t('welcome_nanny_button')}</h3>
          <p className="text-sm font-light">{t('welcome_nanny_subtext')}</p>
        </button>
      </div>
      <div className="mt-8">
        <p className="text-sm text-[var(--text-secondary)]">
            {t('welcome_already_account')}{' '}
            <button onClick={onLogin} className="font-medium text-[var(--text-accent)] hover:text-[var(--accent-primary)]">
                {t('button_login')}
            </button>
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;