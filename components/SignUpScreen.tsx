import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import AuthLayout, { formContainerVariants, formItemVariants } from './AuthLayout';

interface SignUpScreenProps {
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
      <div className="h-2 w-full bg-white/20 rounded-full mt-1 overflow-hidden">
        <motion.div
          className={`h-2 rounded-full ${level.color}`}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <p className={`text-xs mt-1 transition-colors ${strength > 2 ? 'text-[var(--accent-green)]' : 'text-[var(--text-light)]'}`}>
        {level.label}
      </p>
    </div>
  );
};

const SignUpScreen: React.FC<SignUpScreenProps> = ({ onSignUp, onBack, onLogin, error }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert(t('form_passwords_must_match'));
      return;
    }

    // Simulate Success Transition
    setIsSuccess(true);

    // Tiny delay to show the success message before actual action
    setTimeout(() => {
      onSignUp(fullName, email, password, 'parent');
    }, 1500);
  };

  const title = t('signup_title_parent');

  return (
    <AuthLayout title={isSuccess ? t('signup_success_title') : title} subtitle={isSuccess ? t('signup_success_subtitle') : t('signup_subtitle')}>
      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.div
            key="form"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
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
              className="space-y-4 sm:space-y-5"
              variants={formContainerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={formItemVariants}>
                <label htmlFor="fullName" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  {t('form_fullname_label')}
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                  className="auth-input w-full px-4 py-3"
                  placeholder={t('placeholder_name_example')}
                />
              </motion.div>

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
                  placeholder={t('placeholder_email_example')}
                />
              </motion.div>

              <motion.div variants={formItemVariants}>
                <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  {t('form_password_label')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="auth-input w-full px-4 py-3 pr-10"
                    placeholder={t('placeholder_password_dots')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[var(--accent-primary)] transition-colors duration-300"
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
                <PasswordStrengthIndicator password={password} />
              </motion.div>

              <motion.div variants={formItemVariants}>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  {t('form_confirm_password_label')}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="auth-input w-full px-4 py-3 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[var(--accent-primary)] transition-colors duration-300"
                  >
                    {showConfirmPassword ? (
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
                  className="w-full py-3 px-4 rounded-full font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--ring-accent)] shadow-lg shadow-pink-500/25 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                >
                  {t('button_signup')}
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
                {t('welcome_already_account')}{' '}
                <button
                  onClick={onLogin}
                  className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 transition-all duration-300"
                >
                  {t('button_login')}
                </button>
              </p>
            </motion.div>

            <motion.div
              className="mt-6 pt-6 border-t border-white/10 flex justify-center"
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
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-64 text-center"
          >
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{t('signup_success_title')}</h3>
            <p className="text-[var(--text-secondary)]">{t('signup_success_subtitle')}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
};
export default SignUpScreen;