import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
// FIX: Changed import to be more specific to avoid conflict with `locales.ts` file.
import { translations } from '../locales/index';
import { formatKeyFallback } from '../utils/textUtils';

type Language = 'en' | 'fr' | 'es' | 'ja' | 'zh' | 'ar';

export type TFunction = (key: string, options?: { [key: string]: string | number }) => string;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: TFunction;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const isLanguage = (lang: string): lang is Language => {
  return ['en', 'fr', 'es', 'ja', 'zh', 'ar'].includes(lang);
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const storedLang = localStorage.getItem('language');
    return storedLang && isLanguage(storedLang) ? storedLang : 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    if (language === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = useMemo((): TFunction => (key, options) => {
    const langTranslations = translations[language] || translations.en;
    let translation = langTranslations[key as keyof typeof langTranslations] ||
      translations.en[key as keyof typeof translations.en] ||
      formatKeyFallback(key);

    if (options) {
      Object.keys(options).forEach(optionKey => {
        const value = String(options[optionKey]);
        // Support both {key} and {{key}} and replace all occurrences
        const singleBrace = `{${optionKey}}`;
        const doubleBrace = `{{${optionKey}}}`;
        while (translation.includes(singleBrace)) {
          translation = translation.replace(singleBrace, value);
        }
        while (translation.includes(doubleBrace)) {
          translation = translation.replace(doubleBrace, value);
        }
      });
    }
    return translation;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};