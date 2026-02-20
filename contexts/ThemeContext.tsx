import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme;
      }
      // Default to user's system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (error) {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      console.log(`[ThemeContext] Setting theme to: ${theme}. Stored: ${localStorage.getItem('theme')}. System Dark: ${window.matchMedia('(prefers-color-scheme: dark)').matches}`);
      localStorage.setItem('theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
      // Tailwind uses darkMode: 'class', so we MUST toggle the 'dark' class
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        console.log('[ThemeContext] Added .dark class');
      } else {
        document.documentElement.classList.remove('dark');
        console.log('[ThemeContext] Removed .dark class');
      }
    } catch (error) {
      console.error("Failed to set theme in localStorage", error);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
