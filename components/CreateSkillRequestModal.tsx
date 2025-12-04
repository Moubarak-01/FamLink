import React, { useState } from 'react';
import { SkillRequest, SkillCategory } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import LocationAutocomplete from './LocationAutocomplete';

interface CreateSkillRequestModalProps {
  onClose: () => void;
  onSubmit: (requestData: Omit<SkillRequest, 'id' | 'requesterId' | 'requesterName' | 'requesterPhoto' | 'status' | 'offers'>) => void;
}

const CreateSkillRequestModal: React.FC<CreateSkillRequestModalProps> = ({ onClose, onSubmit }) => {
    const { t } = useLanguage();
    const [category, setCategory] = useState<SkillCategory>('other');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [budget, setBudget] = useState<number | ''>('');
    
    const inputStyles = "mt-1 block w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--ring-accent)] focus:border-[var(--border-accent)] sm:text-sm text-[var(--text-primary)]";
    const labelStyles = "block text-sm font-medium text-[var(--text-secondary)]";

    const categories: { key: SkillCategory, label: string }[] = [
        { key: 'cooking', label: t('skill_cat_cooking') },
        { key: 'cleaning', label: t('skill_cat_cleaning') },
        { key: 'tutoring', label: t('skill_cat_tutoring') },
        { key: 'tech', label: t('skill_cat_tech') },
        { key: 'crafts', label: t('skill_cat_crafts') },
        { key: 'other', label: t('skill_cat_other') },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim() || !location.trim() || budget === '' || budget <= 0) {
            alert('Please fill in all fields with valid values.');
            return;
        }
        onSubmit({ category, title, description, location, budget: Number(budget) });
    };

    return (
        <div className="fixed inset-0 bg-[var(--modal-overlay)] flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-8">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] text-center mb-6">{t('create_skill_request_title')}</h2>
                    
                    <div className="space-y-4">
                         <div>
                            <label htmlFor="category" className={labelStyles}>{t('skill_request_label_category')}</label>
                            <select id="category" value={category} onChange={e => setCategory(e.target.value as SkillCategory)} className={inputStyles}>
                                {categories.map(cat => <option key={cat.key} value={cat.key}>{cat.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="title" className={labelStyles}>{t('skill_request_label_title')}</label>
                            <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required placeholder={t('skill_request_placeholder_title')} className={inputStyles} />
                        </div>
                        <div>
                            <label htmlFor="description" className={labelStyles}>{t('skill_request_label_description')}</label>
                            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} required className={inputStyles} />
                        </div>
                        <div>
                            <label htmlFor="location" className={labelStyles}>{t('skill_request_label_location')}</label>
                            <LocationAutocomplete
                                value={location}
                                onChange={setLocation}
                                className={inputStyles}
                                placeholder="City or Neighborhood"
                            />
                        </div>
                        <div>
                            <label htmlFor="budget" className={labelStyles}>{t('skill_request_label_budget')}</label>
                            <input type="number" id="budget" value={budget} onChange={e => setBudget(e.target.value === '' ? '' : parseInt(e.target.value, 10))} required min="1" className={inputStyles} />
                        </div>
                    </div>
                    
                    <div className="mt-6 flex flex-col sm:flex-row gap-4">
                        <button type="button" onClick={onClose} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg">{t('button_back')}</button>
                        <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-md">{t('button_post_request')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateSkillRequestModal;