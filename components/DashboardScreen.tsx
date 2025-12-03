import React from 'react';
import { User, BookingRequest, Task, SharedOuting, OutingRequest, SkillRequest } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

type EnrichedBookingRequest = BookingRequest & { nanny?: User, parent?: User };

interface DashboardScreenProps {
  user: User;
  addedNannies: User[];
  bookingRequests: EnrichedBookingRequest[];
  allTasks: Task[];
  userTasks: Task[];
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
}

const formatDateSafe = (dateString: string) => {
    if (!dateString) return '';
    if (dateString.length === 10) {
        return new Date(dateString + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    }
    return new Date(dateString).toLocaleDateString();
};

const TaskItem: React.FC<{ task: Task }> = ({ task }) => {
    const { t } = useLanguage();
    const isCompleted = task.status === 'completed';
    const dueDate = new Date(task.dueDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isOverdue = dueDate < today && !isCompleted;

    return (
        <li className={`flex items-center justify-between text-sm py-1 ${isCompleted ? 'text-[var(--text-light)]' : 'text-[var(--text-primary)]'}`}>
            <span className={isCompleted ? 'line-through' : ''}>{task.description}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isOverdue ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                {isOverdue ? t('task_overdue') : `${t('task_due_on', {date: ''})}${formatDateSafe(task.dueDate)}`}
            </span>
        </li>
    );
};

const AddedNannyCard: React.FC<{nanny: User, currentUser: User, tasks: Task[], onRemove: (id: string) => void, onContact: (nanny: User) => void, onView: (id: string) => void, onRate: (nanny: User) => void, onAddTask: () => void}> = ({ nanny, currentUser, tasks, onRemove, onContact, onView, onRate, onAddTask }) => {
    const { t } = useLanguage();
    if (!nanny.profile) return null;

    const hasRated = nanny.ratings?.some(r => r.parentId === currentUser.id);

    return (
        <div className="bg-[var(--bg-card)] p-4 rounded-lg shadow-sm border border-[var(--border-color)] flex flex-wrap items-center gap-4">
            <img src={nanny.photo} alt={nanny.fullName} className="w-16 h-16 rounded-full object-cover" />
            <div className="flex-grow">
                <h4 className="font-bold text-[var(--text-primary)]">{nanny.fullName}</h4>
                <p className="text-sm text-[var(--text-light)]">{t('nanny_profile_experience')}: {nanny.profile.experience} {t('nanny_profile_years')}</p>
                 <p className="text-xs text-[var(--text-light)] line-clamp-1">{nanny.profile.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
                <button onClick={() => onView(nanny.id)} className="text-xs font-semibold text-[var(--text-accent)] hover:underline">{t('button_view_profile')}</button>
                <button onClick={() => onContact(nanny)} className="text-xs font-semibold text-[var(--text-accent)] hover:underline">{t('button_contact')}</button>
                <button 
                    onClick={() => onRate(nanny)} 
                    disabled={hasRated}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed">
                    {hasRated ? t('button_rated') : t('button_rate')}
                </button>
                <button onClick={() => onAddTask()} className="text-xs font-semibold text-green-600 dark:text-green-400 hover:underline">{t('button_add_task')}</button>
                <button onClick={() => onRemove(nanny.id)} className="text-xs font-semibold text-red-500 dark:text-red-400 hover:underline">
                    {t('button_remove')}
                </button>
            </div>
            <div className="mt-3 pt-3 border-t border-[var(--border-color)] w-full">
                <h5 className="text-sm font-semibold text-[var(--text-secondary)] mb-1">{t('dashboard_tasks_for_nanny', {name: nanny.fullName.split(' ')[0]})}</h5>
                {tasks.length > 0 ? (
                    <ul className="space-y-1 list-disc list-inside">
                        {tasks.map(task => <TaskItem key={task.id} task={task} />)}
                    </ul>
                ) : <p className="text-xs text-[var(--text-light)]">{t('dashboard_no_tasks')}</p>}
            </div>
        </div>
    );
}

const BookingRequestStatus: React.FC<{status: BookingRequest['status']}> = ({ status }) => {
    const { t } = useLanguage();
    const statusStyles = {
        pending: { text: t('booking_status_pending'), bg: 'bg-[var(--bg-status-yellow)]', text_color: 'text-[var(--text-status-yellow)]' },
        accepted: { text: t('booking_status_accepted'), bg: 'bg-[var(--bg-status-green)]', text_color: 'text-[var(--text-status-green)]' },
        declined: { text: t('booking_status_declined'), bg: 'bg-[var(--bg-status-red)]', text_color: 'text-[var(--text-status-red)]' }
    };
    const currentStatus = statusStyles[status];
    return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${currentStatus.bg} ${currentStatus.text_color}`}>{currentStatus.text}</span>;
};

interface ParentBookingCardProps {
    request: EnrichedBookingRequest;
    onOpenChat: (req: BookingRequest) => void;
    onCancel: (id: string) => void;
    onAssignTask: (nanny: User) => void;
    onRate: (nanny: User) => void;
    currentUser: User;
}

const ParentBookingCard: React.FC<ParentBookingCardProps> = ({ request, onOpenChat, onCancel, onAssignTask, onRate, currentUser }) => {
    const { t } = useLanguage();
    if (!request.nanny?.profile) return null;
    
    const hasRated = request.nanny.ratings?.some(r => r.parentId === currentUser.id);

    return (
        <div className="bg-[var(--bg-card)] p-4 rounded-lg shadow-sm border border-[var(--border-color)] flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <img src={request.nanny.photo} alt={request.nanny.fullName} className="w-16 h-16 rounded-full object-cover self-center sm:self-auto" />
            <div className="flex-grow">
                <h4 className="font-bold text-[var(--text-primary)]">{t('booking_request_to')} {request.nanny.fullName}</h4>
                <p className="text-sm text-[var(--text-secondary)]">
                    <span className="font-semibold">{t('booking_label_date')}:</span> {formatDateSafe(request.date)}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                    <span className="font-semibold">{t('booking_label_time')}:</span> {request.startTime} - {request.endTime}
                </p>
            </div>
            <div className="self-end sm:self-auto flex flex-col items-end gap-2">
                <BookingRequestStatus status={request.status} />
                {request.status === 'accepted' && (
                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={() => onOpenChat(request)}
                            className="text-xs bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-bold py-1 px-3 rounded-full transition-colors w-full"
                        >
                            {t('activity_card_chat')}
                        </button>
                        <button 
                            onClick={() => onAssignTask(request.nanny!)}
                            className="text-xs bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-full transition-colors w-full"
                        >
                            {t('button_add_task')}
                        </button>
                         <button 
                            onClick={() => onRate(request.nanny!)}
                            disabled={!!hasRated}
                            className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded-full transition-colors w-full disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {hasRated ? t('button_rated') : t('button_rate')}
                        </button>
                    </div>
                )}
                {request.status === 'pending' && (
                    <button 
                        onClick={() => onCancel(request.id)}
                        className="text-xs text-red-500 hover:text-red-700 underline"
                    >
                        Cancel Request
                    </button>
                )}
            </div>
        </div>
    );
}

const StatusTag: React.FC<{ status: string }> = ({ status }) => {
     const { t } = useLanguage();
     let styles = { bg: 'bg-gray-100', text: 'text-gray-700' };
     if (status === 'accepted' || status === 'completed') styles = { bg: 'bg-[var(--bg-status-green)]', text: 'text-[var(--text-status-green)]' };
     if (status === 'declined' || status === 'canceled') styles = { bg: 'bg-[var(--bg-status-red)]', text: 'text-[var(--text-status-red)]' };
     if (status === 'pending' || status === 'open') styles = { bg: 'bg-[var(--bg-status-yellow)]', text: 'text-[var(--text-status-yellow)]' };

     return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${styles.bg} ${styles.text}`}>{status}</span>;
}

const HostedOutingCard: React.FC<{ outing: SharedOuting, onUpdateRequest: (parentId: string, status: 'accepted' | 'declined') => void }> = ({ outing, onUpdateRequest }) => {
    const { t } = useLanguage();
    return (
        <div className="bg-[var(--bg-card)] p-4 rounded-lg shadow-sm border border-[var(--border-color)]">
            <h4 className="font-bold text-[var(--text-primary)]">{outing.title}</h4>
            <p className="text-sm text-[var(--text-secondary)]">
                <span className="font-semibold">{t('booking_label_date')}:</span> {formatDateSafe(outing.date)} at {outing.time}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">📍 {outing.location}</p>
            <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                <h5 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">{t('outing_card_requests')} ({outing.requests.length})</h5>
                {outing.requests.length > 0 ? (
                    <ul className="space-y-3">
                        {outing.requests.map(req => (
                            <li key={req.parentId} className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm bg-[var(--bg-card-subtle)] p-3 rounded-md">
                                <div>
                                    <p className="font-semibold text-[var(--text-primary)]">{req.parentName}</p>
                                    <p className="text-[var(--text-light)]">{t('request_outing_label_child_name')}: {req.childName}, {t('request_outing_label_child_age')}: {req.childAge}</p>
                                </div>
                                <div className="flex gap-2 items-center mt-2 sm:mt-0">
                                    {req.status === 'pending' ? (
                                        <>
                                            <button onClick={() => onUpdateRequest(req.parentId, 'accepted')} className="text-xs bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-full">{t('button_accept')}</button>
                                            <button onClick={() => onUpdateRequest(req.parentId, 'declined')} className="text-xs bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-full">{t('button_decline')}</button>
                                        </>
                                    ) : (
                                        <StatusTag status={req.status} />
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-xs text-[var(--text-light)]">{t('dashboard_no_pending_requests')}</p>
                )}
            </div>
        </div>
    );
};

const ParentDashboard: React.FC<DashboardScreenProps> = ({ user, addedNannies, bookingRequests, allTasks, sharedOutings, skillRequests, onCancelSubscription, onSearchNannies, onRemoveNanny, onContactNanny, onViewNanny, onRateNanny, onOpenTaskModal, onViewActivities, onViewOutings, onUpdateOutingRequestStatus, onViewSkillMarketplace, onEditProfile, onOpenBookingChat, onCancelBooking, onClearAllBookings }) => {
    const { t } = useLanguage();
    const hostedOutings = sharedOutings.filter(o => o.hostId === user.id);
    const myOutingRequests = sharedOutings.flatMap(o => o.requests.filter(r => r.parentId === user.id).map(r => ({ ...r, outingTitle: o.title, date: o.date })));
    const mySkillRequests = skillRequests?.filter(s => s.requesterId === user.id) || [];

    return (
      <>
         {/* Profile Completion Warning */}
        {!user.location && (
             <div className="mb-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md flex flex-col sm:flex-row justify-between items-center gap-4" role="alert">
                <div>
                    <p className="font-bold">{t('parent_profile_form_title')}</p>
                    <p>{t('profile_form_mandatory_prompt')}</p>
                </div>
                <button
                    onClick={onEditProfile}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                    {t('button_edit_profile')}
                </button>
            </div>
        )}

        <div className="grid grid-cols-1 gap-6 mb-8">
             {/* Find Nanny Card */}
            <div className="bg-[var(--bg-pink-card)] rounded-xl border border-[var(--border-pink-card)] p-6">
                <h4 className="text-lg font-semibold text-[var(--text-pink-card-header)] mb-2">{t('dashboard_find_nanny_card_title')}</h4>
                <p className="text-sm text-[var(--text-pink-card-body)] mb-4">{t('dashboard_find_nanny_card_subtitle')}</p>
                <button
                    onClick={onSearchNannies}
                    className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-bold py-3 rounded-lg transition-colors text-center"
                >
                    {t('button_search_nannies')}
                </button>
            </div>

            {/* Community Card */}
             <div className="bg-[var(--bg-purple-card)] rounded-xl border border-[var(--border-purple-card)] p-6">
                <h4 className="text-lg font-semibold text-[var(--text-purple-card-header)] mb-2">{t('dashboard_community_title')}</h4>
                <p className="text-sm text-[var(--text-purple-card-body)] mb-4">{t('dashboard_community_subtitle')}</p>
                <button
                    onClick={onViewActivities}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-lg transition-colors text-center"
                >
                    {t('dashboard_community_button')}
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-[var(--text-primary)]">{t('dashboard_my_booking_requests')}</h3>
                    {bookingRequests.length > 0 && (
                        <button onClick={onClearAllBookings} className="text-xs text-red-500 hover:text-red-700 underline">
                            Clear All History
                        </button>
                    )}
                </div>
                {bookingRequests.length > 0 ? (
                    <div className="space-y-4">
                        {bookingRequests.map(req => (
                            <ParentBookingCard 
                                key={req.id} 
                                request={req} 
                                onOpenChat={onOpenBookingChat} 
                                onCancel={onCancelBooking}
                                onAssignTask={onOpenTaskModal}
                                onRate={onRateNanny}
                                currentUser={user}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center bg-[var(--bg-card-subtle)] rounded-xl border-2 border-dashed border-[var(--border-color)] p-8">
                        <p className="text-[var(--text-light)]">{t('dashboard_no_booking_requests')}</p>
                    </div>
                )}
            </div>

             <div>
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4">{t('dashboard_my_outing_requests')}</h3>
                {myOutingRequests.length > 0 ? (
                    <div className="space-y-4">
                        {myOutingRequests.map((req, idx) => (
                            <div key={idx} className="bg-[var(--bg-card)] p-4 rounded-lg shadow-sm border border-[var(--border-color)] flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-[var(--text-primary)]">{req.outingTitle}</h4>
                                    <p className="text-sm text-[var(--text-secondary)]">{formatDateSafe(req.date)} • {req.childName}</p>
                                </div>
                                <StatusTag status={req.status} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center bg-[var(--bg-card-subtle)] rounded-xl border-2 border-dashed border-[var(--border-color)] p-8">
                        <p className="text-[var(--text-light)]">{t('dashboard_no_outing_requests')}</p>
                    </div>
                )}
             </div>
        </div>

        <div className="mt-8">
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4">{t('dashboard_my_skill_requests')}</h3>
             {mySkillRequests.length > 0 ? (
                <div className="space-y-4">
                    {mySkillRequests.map(req => (
                         <div key={req.id} className="bg-[var(--bg-card)] p-4 rounded-lg shadow-sm border border-[var(--border-color)] flex justify-between items-center">
                             <div>
                                 <h4 className="font-bold text-[var(--text-primary)]">{req.title}</h4>
                                 <p className="text-sm text-[var(--text-secondary)]">{t('skill_card_view_offers', { count: req.offers.length })}</p>
                             </div>
                             <div className="flex gap-2">
                                <button onClick={onViewSkillMarketplace} className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full">View</button>
                                <StatusTag status={req.status} />
                             </div>
                         </div>
                    ))}
                </div>
            ) : (
                 <div className="text-center bg-[var(--bg-card-subtle)] rounded-xl border-2 border-dashed border-[var(--border-color)] p-8">
                    <p className="text-[var(--text-light)]">{t('dashboard_no_skill_requests')}</p>
                </div>
            )}
        </div>

        <div className="mt-8">
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4">{t('dashboard_hosted_outings_title')}</h3>
            {hostedOutings.length > 0 ? (
                <div className="space-y-4">
                    {hostedOutings.map(outing => (
                        <HostedOutingCard
                            key={outing.id}
                            outing={outing}
                            onUpdateRequest={(parentId, status) => onUpdateOutingRequestStatus(outing.id, parentId, status)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center bg-[var(--bg-card-subtle)] rounded-xl border-2 border-dashed border-[var(--border-color)] p-8">
                    <p className="text-[var(--text-light)]">{t('dashboard_no_hosted_outings')}</p>
                </div>
            )}
        </div>

        <div className="mt-8">
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
        </div>
      </>
    );
};

const NannyBookingCard: React.FC<{ request: EnrichedBookingRequest, onUpdate: DashboardScreenProps['onUpdateBookingStatus'], onOpenChat: (req: BookingRequest) => void }> = ({ request, onUpdate, onOpenChat }) => {
    const { t } = useLanguage();
    const isPending = request.status === 'pending';
    return (
        <div className="bg-[var(--bg-card)] p-4 rounded-lg shadow-sm border border-[var(--border-color)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-grow">
                    <h4 className="font-bold text-[var(--text-primary)]">{t('booking_request_from')} {request.parentName}</h4>
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
                            <BookingRequestStatus status={request.status} />
                            {request.status === 'accepted' && (
                                <button onClick={() => onOpenChat(request)} className="text-xs bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white px-3 py-1 rounded-full transition-colors">
                                    {t('activity_card_chat')}
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

const NannyTaskItem: React.FC<{ task: Task, onUpdateStatus: DashboardScreenProps['onUpdateTaskStatus'] }> = ({ task, onUpdateStatus }) => {
    const { t } = useLanguage();
    const isCompleted = task.status === 'completed';
    const dueDate = new Date(task.dueDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isOverdue = dueDate < today && !isCompleted;

    const handleToggle = () => {
        onUpdateStatus(task.id, isCompleted ? 'pending' : 'completed');
    };

    return (
        <div className="bg-[var(--bg-card)] p-3 rounded-lg shadow-sm border border-[var(--border-color)] flex items-start gap-4">
            <input 
                type="checkbox" 
                checked={isCompleted} 
                onChange={handleToggle} 
                className="h-5 w-5 mt-1 rounded border-gray-300 text-[var(--accent-primary)] focus:ring-[var(--ring-accent)] cursor-pointer flex-shrink-0"
            />
            <div className="flex-grow">
                <div className="flex items-center justify-between">
                     <p className={`${isCompleted ? 'line-through text-[var(--text-light)]' : 'text-[var(--text-primary)]'}`}>{task.description}</p>
                     <StatusTag status={task.status} />
                </div>
                <p className={`text-xs font-medium mt-1 ${isOverdue ? 'text-[var(--accent-red)]' : 'text-[var(--text-light)]'}`}>
                    {isOverdue ? t('task_overdue') + ': ' : t('task_due_on', {date: ''})} {formatDateSafe(task.dueDate)}
                </p>
            </div>
        </div>
    );
};


const NannyDashboard: React.FC<DashboardScreenProps> = ({ user, bookingRequests, userTasks, onUpdateBookingStatus, onUpdateTaskStatus, onOpenBookingChat }) => {
    const { t } = useLanguage();
    const profileComplete = !!user.profile;
    const pendingRequests = bookingRequests.filter(req => req.status === 'pending');
    const pastRequests = bookingRequests.filter(req => req.status !== 'pending');
    
    return (
        <>
            <div className="bg-[var(--bg-card-subtle)] rounded-xl border border-[var(--border-color)] p-6 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                 <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">
                        {profileComplete ? t('dashboard_nanny_profile_live') : t('dashboard_nanny_complete_profile')}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                        {profileComplete ? t('dashboard_nanny_profile_live_desc') : t('dashboard_nanny_complete_profile_desc')}
                    </p>
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
                            {pastRequests.map(req => <NannyBookingCard key={req.id} request={req} onUpdate={onUpdateBookingStatus} onOpenChat={onOpenBookingChat} />)}
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
                            {userTasks.map(task => <NannyTaskItem key={task.id} task={task} onUpdateStatus={onUpdateTaskStatus} />)}
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
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                    {user.subscription?.status === 'active' ? t('dashboard_premium') : t('dashboard_user')}
                </span>
                {user.subscription?.status === 'active' && <span className="text-yellow-500">👑</span>}
            </div>
        </div>
      </div>

      {user.userType === 'parent' ? <ParentDashboard {...props} /> : <NannyDashboard {...props} />}
      
      <div className="mt-12 pt-6 border-t border-[var(--border-color)] flex justify-center">
        <button
            onClick={onLogout}
            className="text-red-500 hover:text-red-700 font-medium transition-colors"
        >
            {t('button_logout')}
        </button>
      </div>
    </div>
  );
};

export default DashboardScreen;