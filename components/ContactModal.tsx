import React from 'react';
import { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ContactModalProps {
  nanny: User;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ nanny, onClose }) => {
  const { t } = useLanguage();

  if (!nanny.profile) return null;

  return (
    <div className="fixed inset-0 bg-[var(--modal-overlay)] flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
            {/* FIX: The 'photo' property is on the 'nanny' (User) object, not 'nanny.profile'. */}
            <img src={nanny.photo} alt={nanny.fullName} className="w-24 h-24 rounded-full object-cover mx-auto -mt-16 border-4 border-[var(--bg-card)] shadow-lg" />
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-4">{t('contact_modal_title', { name: nanny.fullName.split(' ')[0] })}</h2>
            <p className="text-[var(--text-light)] text-sm mb-6">{t('subscription_subtitle')}</p>
            
            <div className="space-y-4 text-left">
                <div className="flex items-center justify-between bg-[var(--bg-card-subtle)] p-3 rounded-lg">
                    <div>
                        <p className="text-xs font-semibold text-[var(--text-light)]">{t('contact_modal_email')}</p>
                        <p className="text-[var(--text-primary)] font-medium">{nanny.email}</p>
                    </div>
                    <a href={`mailto:${nanny.email}`} className="text-[var(--text-accent)] hover:text-[var(--accent-primary)] p-2 rounded-full bg-[var(--bg-accent-light)]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </a>
                </div>
                 <div className="flex items-center justify-between bg-[var(--bg-card-subtle)] p-3 rounded-lg">
                    <div>
                        <p className="text-xs font-semibold text-[var(--text-light)]">{t('contact_modal_phone')}</p>
                        <p className="text-[var(--text-primary)] font-medium">{nanny.profile.phone}</p>
                    </div>
                     <a href={`tel:${nanny.profile.phone}`} className="text-[var(--text-accent)] hover:text-[var(--accent-primary)] p-2 rounded-full bg-[var(--bg-accent-light)]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </a>
                </div>
            </div>
            
            <div className="mt-6">
                <button onClick={onClose} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-6 rounded-full">{t('button_close')}</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;