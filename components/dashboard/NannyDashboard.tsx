import React from 'react';
import { User, BookingRequest, Task } from '../../types';
import { NannyBookingCard, InteractiveTaskItem as NannyTaskItem } from './DashboardWidgets';
import { useLanguage } from '../../contexts/LanguageContext';

interface NannyDashboardProps {
    user: User;
    bookingRequests: BookingRequest[];
    userTasks: Task[];
    onUpdateBookingStatus: (id: string, status: 'accepted' | 'declined') => void;
    onUpdateTaskStatus: (id: string, status: 'pending' | 'completed') => void;
    onOpenBookingChat: (req: BookingRequest) => void;
    onCancelBooking: (id: string) => void; // Used as 'hide' locally
}

const NannyDashboard: React.FC<NannyDashboardProps> = ({ user, bookingRequests, userTasks, onUpdateBookingStatus, onUpdateTaskStatus, onOpenBookingChat, onCancelBooking }) => {
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

export default NannyDashboard;