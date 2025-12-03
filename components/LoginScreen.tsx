import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface LoginScreenProps {
  onLogin: (email: string, pass: string, rememberMe: boolean) => void;
  onBack: () => void;
  onSignUp: () => void;
  onForgotPassword: () => void;
  error: string | null;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onBack, onSignUp, onForgotPassword, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password, rememberMe);
  };

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{t('login_title')}</h2>
        <p className="text-[var(--text-secondary)]">{t('login_subtitle')}</p>
      </div>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
        <span className="block sm:inline">{error}</span>
      </div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)]">{t('form_email_label')}</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="mt-1 block w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--ring-accent)] focus:border-[var(--border-accent)] sm:text-sm text-[var(--text-primary)]"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)]">{t('form_password_label')}</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="mt-1 block w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--ring-accent)] focus:border-[var(--border-accent)] sm:text-sm text-[var(--text-primary)]"
          />
        </div>
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="custom-checkbox"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-[var(--text-primary)]">
                {t('form_remember_me')}
                </label>
            </div>
            <div className="text-sm">
                <button type="button" onClick={onForgotPassword} className="font-medium text-[var(--text-accent)] hover:text-[var(--accent-primary)]">
                {t('form_forgot_password')}
                </button>
            </div>
        </div>
        <div>
          <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--ring-accent)]">
            {t('button_login')}
          </button>
        </div>
      </form>
      
      <div className="mt-6 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
              {t('login_no_account')}{' '}
              <button onClick={onSignUp} className="font-medium text-[var(--text-accent)] hover:text-[var(--accent-primary)]">
                  {t('button_signup')}
              </button>
          </p>
      </div>

      <div className="mt-8 pt-6 border-t border-[var(--border-color)] flex justify-start">
        <button
          onClick={onBack}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-6 rounded-full"
        >
          {t('button_back')}
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;