import React, { useState } from 'react';
import { UserType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface SignUpScreenProps {
  userType: UserType;
  onSignUp: (fullName: string, email: string, pass: string, userType: UserType) => void;
  onBack: () => void;
  onLogin: () => void;
  error: string | null;
}

const PasswordStrengthIndicator: React.FC<{ password: string }> = ({ password }) => {
    const { t } = useLanguage();
    const calculateStrength = () => {
        let score = 0;
        if (password.length > 8) score++;
        if (password.length > 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return score;
    };

    const strength = calculateStrength();
    const strengthLevels = [
        { label: '', color: 'bg-gray-200' },
        { label: t('password_strength_weak'), color: 'bg-red-500' },
        { label: t('password_strength_weak'), color: 'bg-red-500' },
        { label: t('password_strength_medium'), color: 'bg-yellow-500' },
        { label: t('password_strength_strong'), color: 'bg-green-500' },
        { label: t('password_strength_very_strong'), color: 'bg-green-700' },
    ];

    const level = strengthLevels[strength];
    const progressPercentage = (strength / 5) * 100;

    return (
        <div>
            <div className="h-2 w-full bg-gray-200 rounded-full mt-1">
                <div 
                    className={`h-2 rounded-full ${level.color} transition-all duration-300`} 
                    style={{ width: `${progressPercentage}%`}}
                ></div>
            </div>
            <p className={`text-xs mt-1 ${strength > 2 ? 'text-[var(--accent-green)]' : 'text-[var(--text-light)]'}`}>
                {level.label}
            </p>
        </div>
    );
};

const SignUpScreen: React.FC<SignUpScreenProps> = ({ userType, onSignUp, onBack, onLogin, error }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignUp(fullName, email, password, userType);
  };

  const title = userType === 'parent' ? t('signup_title_parent') : t('signup_title_nanny');

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{title}</h2>
        <p className="text-[var(--text-secondary)]">{t('signup_subtitle')}</p>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
        <span className="block sm:inline">{error}</span>
      </div>}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-[var(--text-secondary)]">{t('form_fullname_label')}</label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
            className="mt-1 block w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--ring-accent)] focus:border-[var(--border-accent)] sm:text-sm text-[var(--text-primary)]"
          />
        </div>
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
            minLength={6}
            autoComplete="new-password"
            className="mt-1 block w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--ring-accent)] focus:border-[var(--border-accent)] sm:text-sm text-[var(--text-primary)]"
          />
          <PasswordStrengthIndicator password={password} />
        </div>
        <div>
          <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--ring-accent)]">
            {t('button_signup')}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
              {t('welcome_already_account')}{' '}
              <button onClick={onLogin} className="font-medium text-[var(--text-accent)] hover:text-[var(--accent-primary)]">
                  {t('button_login')}
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

export default SignUpScreen;