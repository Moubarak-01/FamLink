import React, { useState } from 'react';
import { SkillRequest } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface MakeSkillOfferModalProps {
    request: SkillRequest;
    onClose: () => void;
    onSubmit: (request: SkillRequest, offerAmount: number, message: string) => void;
}

const MakeSkillOfferModal: React.FC<MakeSkillOfferModalProps> = ({ request, onClose, onSubmit }) => {
    const { t } = useLanguage();
    const [offerAmount, setOfferAmount] = useState<number | ''>(request.budget);
    const [message, setMessage] = useState('');

    const inputStyles = "mt-1 block w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--ring-accent)] focus:border-[var(--border-accent)] sm:text-sm text-[var(--text-primary)]";
    const labelStyles = "block text-sm font-medium text-[var(--text-secondary)]";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (offerAmount === '' || offerAmount <= 0) {
            alert('Please enter a valid offer amount.');
            return;
        }
        onSubmit(request, Number(offerAmount), message);
    };

    return (
        <div className="fixed inset-0 bg-[var(--modal-overlay)] flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-8">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t('make_offer_title', { taskTitle: request.title })}</h2>
                        <p className="text-[var(--text-secondary)] text-sm mt-2">{t('make_offer_subtitle', { name: (request.requesterName || 'User').split(' ')[0] })}</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="offerAmount" className={labelStyles}>{t('offer_label_amount')}</label>
                            <input type="number" id="offerAmount" value={offerAmount} onChange={e => setOfferAmount(e.target.value === '' ? '' : parseInt(e.target.value, 10))} required min="1" className={inputStyles} />
                        </div>
                        <div>
                            <label htmlFor="message" className={labelStyles}>{t('offer_label_message')}</label>
                            <textarea id="message" value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder={t('offer_placeholder_message')} className={inputStyles} />
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-4">
                        <button type="button" onClick={onClose} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg">{t('button_back')}</button>
                        <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-md">{t('button_send_offer')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MakeSkillOfferModal;