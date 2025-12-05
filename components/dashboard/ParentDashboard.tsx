import React from 'react';
import { User, BookingRequest, Task, SharedOuting, SkillRequest } from '../../types';
import { AddedNannyCard, ParentBookingCard, StatusTag, formatDateSafe, InteractiveTaskItem } from './DashboardWidgets';
import { useLanguage } from '../../contexts/LanguageContext';

interface ParentDashboardProps {
    user: User;
    addedNannies: User[];
    bookingRequests: BookingRequest[];
    allTasks: Task[];
    sharedOutings: SharedOuting[];
    skillRequests: SkillRequest[];
    onRemoveNanny: (id: string) => void;
    onContactNanny: (nanny: User) => void;
    onViewNanny: (id: string) => void;
    onRateNanny: (nanny: User) => void;
    onOpenTaskModal: (nanny: User) => void;
    onKeepTask: (id: string) => void;
    onSearchNannies: () => void;
    onViewActivities: () => void;
    onViewOutings: () => void;
    onViewSkillMarketplace: () => void;
    onClearAllBookings: () => void;
    onUpdateTaskStatus: (id: string, status: 'pending' | 'completed') => void;
    onDeleteTask: (id: string) => void;
    onOpenBookingChat: (request: BookingRequest) => void; // Add this
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ 
    user, addedNannies, bookingRequests, allTasks, sharedOutings, skillRequests, 
    onRemoveNanny, onContactNanny, onViewNanny, onRateNanny, onOpenTaskModal, onKeepTask, 
    onSearchNannies, onViewActivities, onViewOutings, onViewSkillMarketplace, onClearAllBookings, 
    onUpdateTaskStatus, onDeleteTask, onOpenBookingChat
}) => {
    const { t, language } = useLanguage();
    const myOutingRequests = sharedOutings.flatMap(o => o.requests.filter(r => r.parentId === user.id).map(r => ({ ...r, outingTitle: o.title, date: o.date })));
    const mySkillRequests = skillRequests?.filter(s => s.requesterId === user.id) || [];
    const myTasks = allTasks.filter(t => t.parentId === user.id);

    return (
        <>
            {/* Navigation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* ... (Keep navigation cards as is) ... */}
                <div className="bg-[var(--bg-pink-card)] rounded-xl border border-[var(--border-pink-card)] p-5 flex flex-col justify-between">
                    <div><h4 className="text-lg font-semibold text-[var(--text-pink-card-header)] mb-1">{t('dashboard_find_nanny_card_title')}</h4><p className="text-sm text-[var(--text-pink-card-body)] mb-4">{t('dashboard_find_nanny_card_subtitle')}</p></div><button onClick={onSearchNannies} className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-bold py-2 rounded-lg transition-colors text-sm">{t('button_search_nannies')}</button>
                </div>
                <div className="bg-[var(--bg-purple-card)] rounded-xl border border-[var(--border-purple-card)] p-5 flex flex-col justify-between">
                    <div><h4 className="text-lg font-semibold text-[var(--text-purple-card-header)] mb-1">{t('dashboard_community_title')}</h4><p className="text-sm text-[var(--text-purple-card-body)] mb-4">{t('dashboard_community_subtitle')}</p></div><button onClick={onViewActivities} className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 rounded-lg transition-colors text-sm">{t('dashboard_community_button')}</button>
                </div>
                <div className="bg-[var(--bg-teal-card)] rounded-xl border border-[var(--border-teal-card)] p-5 flex flex-col justify-between">
                    <div><h4 className="text-lg font-semibold text-[var(--text-teal-card-header)] mb-1">{t('dashboard_child_sharing_title')}</h4><p className="text-sm text-[var(--text-teal-card-body)] mb-4">{t('dashboard_child_sharing_subtitle')}</p></div><button onClick={onViewOutings} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 rounded-lg transition-colors text-sm">{t('dashboard_child_sharing_button')}</button>
                </div>
                <div className="bg-[var(--bg-blue-card)] rounded-xl border border-[var(--border-blue-card)] p-5 flex flex-col justify-between">
                    <div><h4 className="text-lg font-semibold text-[var(--text-blue-card-header)] mb-1">{t('dashboard_skill_sharing_title')}</h4><p className="text-sm text-[var(--text-blue-card-body)] mb-4">{t('dashboard_skill_sharing_subtitle')}</p></div><button onClick={onViewSkillMarketplace} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition-colors text-sm">{t('dashboard_skill_sharing_button')}</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* My Booking Requests */}
                 <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold text-[var(--text-primary)]">{t('dashboard_my_booking_requests')}</h3>
                        {bookingRequests.length > 0 && (
                            <button onClick={onClearAllBookings} className="text-xs text-red-500 hover:text-red-700 underline">Clear All History</button>
                        )}
                    </div>
                    {bookingRequests.length > 0 ? (
                        <div className="space-y-4">
                            {bookingRequests.map(req => (
                                <ParentBookingCard 
                                    key={req.id} 
                                    request={req} 
                                    onChat={onOpenBookingChat} // WIRED UP HERE
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center bg-[var(--bg-card-subtle)] rounded-xl border-2 border-dashed border-[var(--border-color)] p-8">
                            <p className="text-[var(--text-light)]">{t('dashboard_no_booking_requests')}</p>
                        </div>
                    )}
                </div>

                {/* My Added Nannies */}
                <div>
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4">{t('dashboard_my_added_nannies')}</h3>
                    {addedNannies.length > 0 ? (
                        <div className="space-y-4">
                            {addedNannies.map(nanny => (
                                <AddedNannyCard 
                                    key={nanny.id} 
                                    nanny={nanny} 
                                    currentUser={user} 
                                    tasks={allTasks.filter(t => t.nannyId === nanny.id)} 
                                    onRemove={onRemoveNanny} 
                                    onContact={onContactNanny} 
                                    onView={onViewNanny} 
                                    onRate={onRateNanny} 
                                    onAddTask={() => onOpenTaskModal(nanny)} 
                                    onKeepTask={onKeepTask}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center bg-[var(--bg-card-subtle)] rounded-xl border-2 border-dashed border-[var(--border-color)] p-8">
                            <p className="text-[var(--text-light)]">{t('dashboard_no_added_nannies')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Task Management */}
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
                        <p className="text-[var(--text-light)]">You haven't assigned any tasks yet.</p>
                    </div>
                )}
            </div>

            {/* Requests */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                 <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t('dashboard_my_outing_requests')}</h3>
                    {myOutingRequests.length > 0 ? (
                        <div className="space-y-4">
                            {myOutingRequests.map((req, idx) => (
                                <div key={idx} className="bg-[var(--bg-card)] p-4 rounded-lg shadow-sm border border-[var(--border-color)] flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-[var(--text-primary)]">{req.outingTitle}</h4>
                                        <p className="text-sm text-[var(--text-secondary)]">{formatDateSafe(req.date, language)} • {req.childName}</p>
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

                <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t('dashboard_my_skill_requests')}</h3>
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
            </div>
        </>
    );
};

export default ParentDashboard;