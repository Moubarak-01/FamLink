import React from 'react';
import { User, Task, BookingRequest } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

export const formatDateSafe = (dateString: string, locale: string = 'en') => {
    if (!dateString) return '';
    const date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00');
    return date.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
};

export const StatusTag: React.FC<{ status: string }> = ({ status }) => {
    const { t } = useLanguage();
    let styles = { bg: 'bg-gray-100', text: 'text-gray-700' };
    if (status === 'accepted' || status === 'completed') styles = { bg: 'bg-[var(--bg-status-green)]', text: 'text-[var(--text-status-green)]' };
    if (status === 'declined' || status === 'canceled') styles = { bg: 'bg-[var(--bg-status-red)]', text: 'text-[var(--text-status-red)]' };
    if (status === 'pending' || status === 'open') styles = { bg: 'bg-[var(--bg-status-yellow)]', text: 'text-[var(--text-status-yellow)]' };

    const displayLabel = t(`status_${status.toLowerCase().replace(' ', '_')}`) || status;
    return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${styles.bg} ${styles.text} capitalize`}>{displayLabel}</span>;
}

export const TaskItem: React.FC<{ task: Task, onKeep?: (id: string) => void }> = ({ task, onKeep }) => {
    const { t, language } = useLanguage();
    const isCompleted = task.status === 'completed';
    const dueDate = new Date(task.dueDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isOverdue = dueDate < today && !isCompleted;

    return (
        <li className="py-2 border-b border-[var(--border-color)] last:border-0">
            <div className={`flex justify-between items-center ${isCompleted ? 'opacity-60' : ''}`}>
                <span className={`text-sm ${isCompleted ? 'line-through' : ''}`}>{task.description}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isOverdue ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                    {isOverdue ? t('task_overdue') : formatDateSafe(task.dueDate, language)}
                </span>
            </div>
        </li>
    );
};

export const InteractiveTaskItem: React.FC<{ task: Task, onUpdateStatus: (id: string, status: 'pending' | 'completed') => void, onKeep?: (id: string) => void, onDelete?: (id: string) => void }> = ({ task, onUpdateStatus, onKeep, onDelete }) => {
    const { t, language } = useLanguage();
    const isCompleted = task.status === 'completed';
    const dueDate = new Date(task.dueDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isOverdue = dueDate < today && !isCompleted;

    return (
        <div className="bg-[var(--bg-card)] p-3 rounded-lg shadow-sm border border-[var(--border-color)] flex items-start gap-4 group">
            <input
                type="checkbox"
                checked={isCompleted}
                onChange={() => onUpdateStatus(task.id, isCompleted ? 'pending' : 'completed')}
                className="h-5 w-5 mt-1 rounded border-gray-300 text-[var(--accent-primary)] focus:ring-[var(--ring-accent)] cursor-pointer flex-shrink-0"
            />
            <div className="flex-grow">
                <div className="flex items-center justify-between">
                    <p className={`${isCompleted ? 'line-through text-[var(--text-light)]' : 'text-[var(--text-primary)]'}`}>{task.description}</p>
                    <div className="flex items-center gap-2">
                        <StatusTag status={task.status} />
                        {onDelete && (
                            <button onClick={() => { if (window.confirm("Delete this task?")) onDelete(task.id); }} className="text-gray-400 hover:text-red-500 transition-colors" title="Delete Task">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        )}
                    </div>
                </div>
                <p className={`text-xs font-medium mt-1 ${isOverdue ? 'text-[var(--accent-red)]' : 'text-[var(--text-light)]'}`}>
                    {isOverdue ? t('task_overdue') + ': ' : ''} {formatDateSafe(task.dueDate, language)}
                </p>
            </div>
        </div>
    );
};

export const AddedNannyCard: React.FC<{ nanny: User, currentUser: User, tasks: Task[], onRemove: (id: string) => void, onContact: (nanny: User) => void, onView: (id: string) => void, onRate: (nanny: User) => void, onAddTask: () => void, onKeepTask: (id: string) => void }> = ({ nanny, currentUser, tasks, onRemove, onContact, onView, onRate, onAddTask, onKeepTask }) => {
    const { t } = useLanguage();
    if (!nanny.profile) return null;
    const hasRated = nanny.ratings?.some(r => r.parentId === currentUser.id);

    return (
        <div className="bg-[var(--bg-card)] p-4 rounded-lg shadow-sm border border-[var(--border-color)] flex flex-wrap items-center gap-4 transition-all duration-300 hover:shadow-md">
            <img src={nanny.photo} alt={nanny.fullName} className="w-16 h-16 rounded-full object-cover border-2 border-[var(--border-accent)]" />
            <div className="flex-grow">
                <h4 className="font-bold text-[var(--text-primary)]">{nanny.fullName}</h4>
                <p className="text-sm text-[var(--text-light)]">{t('nanny_profile_experience')}: {nanny.profile.experience} {t('nanny_profile_years')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
                <button onClick={() => onView(nanny.id)} className="text-xs font-semibold text-[var(--text-accent)] hover:underline">{t('button_view_profile')}</button>
                <button onClick={() => onContact(nanny)} className="text-xs font-semibold text-[var(--text-accent)] hover:underline">{t('button_contact')}</button>
                <button onClick={() => onRate(nanny)} disabled={!!hasRated} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline disabled:text-gray-400">{hasRated ? t('button_rated') : t('button_rate')}</button>
                <button onClick={() => onAddTask()} className="text-xs font-semibold text-green-600 dark:text-green-400 hover:underline">{t('button_add_task')}</button>
                <button onClick={() => onRemove(nanny.id)} className="text-xs font-semibold text-red-500 dark:text-red-400 hover:underline">{t('button_remove')}</button>
            </div>
            <div className="mt-3 pt-3 border-t border-[var(--border-color)] w-full">
                <h5 className="text-sm font-semibold text-[var(--text-secondary)] mb-1">{t('dashboard_tasks_for_nanny', { name: nanny.fullName.split(' ')[0] })}</h5>
                {tasks.length > 0 ? (
                    <ul className="space-y-1 list-disc list-inside">
                        {tasks.map(task => <li key={task.id} className="text-xs text-[var(--text-primary)]">{task.description}</li>)}
                    </ul>
                ) : <p className="text-xs text-[var(--text-light)]">{t('dashboard_no_tasks')}</p>}
            </div>
        </div>
    );
};

// UPDATED: ParentBookingCard with Chat Button
export const ParentBookingCard: React.FC<{ request: BookingRequest & { nanny?: User }, onChat?: (req: BookingRequest) => void }> = ({ request, onChat }) => {
    const { t, language } = useLanguage();
    if (!request.nanny?.profile && !request.nannyName) return null;

    const nannyName = request.nanny?.fullName || request.nannyName || 'Nanny';
    const nannyPhoto = request.nanny?.photo || request.nannyPhoto;

    let statusColor = 'bg-gray-600';
    if (request.status === 'accepted') statusColor = 'bg-green-700';
    if (request.status === 'declined') statusColor = 'bg-red-600';
    if (request.status === 'pending') statusColor = 'bg-yellow-600';

    return (
        <div className="bg-[#1f2937] p-5 rounded-xl shadow-lg border border-gray-700 relative overflow-hidden text-white">
            <div className="flex justify-center mb-3">
                {nannyPhoto ? (
                    <img src={nannyPhoto} alt={nannyName} className="w-16 h-16 rounded-full object-cover border-2 border-gray-600" />
                ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-500 flex items-center justify-center border-2 border-gray-600"><span className="text-2xl">👤</span></div>
                )}
            </div>
            <h4 className="text-xl font-bold mb-1 text-center">{t('booking_request_to')} {nannyName.split(' ')[0]}</h4>
            <div className="text-gray-300 text-sm space-y-1 mb-4 text-center">
                <p><span className="font-semibold">{t('booking_label_date')}:</span> {formatDateSafe(request.date, language)}</p>
                <p><span className="font-semibold">{t('booking_label_time')}:</span> {request.startTime} - {request.endTime}</p>
            </div>
            <div className="flex justify-between items-center mt-2">
                {/* Chat Button - Only visible if accepted */}
                {request.status === 'accepted' && onChat ? (
                    <button onClick={() => onChat(request)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                        <span>💬</span> {t('activity_card_chat')}
                    </button>
                ) : <div></div>}

                <span className={`px-4 py-1 rounded-full text-sm font-semibold ${statusColor} capitalize`}>
                    {t(`status_${request.status.toLowerCase()}`)}
                </span>
            </div>
        </div>
    );
};

export const NannyBookingCard: React.FC<{ request: BookingRequest & { parent?: User }, onUpdate: (id: string, status: 'accepted' | 'declined') => void, onOpenChat: (req: BookingRequest) => void, onClear?: (id: string) => void }> = ({ request, onUpdate, onOpenChat, onClear }) => {
    const { t, language } = useLanguage();
    const isPending = request.status === 'pending';
    const isAccepted = request.status === 'accepted';
    const parentName = request.parentName || request.parent?.fullName || 'Parent';

    return (
        <div className="bg-[var(--bg-card)] p-4 rounded-lg shadow-sm border border-[var(--border-color)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-grow">
                    <h4 className="font-bold text-[var(--text-primary)]">{t('booking_request_from')} {parentName}</h4>
                    <p className="text-sm text-[var(--text-secondary)]"><span className="font-semibold">{t('booking_label_date')}:</span> {formatDateSafe(request.date, language)}</p>
                    <p className="text-sm text-[var(--text-secondary)]"><span className="font-semibold">{t('booking_label_time')}:</span> {request.startTime} - {request.endTime}</p>
                </div>
                <div className="self-end sm:self-auto flex flex-col sm:flex-row gap-2 items-center">
                    {isPending ? (
                        <>
                            <button onClick={() => onUpdate(request.id, 'accepted')} className="text-sm w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">{t('button_accept')}</button>
                            <button onClick={() => onUpdate(request.id, 'declined')} className="text-sm w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg">{t('button_decline')}</button>
                        </>
                    ) : (
                        <div className="flex flex-col items-end gap-2">
                            <StatusTag status={request.status} />
                            {isAccepted && <button onClick={() => onOpenChat(request)} className="text-xs bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white px-3 py-1 rounded-full transition-colors">{t('activity_card_chat')}</button>}
                            {!isPending && onClear && <button onClick={() => onClear(request.id)} className="text-xs text-red-500 hover:text-red-700 hover:underline">{t('button_clear')}</button>}
                        </div>
                    )}
                </div>
            </div>
            {request.message && <blockquote className="mt-3 pl-3 border-l-4 border-[var(--border-color)] text-sm text-[var(--text-light)] italic">"{request.message}"</blockquote>}
        </div>
    );
};