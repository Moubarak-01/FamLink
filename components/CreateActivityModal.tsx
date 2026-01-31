import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, ActivityCategory } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import LocationInput from './LocationInput';

interface CreateActivityModalProps {
    onClose: () => void;
    onSubmit: (activityData: any) => void;
}

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

const CreateActivityModal: React.FC<CreateActivityModalProps> = ({ onClose, onSubmit }) => {
    const { t } = useLanguage();
    const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
    const [category, setCategory] = useState<ActivityCategory>('playdates');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState(() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    const [time, setTime] = useState('10:00');
    const [image, setImage] = useState<string>('');
    const [imagePreview, setImagePreview] = useState<string>('');
    const [customCategory, setCustomCategory] = useState('');

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
        if (!description.trim() || !location.trim()) {
            alert('Please fill in all fields.');
            return;
        }
        let finalCategory = category;
        if (category === 'other') {
            if (!customCategory.trim()) {
                alert('Please specify the category.');
                return;
            }
            finalCategory = customCategory;
        }
        onSubmit({ category: finalCategory, description, location, date, time, image, privacy });
    };

    return (
        <div className="fixed inset-0 bg-[var(--modal-overlay)] flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-8">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] text-center mb-6">{t('create_activity_modal_title')}</h2>

                    <div className="space-y-4">
                        {/* Image Upload Section */}
                        <div>
                            <label className={labelStyles}>Activity Image (Optional)</label>
                            <div className="mt-2 flex items-center gap-4">
                                <span className="inline-block h-16 w-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-300">
                                    {imagePreview ? <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-gray-400">📷</div>}
                                </span>
                                <label htmlFor="activity-image" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
                                    Upload
                                    <input id="activity-image" type="file" onChange={handleImageUpload} accept="image/*" className="hidden" />
                                </label>
                                {image && <button type="button" onClick={() => { setImage(''); setImagePreview('') }} className="text-sm text-red-500 hover:underline">Remove</button>}
                            </div>
                        </div>

                        {/* Privacy Setting Toggle */}
                        <div className="bg-[var(--bg-card-subtle)] p-4 rounded-lg border border-[var(--border-color)]">
                            <div className="flex justify-between items-center mb-2">
                                <label className={labelStyles}>Privacy Setting</label>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${privacy === 'public' ? 'bg-green-100 text-green-700' : 'bg-pink-100 text-pink-700'}`}>
                                    {privacy === 'public' ? 'Public' : 'Private'}
                                </span>
                            </div>

                            <div className="flex items-center gap-4 cursor-pointer relative" onClick={() => setPrivacy(privacy === 'public' ? 'private' : 'public')}>
                                <motion.div
                                    className="w-16 h-8 bg-gray-300 rounded-full p-1 flex items-center"
                                    animate={{ backgroundColor: privacy === 'public' ? '#10B981' : '#EC4899' }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <motion.div
                                        className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-xs"
                                        layout
                                        transition={{ type: "spring", stiffness: 700, damping: 30 }}
                                        style={{ marginLeft: privacy === 'public' ? '0px' : '32px' }} // Fallback if layout prop fails? No, layout handles position. But flex alignment?
                                    // Simplify: Just use layout prop. But flex container "items-center" centers vertical. Horizontal needs "justify-start" vs "justify-end"?
                                    // Better approach for toggle without complex layout math:
                                    >
                                        {privacy === 'public' ? '🌍' : '🔒'}
                                    </motion.div>
                                </motion.div>
                                <p className="text-xs text-[var(--text-secondary)] flex-1">
                                    {privacy === 'public' ? 'Anyone can join instantly. Great for open playdates.' : 'Users must request to join. You approve them manually.'}
                                </p>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="category" className={labelStyles}>{t('activity_label_category')}</label>
                            <select id="category" value={category} onChange={e => setCategory(e.target.value as ActivityCategory)} className={inputStyles}>
                                {categories.map(cat => <option key={cat.key} value={cat.key}>{cat.label}</option>)}
                            </select>
                            {category === 'other' && (
                                <input
                                    type="text"
                                    placeholder={t('activity_cat_other_placeholder') || "Specify category..."}
                                    value={customCategory}
                                    onChange={e => setCustomCategory(e.target.value)}
                                    className={`${inputStyles} mt-2`}
                                    required
                                />
                            )}
                        </div>

                        <div>
                            <label htmlFor="description" className={labelStyles}>{t('activity_label_description')}</label>
                            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} required className={inputStyles} placeholder="Tell other parents what to bring (snacks, strollers, etc.)..." />
                        </div>

                        <div>
                            <label htmlFor="location" className={labelStyles}>{t('activity_label_location')}</label>
                            <LocationInput value={location} onChange={setLocation} className={inputStyles} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="date" className={labelStyles}>{t('activity_label_date')}</label>
                                <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required min={new Date().toISOString().split('T')[0]} className={inputStyles} />
                            </div>
                            <div>
                                <label htmlFor="time" className={labelStyles}>{t('activity_label_time')}</label>
                                <input type="time" id="time" value={time} onChange={e => setTime(e.target.value)} required className={inputStyles} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-4">
                        <button type="button" onClick={onClose} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg">{t('button_back')}</button>
                        <button type="submit" className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg shadow-md">{t('button_post_activity')}</button>
                    </div>
                </form>
            </div >
        </div >
    );
};

export default CreateActivityModal;