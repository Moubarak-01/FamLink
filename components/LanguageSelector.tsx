import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const languages = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  ja: '日本語',
  zh: '中文',
  ar: 'العربية'
};

const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as keyof typeof languages);
  };

  return (
    <div className="relative">
      <select
        value={language}
        onChange={handleLanguageChange}
        className="appearance-none border rounded-md py-1.5 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-colors"
        style={{
            backgroundColor: 'var(--header-icon-bg)',
            borderColor: 'var(--header-border)',
            color: 'var(--header-text)'
        }}
      >
        {Object.entries(languages).map(([code, name]) => (
          <option key={code} value={code} style={{backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)'}}>
            {name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[var(--header-text)]">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M5.516 7.548c.436-.446 1.144-.446 1.58 0L10 10.404l2.904-2.856c.436-.446 1.144-.446 1.58 0 .436.446.436 1.164 0 1.61L10.79 12.8c-.436.446-1.144.446-1.58 0L5.516 9.158c-.436-.446-.436-1.164 0-1.61z"/>
        </svg>
      </div>
    </div>
  );
};

export default LanguageSelector;