import React, { useState } from 'react';
import { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface TaskModalProps {
  nanny: User;
  onClose: () => void;
  onSubmit: (nannyId: string, description: string, dueDate: string) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ nanny, onClose, onSubmit }) => {
  const { t } = useLanguage();
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  
  const inputStyles = "mt-1 block w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--ring-accent)] focus:border-[var(--border-accent)] sm:text-sm text-[var(--text-primary)]";
  const labelStyles = "block text-sm font-medium text-[var(--text-secondary)]";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const todayString = new Date().toISOString().split('T')[0];
    if (dueDate < todayString) {
        alert(t('alert_due_date_past'));
        return;
    }

    if (!description.trim()) {
        alert(t('alert_description_required'));
        return;
    }
    onSubmit(nanny.id, description, dueDate);
  };

  return (
    <div className="fixed inset-0 bg-[var(--modal-overlay)] flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="p-8 text-center">
            {/* FIX: The 'photo' property is on the 'nanny' (User) object, not 'nanny.profile'. */}
            <img src={nanny.photo} alt={nanny.fullName} className="w-24 h-24 rounded-full object-cover mx-auto -mt-20 border-4 border-[var(--bg-card)] shadow-lg" />
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-4">{t('task_modal_title', { name: nanny.fullName.split(' ')[0] })}</h2>
            
            <div className="space-y-4 text-left mt-6">
                <div>
                    <label htmlFor="description" className={labelStyles}>{t('task_label_description')}<span className="text-red-500">*</span></label>
                    <textarea 
                        id="description"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={3}
                        placeholder={t('task_placeholder_description')}
                        className={inputStyles}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="dueDate" className={labelStyles}>{t('task_label_due_date')}<span className="text-red-500">*</span></label>
                    <input 
                        type="date" 
                        id="dueDate" 
                        value={dueDate} 
                        onChange={e => setDueDate(e.target.value)} 
                        required 
                        min={new Date().toISOString().split('T')[0]} 
                        className={inputStyles} 
                    />
                </div>
            </div>
            
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button type="button" onClick={onClose} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg">{t('button_back')}</button>
                <button type="submit" className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-bold py-3 px-6 rounded-lg shadow-md">{t('button_save_task')}</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;