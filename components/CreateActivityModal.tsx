
import React, { useState } from 'react';
import { Activity, ActivityCategory } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface CreateActivityModalProps {
  onClose: () => void;
  onSubmit: (activityData: Omit<Activity, 'id' | 'hostId' | 'hostName' | 'hostPhoto' | 'participants' | 'messages'>) => void;
}

const CreateActivityModal: React.FC<CreateActivityModalProps> = ({ onClose, onSubmit }) => {
    const { t } = useLanguage();
    const [category, setCategory] = useState<ActivityCategory>('playdates');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('10:00');
    
    const inputStyles = "mt-1 block w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--ring-accent)] focus:border-[var(--border-accent)] sm:text-sm text-[var(--text-primary)]";
    const labelStyles = "block text-sm font-medium text-[var(--text-secondary)]";

    const categories: { key: ActivityCategory, label: string }[] = [
        { key: 'playdates', label: t('activity_cat_playdates') },
        { key: 'walks', label: t('activity_cat_walks') },
        { key: 'workout', label: t('activity_cat_workout') },
        { key: 'shopping', label: t('activity_cat_shopping') },
        { key: 'studying', label: t('activity_cat_studying') },
        { key: 'dads', label: t('activity_cat_dads') },
        { key: 'other', label: t('activity_cat_other') },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim() || !location.trim()) {
            alert('Please fill in all fields.');
            return;
        }
        onSubmit({ category, description, location, date, time });
    };

    return (
        <div className="fixed inset-0 bg-[var(--modal-overlay)] flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-8">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] text-center mb-6">{t('create_activity_modal_title')}</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="category" className={labelStyles}>{t('activity_label_category')}</label>
                            <select
                                id="category"
                                value={category}
                                onChange={e => setCategory(e.target.value as ActivityCategory)}
                                className={inputStyles}
                            >
                                {categories.map(cat => <option key={cat.key} value={cat.key}>{cat.label}</option>)}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="description" className={labelStyles}>{t('activity_label_description')}</label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={3}
                                required
                                className={inputStyles}
                            />
                        </div>

                         <div>
                            <label htmlFor="location" className={labelStyles}>{t('activity_label_location')}</label>
                            <input
                                type="text"
                                id="location"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                required
                                className={inputStyles}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="date" className={labelStyles}>{t('activity_label_date')}</label>
                                <input
                                    type="date"
                                    id="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    className={inputStyles}
                                />
                            </div>
                            <div>
                                <label htmlFor="time" className={labelStyles}>{t('activity_label_time')}</label>
                                <input
                                    type="time"
                                    id="time"
                                    value={time}
                                    onChange={e => setTime(e.target.value)}
                                    required
                                    className={inputStyles}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6 flex flex-col sm:flex-row gap-4">
                        <button type="button" onClick={onClose} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg">{t('button_back')}</button>
                        <button type="submit" className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg shadow-md">{t('button_post_activity')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateActivityModal;
