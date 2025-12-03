
import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ForgotPasswordScreenProps {
  onSubmit: (email: string) => Promise<void> | void;
  onBack: () => void;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onSubmit, onBack }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
        await onSubmit(email);
    } finally {
        // If navigation doesn't happen immediately or fails, stop loading.
        // In successful flow, component unmounts, so this state update might be ignored or cause warning (safe in newer React).
        // However, since we navigate away, we rely on unmounting.
        // If we want to be safe against race conditions if navigation is delayed:
        // setIsSubmitting(false); 
    }
  };

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{t('forgot_password_title')}</h2>
        <p className="text-[var(--text-secondary)]">{t('forgot_password_subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-sm mx-auto">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)]">{t('form_email_label')}</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={isSubmitting}
            className="mt-1 block w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--ring-accent)] focus:border-[var(--border-accent)] sm:text-sm text-[var(--text-primary)] disabled:opacity-50"
          />
        </div>
        <div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--ring-accent)] disabled:opacity-50 disabled:cursor-wait transition-colors"
          >
            {isSubmitting ? t('button_processing') : t('forgot_password_button')}
          </button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-[var(--border-color)] flex justify-start">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-6 rounded-full disabled:opacity-50"
        >
          {t('button_back')}
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;
