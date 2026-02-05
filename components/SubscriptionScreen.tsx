import React, { useState } from 'react';
import { Plan } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface SubscriptionScreenProps {
  onSubscribe: (plan: Plan) => void;
  onBack: () => void;
}


import PaymentCard, { CardTheme } from './payment/PaymentCard';

// ... (previous imports)

const PaymentForm: React.FC<{ plan: { id: Plan, name: string, price: number }, onPay: (planId: Plan) => void, onBack: () => void }> = ({ plan, onPay, onBack }) => {
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [theme, setTheme] = useState<CardTheme>('midnight');
  const [errors, setErrors] = useState({ cardName: '', cardNumber: '', expiryDate: '', cvv: '' });

  const inputStyles = "mt-1 block w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--ring-accent)] focus:border-[var(--border-accent)] sm:text-sm text-[var(--text-primary)] transition-all duration-200";
  const labelStyles = "block text-sm font-medium text-[var(--text-secondary)]";

  const themes: { id: CardTheme, color: string }[] = [
    { id: 'midnight', color: '#1e293b' },
    { id: 'ocean', color: '#0ea5e9' },
    { id: 'sunset', color: '#f43f5e' },
    { id: 'gold', color: '#ffd700' },
    { id: 'royal', color: '#5b21b6' },
  ];

  const validateAndSet = (field: 'cardName' | 'cardNumber' | 'expiryDate' | 'cvv', value: string, regex: RegExp, errorMessage: string) => {
    if (regex.test(value) || value === '') {
      if (field === 'cardName') setCardName(value);
      if (field === 'cardNumber') setCardNumber(value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19));
      if (field === 'expiryDate') setExpiryDate(value.replace(/[^0-9]/g, '').replace(/(\d{2})/, '$1 / ').trim().slice(0, 7)); // MM / YY format

      // Strict CVV: Only 3 digits max
      if (field === 'cvv') {
        const cleanCvv = value.replace(/[^0-9]/g, '').slice(0, 3);
        setCvv(cleanCvv);
      }

      setErrors(prev => ({ ...prev, [field]: '' }));
    } else {
      setErrors(prev => ({ ...prev, [field]: errorMessage }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || !cardNumber || !expiryDate || !cvv) {
      alert(t('alert_fill_all_fields'));
      return;
    }
    if (Object.values(errors).some(error => error !== '')) {
      alert(t('alert_fix_errors'));
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      onPay(plan.id);
      setIsProcessing(false);
    }, 1000); // Simulate payment processing
  };

  return (
    <div className='max-w-md mx-auto'>
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-[var(--text-primary)]">{t('payment_title')}</h3>
        <p className="text-[var(--text-secondary)]">{t('payment_subscribing_to', { planName: plan.name, price: plan.price })}</p>
      </div>

      {/* 3D Payment Card Visualization */}
      {/* 3D Payment Card Visualization */}
      <div className="mb-8 flex flex-col items-center">
        <div className="transform scale-90 sm:scale-100 transition-transform origin-center mb-6">
          <PaymentCard
            cardNumber={cardNumber}
            cardHolder={cardName}
            expiry={expiryDate}
            cvv={cvv}
            isFlipped={isFlipped}
            theme={theme}
          />
        </div>

        {/* Theme Selector */}
        <div className="flex gap-3 bg-[var(--bg-card)] p-2 rounded-full border border-[var(--border-color)] shadow-sm">
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${theme === t.id ? 'border-[var(--text-primary)] scale-110' : 'border-transparent'}`}
              style={{ background: t.color }}
              title={t.id}
            />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="cardName" className={labelStyles}>{t('payment_cardholder_name')}</label>
          <input
            type="text"
            id="cardName"
            value={cardName}
            onChange={e => validateAndSet('cardName', e.target.value.toUpperCase(), /^[a-zA-Z\s]*$/, t('error_letters_only'))}
            required
            className={inputStyles}
            placeholder="JOHN DOE"
          />
          {errors.cardName && <p className="text-red-500 text-xs mt-1">{errors.cardName}</p>}
        </div>
        <div>
          <label htmlFor="cardNumber" className={labelStyles}>{t('payment_card_number')}</label>
          <input
            type="text"
            id="cardNumber"
            value={cardNumber}
            onChange={e => validateAndSet('cardNumber', e.target.value, /^[0-9\s]*$/, t('error_numbers_only'))}
            placeholder="0000 0000 0000 0000"
            required
            className={`${inputStyles} font-mono`}
          />
          {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="expiryDate" className={labelStyles}>{t('payment_expiry_date')}</label>
            <input
              type="text"
              id="expiryDate"
              value={expiryDate}
              onChange={e => validateAndSet('expiryDate', e.target.value, /^[0-9/\s]*$/, t('error_numbers_only'))}
              placeholder="MM / YY"
              required
              className={inputStyles}
            />
            {errors.expiryDate && <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>}
          </div>
          <div className="flex-1">
            <label htmlFor="cvv" className={labelStyles}>{t('payment_cvv')}</label>
            <input
              type="text"
              id="cvv"
              value={cvv}
              onChange={e => validateAndSet('cvv', e.target.value, /^[0-9]*$/, t('error_numbers_only'))}
              placeholder="123"
              required
              className={inputStyles}
              onFocus={() => setIsFlipped(true)}
              onBlur={() => setIsFlipped(false)}
            />
            {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
          </div>
        </div>
        <button
          type="submit"
          disabled={isProcessing}
          className="mt-6 w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-pink-500/20 transform hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-75 disabled:cursor-wait"
        >
          {isProcessing ? (
            <span className='flex items-center justify-center gap-2'>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('button_processing')}
            </span>
          ) : t('button_pay_now', { price: plan.price })}
        </button>
      </form>
      <div className="mt-8 pt-6 border-t border-[var(--border-color)] flex justify-start">
        <button onClick={onBack} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-full transition-colors">
          {t('button_back')}
        </button>
      </div>
    </div>
  );
};


const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ onSubscribe, onBack }) => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const { t } = useLanguage();

  const plan = {
    id: 'parent_monthly' as Plan,
    name: t('plan_parent_name'),
    price: 5,
    period: t('plan_month')
  };

  if (showPaymentForm) {
    return (
      <div className="p-8">
        <PaymentForm plan={plan} onPay={onSubscribe} onBack={() => setShowPaymentForm(false)} />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{t('subscription_title')}</h2>
        <p className="text-[var(--text-secondary)]">{t('subscription_subtitle')}</p>
      </div>

      <div className="max-w-sm mx-auto">
        <div className="rounded-xl border p-6 flex flex-col transition-all duration-300 border-[var(--border-accent)] ring-2 ring-[var(--ring-accent)]">
          <h3 className="text-xl font-semibold text-[var(--text-primary)]">{plan.name}</h3>
          <div className="my-4">
            <span className="text-4xl font-extrabold text-[var(--text-primary)]">€{plan.price}</span>
            <span className="text-[var(--text-light)]">{t('price_per_period', { period: plan.period })}</span>
          </div>
          <button
            onClick={() => setShowPaymentForm(true)}
            className="mt-6 w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-bold py-3 px-6 rounded-lg shadow-md transform hover:scale-105 transition-transform"
          >
            {t('button_subscribe_now')}
          </button>
        </div>
      </div>

      <p className="text-center text-sm text-[var(--text-light)] mt-8">
        {t('subscription_footer')}
      </p>

      <div className="mt-8 pt-6 border-t border-[var(--border-color)] flex justify-start">
        <button onClick={onBack} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-6 rounded-full">
          {t('button_back')}
        </button>
      </div>
    </div>
  );
};

export default SubscriptionScreen;