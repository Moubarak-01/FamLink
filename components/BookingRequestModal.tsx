import React, { useState } from 'react';
import { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface BookingRequestModalProps {
  nanny: User;
  onClose: () => void;
  onSubmit: (nannyId: string, date: string, startTime: string, endTime: string, message: string) => void;
}

const BookingRequestModal: React.FC<BookingRequestModalProps> = ({ nanny, onClose, onSubmit }) => {
  const { t } = useLanguage();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [message, setMessage] = useState('');
  
  const inputStyles = "mt-1 block w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--ring-accent)] focus:border-[var(--border-accent)] sm:text-sm text-[var(--text-primary)]";
  const labelStyles = "block text-sm font-medium text-[var(--text-secondary)]";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !startTime || !endTime) {
        alert(t('alert_fill_required_fields'));
        return;
    }
    onSubmit(nanny.id, date, startTime, endTime, message);
  };

  return (
    <div className="fixed inset-0 bg-[var(--modal-overlay)] flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="p-8 text-center">
            {/* FIX: The 'photo' property is on the 'nanny' (User) object, not 'nanny.profile'. */}
            <img src={nanny.photo} alt={nanny.fullName} className="w-24 h-24 rounded-full object-cover mx-auto -mt-20 border-4 border-[var(--bg-card)] shadow-lg" />
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-4">{t('booking_modal_title', { name: nanny.fullName.split(' ')[0] })}</h2>
            <p className="text-[var(--text-light)] text-sm mb-6">{t('booking_modal_subtitle')}</p>
            
            <div className="space-y-4 text-left">
                <div>
                    <label htmlFor="date" className={labelStyles}>{t('booking_label_date')}</label>
                    <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required min={new Date().toISOString().split('T')[0]} className={inputStyles} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="startTime" className={labelStyles}>{t('booking_label_start_time')}</label>
                        <input type="time" id="startTime" value={startTime} onChange={e => setStartTime(e.target.value)} required className={inputStyles} />
                    </div>
                    <div>
                        <label htmlFor="endTime" className={labelStyles}>{t('booking_label_end_time')}</label>
                        <input type="time" id="endTime" value={endTime} onChange={e => setEndTime(e.target.value)} required className={inputStyles} />
                    </div>
                </div>
                 <div>
                    <label htmlFor="message" className={labelStyles}>{t('booking_label_message')}</label>
                    <textarea 
                        id="message"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        rows={3}
                        placeholder={t('booking_placeholder_message')}
                        className={inputStyles}
                    />
                </div>
            </div>
            
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button type="button" onClick={onClose} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg">{t('button_back')}</button>
                <button type="submit" className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-bold py-3 px-6 rounded-lg shadow-md">{t('button_send_request')}</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default BookingRequestModal;