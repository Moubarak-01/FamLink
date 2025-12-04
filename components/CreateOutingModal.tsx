import React, { useState } from 'react';
import { SharedOuting } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import LocationInput from './LocationInput'; // Replaced LocationAutocomplete

interface CreateOutingModalProps {
  onClose: () => void;
  onSubmit: (outingData: Omit<SharedOuting, 'id' | 'hostId' | 'hostName' | 'hostPhoto' | 'requests'>) => void;
}

const CreateOutingModal: React.FC<CreateOutingModalProps> = ({ onClose, onSubmit }) => {
    const { t } = useLanguage();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('10:00');
    const [maxChildren, setMaxChildren] = useState(1);
    const [costDetails, setCostDetails] = useState('');
    const [liveLocationEnabled, setLiveLocationEnabled] = useState(false);
    
    const inputStyles = "mt-1 block w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--ring-accent)] focus:border-[var(--border-accent)] sm:text-sm text-[var(--text-primary)]";
    const labelStyles = "block text-sm font-medium text-[var(--text-secondary)]";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim() || !location.trim() || !costDetails.trim()) {
            alert('Please fill in all fields.');
            return;
        }
        onSubmit({ title, description, location, date, time, maxChildren, costDetails, liveLocationEnabled });
    };

    return (
        <div className="fixed inset-0 bg-[var(--modal-overlay)] flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-8">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] text-center mb-6">{t('create_outing_modal_title')}</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="title" className={labelStyles}>{t('outing_label_title')}</label>
                            <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required placeholder={t('outing_placeholder_title')} className={inputStyles} />
                        </div>
                        <div>
                            <label htmlFor="description" className={labelStyles}>{t('outing_label_description')}</label>
                            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} required className={inputStyles} />
                        </div>
                        <div>
                            <label htmlFor="location" className={labelStyles}>{t('outing_label_location')}</label>
                             {/* UPDATED USAGE: Use LocationInput in autocomplete mode */}
                             <LocationInput
                                value={location}
                                onChange={setLocation}
                                className={inputStyles}
                                placeholder="Where are you going?"
                            />
                        </div>
                        
                        <div className="flex items-center mt-2">
                            <input 
                                type="checkbox" 
                                id="liveLocation" 
                                checked={liveLocationEnabled} 
                                onChange={e => setLiveLocationEnabled(e.target.checked)}
                                className="h-4 w-4 text-[var(--accent-primary)] focus:ring-[var(--ring-accent)] border-gray-300 rounded cursor-pointer"
                            />
                            <label htmlFor="liveLocation" className="ml-2 block text-sm text-[var(--text-primary)] cursor-pointer">
                                Enable Live Location Sharing for participants
                            </label>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="date" className={labelStyles}>{t('outing_label_date')}</label>
                                <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required min={new Date().toISOString().split('T')[0]} className={inputStyles} />
                            </div>
                            <div>
                                <label htmlFor="time" className={labelStyles}>{t('outing_label_time')}</label>
                                <input type="time" id="time" value={time} onChange={e => setTime(e.target.value)} required className={inputStyles} />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="maxChildren" className={labelStyles}>{t('outing_label_max_children')}</label>
                            <input type="number" id="maxChildren" value={maxChildren} onChange={e => setMaxChildren(parseInt(e.target.value, 10))} required min="1" className={inputStyles} />
                        </div>
                        <div>
                            <label htmlFor="cost" className={labelStyles}>{t('outing_label_cost')}</label>
                            <input type="text" id="cost" value={costDetails} onChange={e => setCostDetails(e.target.value)} required placeholder={t('outing_placeholder_cost')} className={inputStyles} />
                        </div>
                    </div>
                    
                    <div className="mt-6 flex flex-col sm:flex-row gap-4">
                        <button type="button" onClick={onClose} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg">{t('button_back')}</button>
                        <button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg shadow-md">{t('button_post_outing')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateOutingModal;