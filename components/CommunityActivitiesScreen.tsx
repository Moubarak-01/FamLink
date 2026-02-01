import React, { useMemo, useState } from 'react';
import { Activity, User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import Calendar from './Calendar';
import { formatCategoryName, getCategoryColor } from '../utils/textUtils';
import DeleteButton from './DeleteButton';

interface CommunityActivitiesScreenProps {
    user: User;
    activities: Activity[];
    onBack: () => void;
    onCreateActivity: () => void;
    onJoinActivity: (activityId: string) => void;
    onOpenChat: (activity: Activity) => void;
    onDeleteActivity: (id: string) => void;
    onDeleteAllActivities: () => void;
}

const getHostName = (hostId: any, hostName?: string) => {
    if (typeof hostId === 'object' && hostId?.fullName) return hostId.fullName;
    if (hostName) return hostName;
    return 'Unknown User';
};

const getHostPhoto = (hostId: any, hostPhoto?: string) => {
    if (typeof hostId === 'object' && hostId?.photo) return hostId.photo;
    if (hostPhoto) return hostPhoto;
    return 'https://i.pravatar.cc/150?u=default';
};

const ActivityCard: React.FC<{ activity: Activity, currentUserId: string, onJoin: (id: string) => void, onChat: (activity: Activity) => void, onDelete: (id: string) => void }> = ({ activity, currentUserId, onJoin, onChat, onDelete }) => {
    const { t } = useLanguage();
    const isParticipant = activity.participants.includes(currentUserId);
    const hasRequested = activity.requests?.some(r => r.userId === currentUserId && (r.status === 'pending' || r.status === 'accepted'));
    // If accepted, they should be in participants. If pending, they are requested.

    // FIX: Safely handle null hostId (e.g. deleted user)
    const hostIdStr = (activity.hostId && typeof activity.hostId === 'object') ? activity.hostId._id : (activity.hostId as string || '');
    const isHost = hostIdStr === currentUserId;

    const displayHostName = getHostName(activity.hostId, activity.hostName);
    const displayHostPhoto = getHostPhoto(activity.hostId, activity.hostPhoto);

    return (
        <div className="bg-[var(--bg-card)] rounded-lg shadow-md overflow-hidden border border-[var(--border-color)] relative group">
            {isHost && (
                <DeleteButton
                    onDelete={() => onDelete(activity.id)}
                    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                />
            )}

            {activity.image && (
                <div className="w-full h-48 bg-gray-100">
                    <img src={activity.image} alt={activity.category} className="w-full h-full object-cover" />
                </div>
            )}

            <div className="p-5">
                <div className="flex items-start gap-4">
                    <img src={displayHostPhoto} alt={displayHostName} className="w-12 h-12 rounded-full object-cover border-2 border-purple-100" />
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${getCategoryColor(activity.category)}`}>
                                    {formatCategoryName(activity.category)}
                                </span>
                                <p className="text-[var(--text-secondary)] mt-2 text-sm">{activity.description}</p>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4 mr-8">
                                <p className="text-sm font-bold text-[var(--text-primary)]">{new Date(activity.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                <p className="text-sm text-[var(--text-secondary)]">{activity.time}</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                                <p className="text-xs text-[var(--text-light)]">Hosted by <span className="font-medium text-[var(--text-primary)]">{displayHostName}</span></p>
                                <p className="text-xs text-[var(--text-light)] font-medium">📍 {activity.location}</p>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                    onClick={() => onChat(activity)}
                                    disabled={!isParticipant}
                                    className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:text-gray-400 disabled:cursor-not-allowed mr-2"
                                >
                                    {t('activity_card_chat')} {activity.participants.length > 1 && `(${activity.participants.length})`}
                                </button>
                                {!isHost && (
                                    <button
                                        onClick={() => onJoin(activity.id)}
                                        disabled={isParticipant || hasRequested}
                                        className={`${isParticipant ? 'bg-green-500' :
                                            hasRequested ? 'bg-yellow-500' :
                                                'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)]'
                                            } text-white font-bold py-1.5 px-4 rounded-full text-xs disabled:opacity-80 transition-colors`}
                                    >
                                        {isParticipant ? t('activity_card_joined') :
                                            hasRequested ? 'Request Sent' :
                                                activity.privacy === 'private' ? 'Request to Join' :
                                                    t('activity_card_join')}
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

const CommunityActivitiesScreen: React.FC<CommunityActivitiesScreenProps> = ({ user, activities, onBack, onCreateActivity, onJoinActivity, onOpenChat, onDeleteActivity, onDeleteAllActivities }) => {
    const { t } = useLanguage();
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleClearAll = () => {
        if (window.confirm("Delete ALL activities? This cannot be undone.")) {
            onDeleteAllActivities();
        }
    };

    const displayedActivities = useMemo(() => {
        let filtered = activities;

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(act =>
                act.description.toLowerCase().includes(query) ||
                act.category.toLowerCase().includes(query) ||
                act.location.toLowerCase().includes(query)
            );
        }

        if (viewMode === 'calendar' && selectedDate) {
            filtered = filtered.filter(act => act.date === selectedDate);
        }
        return filtered;
    }, [activities, viewMode, selectedDate, searchQuery]);

    const activityDates = useMemo(() => activities.map(a => a.date), [activities]);

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-4">
                <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-800">← Back</button>
                <button onClick={handleClearAll} className="text-xs text-red-500 hover:text-red-700 font-bold border border-red-200 bg-red-50 px-3 py-1 rounded-md">Clear All</button>
            </div>

            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{t('community_activities_title')}</h2>
                <p className="text-[var(--text-secondary)] max-w-xl mx-auto">{t('community_activities_subtitle')}</p>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                <div className="relative w-full max-w-md">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Find playdates, tennis partners, or local walks..."
                        className="w-full px-4 py-3 pl-10 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-[var(--text-primary)]"
                    />
                    <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
                </div>
                <button
                    onClick={onCreateActivity}
                    className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-transform hover:scale-105 whitespace-nowrap"
                >
                    {t('button_create_activity')}
                </button>
                <div className="flex items-center bg-[var(--bg-card-subtle)] rounded-lg p-1">
                    <button onClick={() => setViewMode('list')} className={`px-4 py-1 text-sm font-semibold rounded-md ${viewMode === 'list' ? 'bg-[var(--bg-card)] shadow text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{t('community_view_list')}</button>
                    <button onClick={() => setViewMode('calendar')} className={`px-4 py-1 text-sm font-semibold rounded-md ${viewMode === 'calendar' ? 'bg-[var(--bg-card)] shadow text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{t('community_view_calendar')}</button>
                </div>
            </div>

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
                    displayedActivities.map(activity => (
                        <ActivityCard
                            key={activity.id}
                            activity={activity}
                            currentUserId={user.id}
                            onJoin={onJoinActivity}
                            onChat={onOpenChat}
                            onDelete={onDeleteActivity}
                        />
                    ))
                ) : (
                    <div className="text-center bg-[var(--bg-card-subtle)] rounded-xl border-2 border-dashed border-[var(--border-color)] p-8">
                        <p className="text-[var(--text-light)] font-medium text-lg">
                            {selectedDate ? t('community_no_activities_for_date') : "No activities yet! Why not be the first to host a neighborhood walk?"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommunityActivitiesScreen;