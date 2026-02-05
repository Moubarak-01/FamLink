import React, { useState } from 'react';
import PaymentCard from './PaymentCard';

const PaymentForm: React.FC = () => {
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
                    <label className="block text-sm font-medium text-gray-700">Card Number</label>
                    <input
                        type="text"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-mono"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                    />
                </div>

                {/* Card Holder */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Card Holder</label>
                    <input
                        type="text"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all uppercase"
                        placeholder="JOHN DOE"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                    />
                </div>

                <div className="flex space-x-4">
                    {/* Expiry Date */}
                    <div className="space-y-2 flex-1">
                        <label className="block text-sm font-medium text-gray-700">Expires</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            placeholder="MM/YY"
                            value={expiry}
                            onChange={handleExpiryChange}
                        />
                    </div>

                    {/* CVV */}
                    <div className="space-y-2 flex-1">
                        <label className="block text-sm font-medium text-gray-700">CVV</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            placeholder="123"
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
