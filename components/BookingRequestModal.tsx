import React, { useState } from 'react';
import { User, BookingRequest } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import Calendar from './Calendar';

interface BookingRequestModalProps {
  nanny: User;
  onClose: () => void;
  onSubmit: (nannyId: string, date: string, startTime: string, endTime: string, message: string) => void;
  existingBookings?: BookingRequest[];
  currentUserId?: string;
}

const BookingRequestModal: React.FC<BookingRequestModalProps> = ({ nanny, onClose, onSubmit, existingBookings = [], currentUserId }) => {
  const { t } = useLanguage();
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [message, setMessage] = useState('');
  
  const inputStyles = "mt-1 block w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--ring-accent)] focus:border-[var(--border-accent)] sm:text-sm text-[var(--text-primary)]";
  const labelStyles = "block text-sm font-medium text-[var(--text-secondary)]";

  // 1. Get nanny's raw available dates
  const baseAvailableDates = (nanny && nanny.profile && Array.isArray(nanny.profile.availableDates)) 
      ? nanny.profile.availableDates 
      : [];

  // 2. FILTER LOGIC: Remove dates that shouldn't be bookable
  const finalAvailableDates = baseAvailableDates.filter(dateStr => {
      // Unavailable if ANYONE has an ACCEPTED booking for this date
      const isBooked = existingBookings.some(b => b.nannyId === nanny.id && b.date === dateStr && b.status === 'accepted');
      
      // Unavailable if YOU (current user) already have a PENDING request (wait for answer)
      const isPendingForMe = existingBookings.some(b => b.nannyId === nanny.id && b.date === dateStr && b.parentId === currentUserId && b.status === 'pending');

      // If either is true, remove this date from the list
      return !isBooked && !isPendingForMe;
  });

  // Helper to display date nicely
  const formatDateForDisplay = (dateString: string) => {
      if (!dateString) return '';
      const [y, m, d] = dateString.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !startTime || !endTime) {
        alert(t('alert_fill_required_fields'));
        return;
    }
    
    // Extra safety: prevent submission if date isn't in our filtered list
    if (!finalAvailableDates.includes(date)) {
        alert("This date is unavailable. You may already have a pending request or it is booked.");
        return;
    }

    onSubmit(nanny.id, date, startTime, endTime, message);
  };

  if (!nanny) return null;

  return (
    <div className="fixed inset-0 bg-[var(--modal-overlay)] flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="p-8 text-center">
            <img src={nanny.photo} alt={nanny.fullName} className="w-24 h-24 rounded-full object-cover mx-auto -mt-20 border-4 border-[var(--bg-card)] shadow-lg" />
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-4">{t('booking_modal_title', { name: nanny.fullName.split(' ')[0] })}</h2>
            <p className="text-[var(--text-light)] text-sm mb-6">{t('booking_modal_subtitle')}</p>
            
            <div className="space-y-4 text-left">
                <div>
                    <label className={labelStyles}>{t('booking_label_date')}<span className="text-red-500">*</span></label>
                    <div className="mt-2 border border-[var(--border-input)] rounded-lg p-2 bg-[var(--bg-card-subtle)]">
                        <Calendar 
                            availableDates={finalAvailableDates} 
                            onDateChange={setDate} 
                            isEditable={true} 
                            restrictToAvailable={true} 
                        />
                    </div>
                    {date ? (
                        <p className="text-sm text-green-600 mt-2 font-medium text-center flex justify-center items-center">
                            <span className="mr-1">✅</span> Selected: {formatDateForDisplay(date)}
                        </p>
                    ) : (
                        <p className="text-xs text-[var(--text-light)] mt-2 text-center italic">Please select a highlighted date.</p>
                    )}
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
                <button type="submit" disabled={!date} className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-bold py-3 px-6 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed">{t('button_send_request')}</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default BookingRequestModal;