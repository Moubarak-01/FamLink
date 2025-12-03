import React, { useMemo, useState } from 'react';
import { Activity, User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import Calendar from './Calendar';

interface CommunityActivitiesScreenProps {
    user: User;
    activities: Activity[];
    onBack: () => void;
    onCreateActivity: () => void;
    onJoinActivity: (activityId: string) => void;
    onOpenChat: (activity: Activity) => void;
}

const ActivityCard: React.FC<{ activity: Activity, currentUserId: string, onJoin: (id: string) => void, onChat: (activity: Activity) => void }> = ({ activity, currentUserId, onJoin, onChat }) => {
    const { t } = useLanguage();
    const isParticipant = activity.participants.includes(currentUserId);
    const isHost = activity.hostId === currentUserId;

    return (
        <div className="bg-[var(--bg-card)] rounded-lg shadow-md overflow-hidden border border-[var(--border-color)]">
            <div className="p-5">
                <div className="flex items-start gap-4">
                    <img src={activity.hostPhoto} alt={activity.hostName} className="w-12 h-12 rounded-full object-cover" />
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full capitalize">
                                    {t(`activity_cat_${activity.category}`)}
                                </span>
                                <p className="text-[var(--text-secondary)] mt-2 text-sm">{activity.description}</p>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                                <p className="text-sm font-bold text-[var(--text-primary)]">{new Date(activity.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                <p className="text-sm text-[var(--text-secondary)]">{activity.time}</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                                <p className="text-xs text-[var(--text-light)]">{t('activity_card_hosted_by', { name: activity.hostName })}</p>
                                <p className="text-xs text-[var(--text-light)] font-medium">📍 {activity.location}</p>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button 
                                  onClick={() => onChat(activity)}
                                  disabled={!isParticipant}
                                  className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:text-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isParticipant ? `${t('activity_card_chat')} (${activity.participants.length})` : t('activity_card_join_to_chat')}
                                </button>
                                {!isHost && (
                                    <button onClick={() => onJoin(activity.id)} disabled={isParticipant} className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-bold py-1.5 px-4 rounded-full text-xs disabled:opacity-50">
                                        {isParticipant ? t('activity_card_joined') : t('activity_card_join')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const CommunityActivitiesScreen: React.FC<CommunityActivitiesScreenProps> = ({ user, activities, onBack, onCreateActivity, onJoinActivity, onOpenChat }) => {
    const { t } = useLanguage();
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    
    const recommendedActivities = useMemo(() => {
        if (!user.location && !user.interests?.length) return [];

        return [...activities]
            .map(activity => {
                let score = 0;
                if (user.location && activity.location.includes(user.location)) {
                    score += 10;
                }
                if (user.interests?.includes(activity.category)) {
                    score += 5;
                }
                // Bonus for future activities
                if (new Date(activity.date) >= new Date()) {
                    score += 1;
                }
                return { ...activity, score };
            })
            .filter(activity => activity.score > 0 && activity.hostId !== user.id)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
    }, [activities, user]);

    const displayedActivities = useMemo(() => {
        if (viewMode === 'calendar' && selectedDate) {
            return activities.filter(act => act.date === selectedDate);
        }
        return activities;
    }, [activities, viewMode, selectedDate]);
    
    const activityDates = useMemo(() => activities.map(a => a.date), [activities]);

    return (
        <div className="p-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{t('community_activities_title')}</h2>
                <p className="text-[var(--text-secondary)] max-w-xl mx-auto">{t('community_activities_subtitle')}</p>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                 <button 
                    onClick={onCreateActivity}
                    className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-transform hover:scale-105"
                >
                    {t('button_create_activity')}
                </button>
                <div className="flex items-center bg-[var(--bg-card-subtle)] rounded-lg p-1">
                    <button onClick={() => setViewMode('list')} className={`px-4 py-1 text-sm font-semibold rounded-md ${viewMode === 'list' ? 'bg-[var(--bg-card)] shadow text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{t('community_view_list')}</button>
                    <button onClick={() => setViewMode('calendar')} className={`px-4 py-1 text-sm font-semibold rounded-md ${viewMode === 'calendar' ? 'bg-[var(--bg-card)] shadow text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{t('community_view_calendar')}</button>
                </div>
            </div>
            
            {recommendedActivities.length > 0 && viewMode === 'list' && !selectedDate && (
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t('community_recommendations_title')}</h3>
                    <div className="space-y-6">
                        {recommendedActivities.map(activity => <ActivityCard key={activity.id} activity={activity} currentUserId={user.id} onJoin={onJoinActivity} onChat={onOpenChat} />)}
                    </div>
                     <hr className="my-8 border-[var(--border-color)]" />
                </div>
            )}
            
            {viewMode === 'calendar' && (
                <div className="mb-8">
                    <Calendar 
                        availableDates={activityDates} 
                        isEditable={false}
                        onDateChange={(date) => setSelectedDate(prev => prev === date ? null : date)}
                    />
                </div>
            )}

            <div className="space-y-6">
                {displayedActivities.length > 0 ? (
                    displayedActivities.map(activity => <ActivityCard key={activity.id} activity={activity} currentUserId={user.id} onJoin={onJoinActivity} onChat={onOpenChat} />)
                ) : (
                    <div className="text-center bg-[var(--bg-card-subtle)] rounded-xl border-2 border-dashed border-[var(--border-color)] p-8">
                        <p className="text-[var(--text-light)] font-medium">
                            {selectedDate ? t('community_no_activities_for_date') : 'No activities yet. Be the first to create one!'}
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--border-color)] flex justify-start">
                <button
                onClick={onBack}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-6 rounded-full"
                >
                {t('button_back_dashboard')}
                </button>
            </div>
        </div>
    );
};

export default CommunityActivitiesScreen;