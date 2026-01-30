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
    <AuthLayout title={t('login_title')} subtitle={t('login_subtitle')}>
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

      <motion.form
        onSubmit={handleSubmit}
        className="space-y-5"
        variants={formContainerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={formItemVariants}>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            {t('form_email_label')}
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="auth-input w-full px-4 py-3"
            placeholder="jane@example.com"
          />
        </motion.div>

        <motion.div variants={formItemVariants}>
          <div className="flex justify-between items-center mb-1">
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
              className="auth-input w-full px-4 py-3 pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[var(--accent-primary)] transition-colors"
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

        <motion.div variants={formItemVariants}>
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-full font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--ring-accent)] shadow-lg shadow-pink-500/25 transform hover:scale-[1.02] transition-all duration-200"
          >
            {t('button_login')}
          </button>
        </motion.div>
      </motion.form>

      <motion.div
        className="mt-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p className="text-sm text-[var(--text-secondary)]">
          {t('welcome_no_account')}{' '}
          <button onClick={onSignUp} className="font-medium text-[var(--text-accent)] hover:text-[var(--accent-primary)] transition-colors">
            {t('button_signup')}
          </button>
        </p>
      </motion.div>

      <motion.div
        className="mt-6 pt-6 border-t border-white/10 flex justify-start"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <button
          onClick={onBack}
          className="auth-btn-secondary font-bold py-2 px-6 rounded-full backdrop-blur-sm shadow-sm text-sm"
        >
          {t('button_back')}
        </button>
      </motion.div>
    </AuthLayout>
  );
};

export default LoginScreen;