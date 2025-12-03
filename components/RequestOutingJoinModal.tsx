
import React, { useState } from 'react';
import { SharedOuting } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface RequestOutingJoinModalProps {
  outing: SharedOuting;
  onClose: () => void;
  onSubmit: (outing: SharedOuting, childName: string, childAge: number, emergencyContactName: string, emergencyContactPhone: string) => void;
  existingRequests: {childName: string, parentId: string}[];
  currentUserId: string;
}

const RequestOutingJoinModal: React.FC<RequestOutingJoinModalProps> = ({ outing, onClose, onSubmit, existingRequests, currentUserId }) => {
  const { t } = useLanguage();
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState<number | ''>('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const inputStyles = "mt-1 block w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--ring-accent)] focus:border-[var(--border-accent)] sm:text-sm text-[var(--text-primary)]";
  const labelStyles = "block text-sm font-medium text-[var(--text-secondary)]";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!childName.trim() || childAge === '' || Number(childAge) <= 0 || !emergencyName.trim() || !emergencyPhone.trim()) {
      setError('Please fill in all fields with valid information.');
      return;
    }

    // Check for duplicate child name for this user in this outing
    const isDuplicate = existingRequests.some(req => 
        req.parentId === currentUserId && req.childName.toLowerCase() === childName.trim().toLowerCase()
    );

    if (isDuplicate) {
        setError('You have already sent a request for this child.');
        return;
    }

    onSubmit(outing, childName, Number(childAge), emergencyName, emergencyPhone);
  };

  return (
    <div className="fixed inset-0 bg-[var(--modal-overlay)] flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t('request_outing_modal_title')}</h2>
            <p className="text-[var(--text-light)] text-sm mt-2">{t('request_outing_modal_subtitle', { name: outing.hostName.split(' ')[0] })}</p>
          </div>
          
          {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

          <div className="space-y-4">
            <div>
              <label htmlFor="childName" className={labelStyles}>{t('request_outing_label_child_name')}</label>
              <input
                type="text"
                id="childName"
                value={childName}
                onChange={e => setChildName(e.target.value)}
                required
                className={inputStyles}
              />
            </div>
            <div>
              <label htmlFor="childAge" className={labelStyles}>{t('request_outing_label_child_age')}</label>
              <input
                type="number"
                id="childAge"
                value={childAge}
                onChange={e => setChildAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                required
                min="0"
                className={inputStyles}
              />
            </div>
            <hr className="border-[var(--border-color)] my-2" />
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">Emergency Contact</h4>
            <div>
                <label htmlFor="emerName" className={labelStyles}>Name</label>
                <input 
                    type="text" 
                    id="emerName" 
                    value={emergencyName} 
                    onChange={e => setEmergencyName(e.target.value)} 
                    required 
                    className={inputStyles}
                />
            </div>
            <div>
                <label htmlFor="emerPhone" className={labelStyles}>Phone</label>
                <input 
                    type="tel" 
                    id="emerPhone" 
                    value={emergencyPhone} 
                    onChange={e => setEmergencyPhone(e.target.value)} 
                    required 
                    className={inputStyles}
                />
            </div>
          </div>
          
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <button type="button" onClick={onClose} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg">{t('button_back')}</button>
            <button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg shadow-md">{t('button_send_join_request')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestOutingJoinModal;
