import React, { useState } from 'react';
import { SkillRequest, SkillCategory } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import LocationInput from './LocationInput';
import PrivacyToggle from './PrivacyToggle';

interface CreateSkillRequestModalProps {
    onClose: () => void;
    onSubmit: (requestData: any) => void;
}

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

const CreateSkillRequestModal: React.FC<CreateSkillRequestModalProps> = ({ onClose, onSubmit }) => {
    const { t } = useLanguage();
    const [category, setCategory] = useState<SkillCategory>('other');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [budget, setBudget] = useState<number | ''>(10);
    const [image, setImage] = useState<string>('');
    const [imagePreview, setImagePreview] = useState<string>('');
    const [privacy, setPrivacy] = useState<'public' | 'private'>('public');

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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImagePreview(URL.createObjectURL(file));
            const base64 = await toBase64(file);
            setImage(base64);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim() || !location.trim() || budget === '' || budget <= 0) {
            alert('Please fill in all fields with valid values.');
            return;
        }
        onSubmit({ category, title, description, location, budget: Number(budget), image, privacy });
    };

    return (
        <div className="fixed inset-0 bg-[var(--modal-overlay)] flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-8">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] text-center mb-6">{t('create_skill_request_title')}</h2>

                    <div className="space-y-4">
                        {/* Image Upload Section */}
                        <div>
                            <label className={labelStyles}>{t('label_image_optional')}</label>
                            <div className="mt-2 flex items-center gap-4">
                                <span className="inline-block h-16 w-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-300">
                                    {imagePreview ? <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-gray-400">📷</div>}
                                </span>
                                <label htmlFor="task-image" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
                                    {t('button_upload')}
                                    <input id="task-image" type="file" onChange={handleImageUpload} accept="image/*" className="hidden" />
                                </label>
                                {image && <button type="button" onClick={() => { setImage(''); setImagePreview('') }} className="text-sm text-red-500 hover:underline">{t('button_remove')}</button>}
                            </div>
                        </div>

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
                            <LocationInput
                                value={location}
                                onChange={setLocation}
                                className={inputStyles}
                                placeholder={t('placeholder_search_city')}
                            />
                        </div>
                        <div>
                            <label htmlFor="budget" className={labelStyles}>{t('skill_request_label_budget')}</label>
                            <input type="number" id="budget" value={budget} onChange={e => setBudget(e.target.value === '' ? '' : parseInt(e.target.value, 10))} required min="1" className={inputStyles} />
                        </div>

                        {/* Privacy Toggle */}
                        <div className="mt-4 bg-[var(--bg-card-subtle)] p-4 rounded-lg border border-[var(--border-color)]">
                            <label className={`${labelStyles} mb-2`}>{t('label_privacy_setting')}</label>
                            <PrivacyToggle value={privacy} onChange={setPrivacy} />
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