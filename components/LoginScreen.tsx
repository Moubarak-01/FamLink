import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import AuthLayout, { formContainerVariants, formItemVariants } from './AuthLayout';

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
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password, false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="dynamic-glass relative z-10 w-full max-w-md mx-auto p-6 sm:p-10"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] to-purple-600 mb-2">
            {t('login_title')}
          </h2>
          <p className="text-[var(--text-secondary)] text-sm">
            {t('login_subtitle')}
          </p>
        </div>

        {error && (
          <motion.div
            className="bg-red-500/20 backdrop-blur-sm border border-red-400/50 text-red-200 px-4 py-3 rounded-xl relative mb-4"
            role="alert"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <span className="block sm:inline">{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <motion.div variants={formItemVariants}>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5 ml-1">
              {t('form_email_label')}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="dynamic-glass-input w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-[var(--accent-primary)] outline-none transition-all"
              placeholder={t('placeholder_email_example')}
            />
          </motion.div>

          <motion.div variants={formItemVariants}>
            <div className="flex justify-between items-center mb-1.5 ml-1">
              <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)]">
                {t('form_password_label')}
              </label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-xs font-medium text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] transition-colors"
              >
                {t('button_forgot_password')}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="dynamic-glass-input w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-[var(--accent-primary)] outline-none transition-all pr-12"
                placeholder={t('placeholder_password_dots')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.742L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                )}
              </button>
            </div>
          </motion.div>

          <motion.button
            variants={formItemVariants}
            type="submit"
            className="w-full bg-gradient-to-r from-[var(--accent-primary)] to-pink-600 text-white font-bold py-3.5 rounded-xl text-lg shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            {t('button_login')}
          </motion.button>
        </form>

        <motion.div variants={formItemVariants} className="mt-8 text-center text-sm">
          <span className="text-[var(--text-secondary)]">{t('login_no_account')} </span>
          <button
            onClick={onSignUp}
            className="text-[var(--accent-primary)] font-bold hover:underline"
          >
            {t('button_signup')}
          </button>
        </motion.div>

        <motion.div variants={formItemVariants} className="mt-8 pt-6 border-t border-[var(--auth-card-border)] text-center">
          <button
            onClick={onBack}
            className="px-6 py-2 rounded-full bg-[var(--auth-input-bg)] text-[var(--text-secondary)] font-medium hover:bg-[var(--auth-input-border)] transition-colors text-sm"
          >
            {t('button_back')}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;