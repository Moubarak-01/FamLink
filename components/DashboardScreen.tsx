// moubarak-01/famlink/FamLink-b923137ae4aaec857ed19fa053c6966af163c9b5/components/DashboardScreen.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { User, BookingRequest, Task, SharedOuting, SkillRequest, Activity } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { formatActivityTitle } from '../utils/textUtils';
import { activityService } from '../services/activityService';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

type EnrichedBookingRequest = BookingRequest & { nanny?: User, parent?: User };

interface DashboardScreenProps {
    user: User;
    addedNannies: User[];
    bookingRequests: EnrichedBookingRequest[];
    allTasks: Task[];
    userTasks: Task[];
    activities: Activity[]; // <-- ADDED
    sharedOutings: SharedOuting[];
    skillRequests?: SkillRequest[];
    onCancelSubscription: () => void;
    onLogout: () => void;
    onSearchNannies: () => void;
    onRemoveNanny: (nannyId: string) => void;
    onContactNanny: (nanny: User) => void;
    onViewNanny: (nannyId: string) => void;
    onRateNanny: (nanny: User) => void;
    onUpdateBookingStatus: (requestId: string, status: 'accepted' | 'declined') => void;
    onOpenTaskModal: (nanny: User) => void;
    onUpdateTaskStatus: (taskId: string, status: 'pending' | 'completed') => void;
    onViewActivities: () => void;
    onViewOutings: () => void;
    onUpdateOutingRequestStatus: (outingId: string, parentId: string, status: 'accepted' | 'declined') => void;
    onViewSkillMarketplace: () => void;
    onEditProfile: () => void;
    onOpenBookingChat: (request: BookingRequest) => void;
    onCancelBooking: (id: string) => void;
    onClearAllBookings: () => void;
    onKeepTask?: (id: string) => void;
    onDeleteTask?: (id: string) => void;
    onDeleteActivities?: () => void; // <-- ADDED
    onDeleteOutings?: () => void; // <-- ADDED
    onDeleteSkillRequests?: () => void; // <-- ADDED
    onUpdateOffer?: (requestId: string, helperId: string, status: 'accepted' | 'declined') => void; // <-- FIXED: Added missing prop definition
    onOpenChat: (type: 'activity' | 'outing' | 'skill' | 'booking', item: any) => void;
}


const formatDateSafe = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00');
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

const getSafeId = (item: any): string | undefined => {
    if (!item) return undefined;
    if (typeof item === 'string') return item;
    return item._id || item.id;
};


// --- Helper Components ---

