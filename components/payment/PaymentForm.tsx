import React, { useState } from 'react';
import PaymentCard from './PaymentCard';
import { useLanguage } from '../../contexts/LanguageContext';

const PaymentForm: React.FC = () => {
    const { t } = useLanguage();
    const [cardNumber, setCardNumber] = useState('');
    const [cardHolder, setCardHolder] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [isFlipped, setIsFlipped] = useState(false);

    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Remove non-digits
        const value = e.target.value.replace(/\D/g, '');
        // Limit to 16 digits
        if (value.length <= 16) {
            setCardNumber(value);
        }
    };

    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 3) {
            // Insert slash
            value = value.substring(0, 2) + '/' + value.substring(2);
        }
        if (value.length <= 5) {
            setExpiry(value);
        }
    };

    const handleCvvFocus = () => {
        setIsFlipped(true);
    };

    const handleCvvBlur = () => {
        setIsFlipped(false);
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 min-h-screen">
            <div className="mb-10">
                <PaymentCard
                    cardNumber={cardNumber}
                    cardHolder={cardHolder}
                    expiry={expiry}
                    cvv={cvv}
                    isFlipped={isFlipped}
                />
            </div>

            <form className="w-full max-w-md bg-white p-6 rounded-2xl shadow-xl space-y-6 border border-gray-100">
                {/* Card Number */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">{t('payment_card_number_label')}</label>
                    <input
                        type="text"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-mono"
                        placeholder={t('placeholder_card_number')}
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                    />
                </div>

                {/* Card Holder */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">{t('payment_card_holder_label')}</label>
                    <input
                        type="text"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all uppercase"
                        placeholder={t('placeholder_name_example')}
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                    />
                </div>

                <div className="flex space-x-4">
                    {/* Expiry Date */}
                    <div className="space-y-2 flex-1">
                        <label className="block text-sm font-medium text-gray-700">{t('payment_expires_label')}</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            placeholder={t('placeholder_expiry')}
                            value={expiry}
                            onChange={handleExpiryChange}
                        />
                    </div>

                    {/* CVV */}
                    <div className="space-y-2 flex-1">
                        <label className="block text-sm font-medium text-gray-700">{t('payment_cvv_label')}</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            placeholder={t('placeholder_cvv')}
                            maxLength={4}
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value)}
                            onFocus={handleCvvFocus}
                            onBlur={handleCvvBlur}
                        />
                    </div>
                </div>
            </form>
        </div>
    );
};

export default PaymentForm;