const StatusTag: React.FC<{ status: string }> = ({ status }) => {
    const { t } = useLanguage();
    let styles = { bg: 'bg-gray-100', text: 'text-gray-700' };
    if (status === 'accepted' || status === 'completed') styles = { bg: 'bg-[var(--bg-status-green)]', text: 'text-[var(--text-status-green)]' };
    if (status === 'declined' || status === 'canceled') styles = { bg: 'bg-[var(--bg-status-red)]', text: 'text-[var(--text-status-red)]' };
    if (status === 'pending' || status === 'open') styles = { bg: 'bg-[var(--bg-status-yellow)]', text: 'text-[var(--text-status-yellow)]' };

    const statusKey = `status_${status.toLowerCase().replace('canceled', 'cancelled')}`;
    // @ts-ignore
    const label = t(statusKey) || status;

    return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${styles.bg} ${styles.text} capitalize`}>{label}</span>;
}

const InteractiveTaskItem: React.FC<{ task: Task, onUpdateStatus: DashboardScreenProps['onUpdateTaskStatus'], onKeep?: (id: string) => void, onDelete?: (id: string) => void }> = ({ task, onUpdateStatus, onKeep, onDelete }) => {
    const { t } = useLanguage();
    const isCompleted = task.status === 'completed';
    const dueDate = new Date(task.dueDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isOverdue = dueDate < today && !isCompleted;

    // Calculate expiration if completed
    let daysRemaining = 0;
    if (isCompleted && task.completedAt && !task.keepPermanently) {
        const completedDate = new Date(task.completedAt);
        const expirationDate = new Date(completedDate);
        expirationDate.setDate(completedDate.getDate() + 7);
        const now = new Date();
        const diffTime = expirationDate.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const handleToggle = () => {
        onUpdateStatus(task.id, isCompleted ? 'pending' : 'completed');
    };

    return (
        <div className="bg-[var(--bg-card)] p-3 rounded-lg shadow-sm border border-[var(--border-color)] flex items-start gap-4 group">
            <input
                type="checkbox"
                checked={isCompleted}
                onChange={handleToggle}
                className="h-5 w-5 mt-1 rounded border-gray-300 text-[var(--accent-primary)] focus:ring-[var(--ring-accent)] cursor-pointer flex-shrink-0"
            />
            <div className="flex-grow">
                <div className="flex items-center justify-between">
                    <p className={`${isCompleted ? 'line-through text-[var(--text-light)]' : 'text-[var(--text-primary)]'}`}>{task.description}</p>
                    <div className="flex items-center gap-2">
                        <StatusTag status={task.status} />
                        {onDelete && (
                            <button
                                onClick={() => { if (window.confirm("Delete this task?")) onDelete(task.id); }}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                                title="Delete Task"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
                <p className={`text-xs font-medium mt-1 ${isOverdue ? 'text-[var(--accent-red)]' : 'text-[var(--text-light)]'}`}>
                    {isOverdue ? t('task_overdue') + ': ' : t('task_due_on', { date: '' })} {formatDateSafe(task.dueDate)}
                </p>

                {/* Expiration Warning & Keep Button */}
                {isCompleted && !task.keepPermanently && daysRemaining <= 7 && daysRemaining > 0 && (
                    <div className="mt-2 flex items-center justify-between bg-orange-50 dark:bg-orange-900/20 p-2 rounded border border-orange-200 dark:border-orange-800">
                        <span className="text-xs text-orange-700 dark:text-orange-300">Deletes in {daysRemaining} days</span>
                        {onKeep && (
                            <button onClick={() => onKeep(task.id)} className="text-xs font-bold text-orange-800 dark:text-orange-200 hover:underline">
                                Keep
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const AddedNannyCard: React.FC<{ nanny: User, currentUser: User, tasks: Task[], onRemove: (id: string) => void, onContact: (nanny: User) => void, onView: (id: string) => void, onRate: (nanny: User) => void, onAddTask: () => void }> = ({ nanny, currentUser, tasks, onRemove, onContact, onView, onRate, onAddTask }) => {
    const { t } = useLanguage();
    if (!nanny.profile) return null;

    const hasRated = nanny.ratings?.some(r => r.parentId === currentUser.id);

    return (
        <div className="bg-[var(--bg-card)] p-4 rounded-lg shadow-sm border border-[var(--border-color)] flex flex-wrap items-center gap-4 transition-all duration-300 hover:shadow-md">
            <img src={nanny.photo} alt={nanny.fullName} className="w-16 h-16 rounded-full object-cover border-2 border-[var(--border-accent)]" />
            <div className="flex-grow">
                <h4 className="font-bold text-[var(--text-primary)]">{nanny.fullName}</h4>
                <p className="text-sm text-[var(--text-light)]">{t('nanny_profile_experience')}: {nanny.profile.experience} {t('nanny_profile_years')}</p>
                <p className="text-xs text-[var(--text-light)] line-clamp-1">{nanny.profile.description}</p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button
                    onClick={() => onView(nanny.id)}
                    className="flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-all duration-200 hover:scale-[1.02] active:scale-95 hover:shadow-md"
                >
                    <span>📄</span> {t('dashboard_view_details')}
                </button>
                <button
                    onClick={() => onContact(nanny)}
                    className="flex-1 sm:flex-none bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-all duration-200 hover:scale-[1.02] active:scale-95 hover:shadow-md"
                >
                    <span>💬</span> {t('button_contact')}
                </button>
                <button
                    onClick={() => onRate(nanny)}
                    disabled={!!hasRated}
                    className="flex-1 sm:flex-none bg-yellow-400 hover:bg-yellow-500 text-gray-800 text-xs font-bold py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-all duration-200 hover:scale-[1.02] active:scale-95 hover:shadow-md disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                >
                    <span>⭐</span> {hasRated ? t('button_rated') : t('button_rate')}
                </button>
                <button
                    onClick={() => onAddTask()}
                    className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-all duration-200 hover:scale-[1.02] active:scale-95 hover:shadow-md"
                >
                    <span>📝</span> {t('button_add_task')}
                </button>
                <button
                    onClick={() => onRemove(nanny.id)}
                    className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-all duration-200 hover:scale-[1.02] active:scale-95 hover:shadow-md"
                >
                    <span>🗑️</span> {t('button_remove')}
                </button>
            </div>
            <div className="mt-3 pt-3 border-t border-[var(--border-color)] w-full">
                <h5 className="text-sm font-semibold text-[var(--text-secondary)] mb-1">{t('dashboard_tasks_for_nanny', { name: nanny.fullName.split(' ')[0] })}</h5>
                {/* Note: This is a summary view, so we can keep it simple, or use InteractiveTaskItem here too but read-only if preferred. Keeping simple for compactness in card view. */}
                {tasks.length > 0 ? (
                    <ul className="space-y-1 list-disc list-inside">
                        {tasks.map(task => (
                            <li key={task.id} className={`text-xs ${task.status === 'completed' ? 'line-through text-[var(--text-light)]' : 'text-[var(--text-primary)]'}`}>
                                {task.description}
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-xs text-[var(--text-light)]">{t('dashboard_no_tasks')}</p>}
            </div>
        </div>
    );
}

const ParentBookingCard: React.FC<{ request: EnrichedBookingRequest }> = ({ request }) => {
    const { t } = useLanguage();
    // Fallback safe check
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
                    <img
                        src={nannyPhoto}
                        alt={nannyName}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-600"
                    />
                ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-500 flex items-center justify-center border-2 border-gray-600">
                        <span className="text-2xl">👤</span>
                    </div>
                )}
            </div>

            <h4 className="text-xl font-bold mb-1 text-center">{t('booking_request_to')} {nannyName.split(' ')[0]}</h4>

            <div className="text-gray-300 text-sm space-y-1 mb-4 text-center">
                <p><span className="font-semibold">{t('booking_label_date')}:</span> {formatDateSafe(request.date)}</p>
                <p><span className="font-semibold">{t('booking_label_time')}:</span> {request.startTime} - {request.endTime}</p>
            </div>

            <div className="flex justify-center mt-2">
                <span className={`px-4 py-1 rounded-full text-sm font-semibold ${statusColor} capitalize`}>
                    {/* @ts-ignore */}
                    {t(`status_${request.status.toLowerCase()}`) || request.status}
                </span>
            </div>
        </div>
    );
}

const NannyBookingCard: React.FC<{ request: EnrichedBookingRequest, onUpdate: DashboardScreenProps['onUpdateBookingStatus'], onOpenChat: (req: BookingRequest) => void, onClear?: (id: string) => void }> = ({ request, onUpdate, onOpenChat, onClear }) => {
    const { t } = useLanguage();
    const isPending = request.status === 'pending';
    const isAccepted = request.status === 'accepted';

    const parentName = request.parentName || (request.parent ? request.parent.fullName : 'Parent');

    return (
        <div className="bg-[var(--bg-card)] p-4 rounded-lg shadow-sm border border-[var(--border-color)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-grow">
                    <h4 className="font-bold text-[var(--text-primary)]">{t('booking_request_from')} {parentName}</h4>
                    <p className="text-sm text-[var(--text-secondary)]">
                        <span className="font-semibold">{t('booking_label_date')}:</span> {formatDateSafe(request.date)}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                        <span className="font-semibold">{t('booking_label_time')}:</span> {request.startTime} - {request.endTime}
                    </p>
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
                            {isAccepted && (
                                <button onClick={() => onOpenChat(request)} className="text-xs bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white px-3 py-1 rounded-full transition-colors">
                                    {t('activity_card_chat')}
                                </button>
                            )}
                            {!isPending && onClear && (
                                <button onClick={() => onClear(request.id)} className="text-xs text-red-500 hover:text-red-700 hover:underline">
                                    {t('button_clear_history')}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {request.message && <blockquote className="mt-3 pl-3 border-l-4 border-[var(--border-color)] text-sm text-[var(--text-light)] italic">"{request.message}"</blockquote>}
        </div>
    );
};

const ParentDashboard: React.FC<DashboardScreenProps> = ({
    user, addedNannies, bookingRequests, allTasks, userTasks,
    sharedOutings, skillRequests, activities, // <-- ADDED ACTIVITIES PROP
    onCancelSubscription, onSearchNannies, onRemoveNanny, onContactNanny, onViewNanny,
    onRateNanny, onOpenTaskModal, onViewActivities, onViewOutings, onUpdateOutingRequestStatus,
    onViewSkillMarketplace, onEditProfile, onOpenBookingChat, onCancelBooking,
    onClearAllBookings, onDeleteTask, onKeepTask, onUpdateTaskStatus,
    onDeleteActivities, onDeleteOutings, onDeleteSkillRequests, onUpdateOffer, // <-- Correctly destructured
    onOpenChat // <-- NEW Unified Chat Handler
}) => {
    const { t } = useLanguage();
    const myOutingRequests = sharedOutings.flatMap(o => o.requests.filter(r => r.parentId === user.id).map(r => ({ ...r, outingTitle: o.title, date: o.date })));
    const mySkillRequests = skillRequests?.filter(s => {
        const rId = getSafeId(s.requesterId);
        return rId === user.id;
    }) || [];

    // Parent sees tasks they created
    const myTasks = allTasks.filter(t => t.parentId === user.id);

    // NEW: Check for hosted entries
    const hasHostedActivities = activities.some(a => a.hostId === user.id);
    const hasHostedOutings = sharedOutings.some(o => o.hostId === user.id);
    const hasCreatedSkillRequests = skillRequests?.some(s => {
        const rId = getSafeId(s.requesterId);
        return rId === user.id;
    });

    return (
        <>
            {!user.location && (
                <div className="mb-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md flex flex-col sm:flex-row justify-between items-center gap-4" role="alert">
                    <div>
                        <p className="font-bold">{t('parent_profile_form_title')}</p>
                        <p>{t('profile_form_mandatory_prompt')}</p>
                    </div>
                    <button onClick={onEditProfile} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">{t('button_edit_profile')}</button>
                </div>
            )}

            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants} className="bg-[var(--bg-pink-card)] rounded-xl border border-[var(--border-pink-card)] p-5 flex flex-col justify-between">
                    <div><h4 className="text-lg font-semibold text-[var(--text-pink-card-header)] mb-1">{t('dashboard_find_nanny_card_title')}</h4><p className="text-sm text-[var(--text-pink-card-body)] mb-4">{t('dashboard_find_nanny_card_subtitle')}</p></div><button onClick={onSearchNannies} className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-bold py-2 rounded-lg transition-colors text-sm">{t('button_search_nannies')}</button>
                </motion.div>
                {/* Connect with Parents (Activities) Card */}
                <motion.div variants={itemVariants} className="bg-[var(--bg-purple-card)] rounded-xl border border-[var(--border-purple-card)] p-5 flex flex-col justify-between relative">
                    {hasHostedActivities && (
                        <button
                            onClick={onDeleteActivities}
                            className="absolute top-2 right-2 text-gray-500 hover:text-red-500 p-1 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                            title="Delete all hosted activities"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 01-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" /></svg>
                        </button>
                    )}
                    <div><h4 className="text-lg font-semibold text-[var(--text-purple-card-header)] mb-1">{t('dashboard_community_title')}</h4><p className="text-sm text-[var(--text-purple-card-body)] mb-4">{t('dashboard_community_subtitle')}</p></div><button onClick={onViewActivities} className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 rounded-lg transition-colors text-sm">{t('dashboard_community_button')}</button>
                </motion.div>
                {/* Child Outing Sharing Card */}
                <motion.div variants={itemVariants} className="bg-[var(--bg-teal-card)] rounded-xl border border-[var(--border-teal-card)] p-5 flex flex-col justify-between relative">
                    {hasHostedOutings && (
                        <button
                            onClick={onDeleteOutings}
                            className="absolute top-2 right-2 text-gray-500 hover:text-red-500 p-1 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                            title="Delete all hosted outings"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 01-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" /></svg>
                        </button>
                    )}
                    <div><h4 className="text-lg font-semibold text-[var(--text-teal-card-header)] mb-1">{t('dashboard_child_sharing_title')}</h4><p className="text-sm text-[var(--text-teal-card-body)] mb-4">{t('dashboard_child_sharing_subtitle')}</p></div><button onClick={onViewOutings} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 rounded-lg transition-colors text-sm">{t('dashboard_child_sharing_button')}</button>
                </motion.div>
                {/* Skill Sharing & Help Card */}
                <motion.div variants={itemVariants} className="bg-[var(--bg-blue-card)] rounded-xl border border-[var(--border-blue-card)] p-5 flex flex-col justify-between relative">
                    {/* Button Removed per user request */}
                    <div><h4 className="text-lg font-semibold text-[var(--text-blue-card-header)] mb-1">{t('dashboard_skill_sharing_title')}</h4><p className="text-sm text-[var(--text-blue-card-body)] mb-4">{t('dashboard_skill_sharing_subtitle')}</p></div><button onClick={onViewSkillMarketplace} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition-colors text-sm">{t('dashboard_skill_sharing_button')}</button>
                </motion.div>
            </motion.div>

            <motion.div
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold text-[var(--text-primary)]">{t('dashboard_my_booking_requests')}</h3>
                        {bookingRequests.length > 0 && <button onClick={onClearAllBookings} className="text-xs text-red-500 hover:text-red-700 underline">Clear All History</button>}
                    </div>
                    {bookingRequests.length > 0 ? (
                        <div className="space-y-4">
                            {bookingRequests.map(req => <ParentBookingCard key={req.id} request={req} />)}
                        </div>
                    ) : (
                        <div className="text-center bg-[var(--bg-card-subtle)] rounded-xl border-2 border-dashed border-[var(--border-color)] p-8">
                            <p className="text-[var(--text-light)]">{t('dashboard_no_booking_requests')}</p>
                        </div>
                    )}
                </motion.div>

                <motion.div variants={itemVariants}>
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4">{t('dashboard_my_added_nannies')}</h3>
                    {addedNannies.length > 0 ? (
                        <div className="space-y-4">
                            {addedNannies.map(nanny => (
                                <AddedNannyCard key={nanny.id} nanny={nanny} currentUser={user} tasks={allTasks.filter(t => t.nannyId === nanny.id)} onRemove={onRemoveNanny} onContact={onContactNanny} onView={onViewNanny} onRate={onRateNanny} onAddTask={() => onOpenTaskModal(nanny)} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center bg-[var(--bg-card-subtle)] rounded-xl border-2 border-dashed border-[var(--border-color)] p-8">
                            <p className="text-[var(--text-light)]">{t('dashboard_no_added_nannies')}</p>
                        </div>
                    )}
                </motion.div>
            </motion.div>

            {/* Task Management for Parents (Enhanced) */}
            <div className="mt-8">
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t('dashboard_my_tasks')}</h3>
                {myTasks.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {myTasks.map(task => (
                            <InteractiveTaskItem
                                key={task.id}
                                task={task}
                                onUpdateStatus={onUpdateTaskStatus}
                                onKeep={onKeepTask}
                                onDelete={onDeleteTask}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center bg-[var(--bg-card-subtle)] rounded-xl border-2 border-dashed border-[var(--border-color)] p-8">
                        <p className="text-[var(--text-light)]">{t('dashboard_no_tasks')}</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                {/* My Activity Requests (Unified) */}
                <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden flex flex-col h-full">
                    <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-card-subtle)]">
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">{t('dashboard_my_activity_requests')}</h3>
                    </div>
                    <div className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[500px]">
                        {/* INCOMING (Host View) */}
                        {activities.filter(a => {
                            if (!a.hostId) return false;
                            const hostIdStr = getSafeId(a.hostId);
                            return hostIdStr === user.id && a.requests?.some(r => r.status === 'pending');
                        }).flatMap(activity =>
                            (activity.requests || []).filter(r => r.status === 'pending').map(req => (
                                <div key={`inc-act-${activity.id}-${req.userId}`} className="bg-[var(--bg-card)] p-3 rounded-lg border border-l-4 border-l-yellow-400 border-[var(--border-color)] shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-[var(--text-primary)] text-sm">{formatActivityTitle(activity.category)}</h4>
                                            <p className="text-xs text-[var(--text-secondary)]">{t('dashboard_request_from')} <span className="font-semibold">{t('dashboard_user')} {req.userId.substring(0, 6)}...</span></p>
                                        </div>
                                        <span className="text-[10px] font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full uppercase tracking-wide">{t('dashboard_action_needed')}</span>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={async () => {
                                                try { await activityService.approveRequest(activity.id, req.userId); } catch (e) { alert('Error approving'); }
                                            }}
                                            className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1.5 rounded transition-colors"
                                        >
                                            {t('button_accept')}
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try { await activityService.declineRequest(activity.id, req.userId); } catch (e) { alert('Error declining'); }
                                            }}
                                            className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1.5 rounded transition-colors"
                                        >
                                            {t('button_decline')}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}

                        {/* OUTGOING (User View) + HOSTED (Creator View) */}
                        {activities.map(activity => {
                            if (!activity.hostId) return null; // Safe check
                            const hostIdStr = getSafeId(activity.hostId);
                            const isHost = hostIdStr === user.id;
                            const myRequest = activity.requests?.find(r => r.userId === user.id);

                            if (!isHost && !myRequest) return null;

                            const isOpen = isHost || myRequest?.status === 'accepted';
                            const statusLabel = isHost ? 'Hosted' : myRequest?.status;
                            const statusColor = isHost ? 'bg-purple-100 text-purple-700' :
                                (statusLabel === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700');

                            return (
                                <div key={`out-act-${activity.id}`} className={`bg-[var(--bg-card)] p-3 rounded-lg border border-[var(--border-color)] shadow-sm ${isOpen ? 'border-l-4 border-l-pink-500' : ''}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <div>
                                            <h4 className="font-bold text-[var(--text-primary)] text-sm">{formatActivityTitle(activity.category)}</h4>
                                            <p className="text-xs text-[var(--text-secondary)]">{formatDateSafe(activity.date)}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                                            {isHost ? t('dashboard_hosted') : (t(`status_${statusLabel?.toLowerCase()}` as any) || statusLabel)}
                                        </span>
                                    </div>
                                    {isOpen && (
                                        <button
                                            onClick={() => onOpenChat('activity', activity)}
                                            className="w-full mt-2 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-95 hover:shadow-md"
                                        >
                                            <span>💬</span> {t('dashboard_open_chat')}
                                        </button>
                                    )}
                                    <button
                                        onClick={onViewActivities}
                                        className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 rounded flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-95 hover:shadow-md"
                                    >
                                        📄 {t('dashboard_view_details')}
                                    </button>
                                </div>
                            );
                        }).filter(Boolean)}

                        {/* Empty State */}
                        {(!activities.some(a => {
                            if (!a.hostId) return false;
                            const hostIdStr = getSafeId(a.hostId);
                            // Check for incoming pending requests OR if hosted by user OR if requested by user
                            return (hostIdStr === user.id) || // Includes hosted + incoming
                                (a.requests?.some(r => r.userId === user.id));
                        })) && (
                                <div className="text-center py-8 px-4 text-[var(--text-light)] text-sm italic">
                                    {t('dashboard_no_activity_requests')}
                                </div>
                            )}
                    </div>
                </div>

                {/* My Outing Requests (Unified) */}
                <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden flex flex-col h-full">
                    <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-card-subtle)]">
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">{t('dashboard_my_outing_requests')}</h3>
                    </div>
                    <div className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[500px]">
                        {/* INCOMING (Host View) */}
                        {sharedOutings.filter(o => {
                            if (!o.hostId) return false;
                            const hostIdStr = getSafeId(o.hostId);
                            return hostIdStr === user.id && o.requests?.some(r => r.status === 'pending');
                        }).flatMap(outing =>
                            (outing.requests || []).filter(r => r.status === 'pending').map(req => (
                                <div key={`inc-out-${outing.id}-${req.parentId}`} className="bg-[var(--bg-card)] p-3 rounded-lg border border-l-4 border-l-yellow-400 border-[var(--border-color)] shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-[var(--text-primary)] text-sm">{outing.title}</h4>
                                            <p className="text-xs text-[var(--text-secondary)]">{t('dashboard_request_for')} <span className="font-semibold">{req.childName}</span></p>
                                        </div>
                                        <span className="text-[10px] font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full uppercase tracking-wide">{t('dashboard_action_needed')}</span>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => onUpdateOutingRequestStatus(outing.id, req.parentId, 'accepted')}
                                            className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1.5 rounded transition-colors"
                                        >
                                            {t('button_accept')}
                                        </button>
                                        <button
                                            onClick={() => onUpdateOutingRequestStatus(outing.id, req.parentId, 'declined')}
                                            className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1.5 rounded transition-colors"
                                        >
                                            {t('button_decline')}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}

                        {/* OUTGOING (User View) + HOSTED (Creator View) */}
                        {sharedOutings.map(outing => {
                            if (!outing.hostId) return null; // Safe check
                            const hostIdStr = getSafeId(outing.hostId);
                            const isHost = hostIdStr === user.id;
                            const myRequest = outing.requests?.find(r => r.parentId === user.id);

                            if (!isHost && !myRequest) return null;

                            const isOpen = isHost || myRequest?.status === 'accepted';
                            const statusLabel = isHost ? 'Hosted' : myRequest?.status;
                            const statusColor = isHost ? 'bg-purple-100 text-purple-700' :
                                (statusLabel === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700');

                            return (
                                <div key={`out-out-${outing.id}`} className={`bg-[var(--bg-card)] p-3 rounded-lg border border-[var(--border-color)] shadow-sm ${isOpen ? 'border-l-4 border-l-pink-500' : ''}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <div>
                                            <h4 className="font-bold text-[var(--text-primary)] text-sm">{outing.title}</h4>
                                            <p className="text-xs text-[var(--text-secondary)]">{formatDateSafe(outing.date)} • {isHost ? t('dashboard_hosted_by_you') : myRequest?.childName}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                                            {isHost ? t('dashboard_hosted') : statusLabel}
                                        </span>
                                    </div>
                                    {isOpen && (
                                        <button
                                            onClick={() => onOpenChat('outing', outing)}
                                            className="w-full mt-2 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-95 hover:shadow-md"
                                        >
                                            <span>💬</span> {t('dashboard_open_chat')}
                                        </button>
                                    )}
                                    <button
                                        onClick={onViewOutings}
                                        className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 rounded flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-95 hover:shadow-md"
                                    >
                                        📄 {t('dashboard_view_details')}
                                    </button>
                                </div>
                            );
                        }).filter(Boolean)}

                        {/* Empty State */}
                        {(!sharedOutings.some(o => {
                            if (!o.hostId) return false;
                            const hostIdStr = getSafeId(o.hostId);
                            // Check for incoming pending requests OR if hosted by user OR if requested by user
                            return (hostIdStr === user.id) ||
                                (o.requests?.some(r => r.parentId === user.id));
                        })) && (
                                <div className="text-center py-8 px-4 text-[var(--text-light)] text-sm italic">
                                    {t('dashboard_no_outing_requests')}
                                </div>
                            )}
                    </div>
                </div>

                {/* My Skill Requests (Unified) */}
                <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden flex flex-col h-full">
                    <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-card-subtle)]">
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">{t('dashboard_my_skill_requests')}</h3>
                    </div>
                    <div className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[500px]">
                        {/* MY REQUESTS (Requester View) */}
                        {skillRequests?.filter(s => {
                            const rId = getSafeId(s.requesterId);
                            return rId === user.id;
                        }).map(task => {
                            const offers = task.offers || [];
                            const pendingOffers = offers.filter(o => o.status === 'pending');
                            const acceptedOffer = offers.find(o => o.status === 'accepted');

                            // If there's an accepted offer, show "Hosted" style
                            if (acceptedOffer) {
                                const helperName = acceptedOffer.helperName || ((acceptedOffer.helperId && typeof acceptedOffer.helperId === 'object') ? (acceptedOffer.helperId as any).fullName : 'Helper');
                                return (
                                    <div key={`my-skill-${task.id}`} className="bg-[var(--bg-card)] p-3 rounded-lg border border-[var(--border-color)] shadow-sm border-l-4 border-l-pink-500">
                                        <div className="flex justify-between items-center mb-2">
                                            <div>
                                                <h4 className="font-bold text-[var(--text-primary)] text-sm">{task.title}</h4>
                                                <p className="text-xs text-[var(--text-secondary)]">{t('dashboard_assigned_to')} <span className="font-semibold">{helperName}</span></p>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700">{t('status_in_progress')}</span>
                                        </div>
                                        <button
                                            onClick={() => onOpenChat('skill', task)}
                                            className="w-full mt-2 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-95 hover:shadow-md"
                                        >
                                            <span>💬</span> {t('dashboard_open_chat')}
                                        </button>
                                        <button
                                            onClick={onViewSkillMarketplace}
                                            className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 rounded flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-95 hover:shadow-md"
                                        >
                                            📄 {t('dashboard_view_details')}
                                        </button>
                                    </div>
                                );
                            }

                            // If pending offers, show "Action Needed" cards for EACH offer
                            if (pendingOffers.length > 0) {
                                return pendingOffers.map(offer => {
                                    const hId = getSafeId(offer.helperId);
                                    const hName = offer.helperName || ((offer.helperId && typeof offer.helperId === 'object') ? (offer.helperId as any).fullName : 'User');
                                    return (
                                        <div key={`offer-${task.id}-${hId}`} className="bg-[var(--bg-card)] p-3 rounded-lg border border-l-4 border-l-yellow-400 border-[var(--border-color)] shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-bold text-[var(--text-primary)] text-sm">{task.title}</h4>
                                                    <p className="text-xs text-[var(--text-secondary)]">{t('dashboard_offer_from')} <span className="font-semibold">{hName}</span>: ${offer.offerAmount}</p>
                                                </div>
                                                <span className="text-[10px] font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full uppercase tracking-wide">{t('dashboard_action_needed')}</span>
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    onClick={() => onUpdateOffer && onUpdateOffer(task.id, hId, 'accepted')}
                                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1.5 rounded transition-colors"
                                                >
                                                    {t('button_accept')}
                                                </button>
                                                <button
                                                    onClick={() => onUpdateOffer && onUpdateOffer(task.id, hId, 'declined')}
                                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1.5 rounded transition-colors"
                                                >
                                                    {t('button_decline')}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                });
                            }

                            // If no offers yet
                            return (
                                <div key={`my-skill-${task.id}`} className="bg-[var(--bg-card)] p-3 rounded-lg border border-[var(--border-color)] shadow-sm opacity-75">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-[var(--text-primary)] text-sm">{task.title}</h4>
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{t('dashboard_no_offers')}</span>
                                    </div>
                                </div>
                            );
                        })}

                        {/* MY OFFERS (Helper View) */}
                        {/* MY OFFERS (Helper View) */}
                        {skillRequests?.filter(s => s.offers?.some(o => {
                            const hId = getSafeId(o.helperId);
                            return hId === user.id;
                        })).map(task => {
                            const myOffer = task.offers.find(o => {
                                const hId = getSafeId(o.helperId);
                                return hId === user.id;
                            });

                            const isAccepted = myOffer?.status === 'accepted';
                            const statusLabel = myOffer?.status || 'pending';
                            const statusColor = isAccepted ? 'bg-green-100 text-green-700' :
                                (statusLabel === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700');

                            return (
                                <div key={`off-skill-${task.id}`} className={`bg-[var(--bg-card)] p-3 rounded-lg border border-[var(--border-color)] shadow-sm ${isAccepted ? 'border-l-4 border-l-pink-500' : ''}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <div>
                                            <h4 className="font-bold text-[var(--text-primary)] text-sm">{task.title}</h4>
                                            <p className="text-xs text-[var(--text-secondary)]">Offer: ${myOffer?.offerAmount}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                                            {/* @ts-ignore */}
                                            {t(`status_${statusLabel.toLowerCase()}`) || statusLabel}
                                        </span>
                                    </div>
                                    {isAccepted && (
                                        <button
                                            onClick={() => onOpenChat('skill', task)}
                                            className="w-full mt-2 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-95 hover:shadow-md"
                                        >
                                            <span>💬</span> {t('dashboard_open_chat')}
                                        </button>
                                    )}
                                    <button
                                        onClick={onViewSkillMarketplace}
                                        className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 rounded flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-95 hover:shadow-md"
                                    >
                                        📄 {t('dashboard_view_details')}
                                    </button>
                                </div>
                            );
                        })}

                        {/* Empty State */}
                        {(!skillRequests?.some(s => {
                            const rId = getSafeId(s.requesterId);
                            return rId === user.id;
                        }) && !skillRequests?.some(s => s.offers?.some(o => {
                            const hId = getSafeId(o.helperId);
                            return hId === user.id;
                        }))) && (
                                <div className="text-center py-8 px-4 text-[var(--text-light)] text-sm italic">
                                    {t('dashboard_no_skill_requests')}
                                </div>
                            )}
                    </div>
                </div>
            </div>
        </>
    );
};

const NannyDashboard: React.FC<DashboardScreenProps> = ({ user, bookingRequests, userTasks, onUpdateBookingStatus, onUpdateTaskStatus, onOpenBookingChat, onCancelBooking, onKeepTask, onDeleteTask }) => {
    const { t } = useLanguage();
    const profileComplete = !!user.profile;
    const pendingRequests = bookingRequests.filter(req => req.status === 'pending');
    const pastRequests = bookingRequests.filter(req => req.status !== 'pending');

    return (
        <>
            <div className="bg-[var(--bg-card-subtle)] rounded-xl border border-[var(--border-color)] p-6 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">{profileComplete ? t('dashboard_nanny_profile_live') : t('dashboard_nanny_complete_profile')}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">{profileComplete ? t('dashboard_nanny_profile_live_desc') : t('dashboard_nanny_complete_profile_desc')}</p>
                </div>
                {!profileComplete && <span className="text-xs text-[var(--text-light)] bg-yellow-100 px-3 py-1 rounded-full">{t('dashboard_status')}: {t('dashboard_user')}</span>}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4">{t('dashboard_incoming_requests')}</h3>
                    {pendingRequests.length > 0 ? (
                        <div className="space-y-4">
                            {pendingRequests.map(req => <NannyBookingCard key={req.id} request={req} onUpdate={onUpdateBookingStatus} onOpenChat={onOpenBookingChat} />)}
                        </div>
                    ) : (
                        <div className="text-center bg-[var(--bg-card-subtle)] rounded-xl border-2 border-dashed border-[var(--border-color)] p-8">
                            <p className="text-[var(--text-light)]">{t('dashboard_no_pending_requests')}</p>
                        </div>
                    )}

                    <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-8 mb-4">{t('dashboard_booking_history')}</h3>
                    {pastRequests.length > 0 ? (
                        <div className="space-y-4">
                            {pastRequests.map(req => <NannyBookingCard key={req.id} request={req} onUpdate={onUpdateBookingStatus} onOpenChat={onOpenBookingChat} onClear={onCancelBooking} />)}
                        </div>
                    ) : (
                        <div className="text-center bg-[var(--bg-card-subtle)] rounded-xl border-2 border-dashed border-[var(--border-color)] p-8">
                            <p className="text-[var(--text-light)]">{t('dashboard_no_booking_history')}</p>
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4">{t('dashboard_my_tasks')}</h3>
                    {userTasks.length > 0 ? (
                        <div className="space-y-4">
                            {/* Use InteractiveTaskItem here too for consistency */}
                            {userTasks.map(task => (
                                <InteractiveTaskItem
                                    key={task.id}
                                    task={task}
                                    onUpdateStatus={onUpdateTaskStatus}
                                    onKeep={onKeepTask}
                                    onDelete={onDeleteTask}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center bg-[var(--bg-card-subtle)] rounded-xl border-2 border-dashed border-[var(--border-color)] p-8">
                            <p className="text-[var(--text-light)]">{t('dashboard_no_tasks')}</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

const DashboardScreen: React.FC<DashboardScreenProps> = (props) => {
    const { t } = useLanguage();
    const { user, onLogout } = props;

    return (
        <div className="p-4 sm:p-8 relative">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-[var(--text-primary)]">{t('dashboard_title')}</h2>
                    <p className="text-[var(--text-secondary)]">{t('dashboard_welcome')}, {user.fullName}!</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-[var(--bg-card-subtle)] px-4 py-2 rounded-full border border-[var(--border-color)]">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{user.subscription?.status === 'active' ? t('dashboard_premium') : t('dashboard_user')}</span>
                        {user.subscription?.status === 'active' && <span className="text-yellow-500">👑</span>}
                    </div>
                </div>
            </div>
            {user.userType === 'parent' ? <ParentDashboard {...props} /> : <NannyDashboard {...props} />}
            <div className="mt-12 pt-6 border-t border-[var(--border-color)] flex justify-center"><button onClick={onLogout} className="text-red-500 hover:text-red-700 font-medium transition-colors">{t('button_logout')}</button></div>
        </div>
    );
};

export default DashboardScreen;