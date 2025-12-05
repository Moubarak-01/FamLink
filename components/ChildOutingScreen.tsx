// components/ChildOutingScreen.tsx

import React, { useState, useMemo } from 'react';
import { SharedOuting, User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import Calendar from './Calendar';
import { outingService } from '../services/outingService'; // Ensure this service is imported

interface ChildOutingScreenProps {
  user: User;
  outings: SharedOuting[];
  onBack: () => void;
  onCreateOuting: () => void;
  onRequestJoin: (outing: SharedOuting) => void;
  onOpenChat: (outing: SharedOuting) => void;
  onDeleteOuting: (id: string) => void; // New prop for delete
  onRateHost?: (hostId: string) => void;
  refreshData?: () => void;
}

// Helper to safely get host name
const getHostName = (hostId: any, hostName?: string) => {
    if (typeof hostId === 'object' && hostId?.fullName) return hostId.fullName;
    if (hostName) return hostName;
    return 'Unknown Host';
};

// Helper to safely get host photo
const getHostPhoto = (hostId: any, hostPhoto?: string) => {
     if (typeof hostId === 'object' && hostId?.photo) return hostId.photo;
     if (hostPhoto) return hostPhoto;
     return 'https://i.pravatar.cc/150?u=default';
};

const OutingCard: React.FC<{ 
    outing: SharedOuting, 
    currentUserId: string, 
    onRequestJoin: (outing: SharedOuting) => void, 
    onChat: (outing: SharedOuting) => void,
    onDelete: (id: string) => void
}> = ({ outing, currentUserId, onRequestJoin, onChat, onDelete }) => {
    const { t } = useLanguage();
    
    // 1. CRITICAL FIX: Safety check for requests array
    const requests = outing.requests || [];
    
    // Check if current user is the host
    const hostIdStr = typeof outing.hostId === 'object' ? outing.hostId._id : outing.hostId;
    const isHost = hostIdStr === currentUserId;

    // Check if current user has already requested/joined
    // Using the safe 'requests' array defined above
    const myRequest = requests.find(r => r.parentId === currentUserId);
    const hasRequested = !!myRequest;
    const isAccepted = myRequest?.status === 'accepted';
    
    // Enable chat if you are the host OR if you have an accepted request
    const canChat = isHost || isAccepted;

    const displayHostName = getHostName(outing.hostId, outing.hostName);
    const displayHostPhoto = getHostPhoto(outing.hostId, outing.hostPhoto);

    // Calculate slots
    // Assuming accepted requests consume slots. 
    // (Logic can be adjusted if 'requests' count vs 'children' count matters)
    const acceptedCount = requests.filter(r => r.status === 'accepted').length;
    const slotsLeft = Math.max(0, outing.maxChildren - acceptedCount);

    return (
        <div className="bg-[var(--bg-card)] rounded-lg shadow-md overflow-hidden border border-[var(--border-color)] relative group transition-all hover:shadow-lg">
            {/* Delete Button - Visible only to host on hover */}
            {isHost && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(outing.id); }}
                    className="absolute top-2 right-2 bg-white p-1.5 rounded-full text-red-500 shadow-sm hover:bg-red-50 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Outing"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            )}

            {/* Image Display */}
            {outing.image && (
                <div className="w-full h-48 bg-gray-100">
                    <img src={outing.image} alt={outing.title} className="w-full h-full object-cover" />
                </div>
            )}

            <div className="p-5">
                <div className="flex items-start gap-4">
                    <img src={displayHostPhoto} alt={displayHostName} className="w-12 h-12 rounded-full object-cover border-2 border-teal-100" />
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold text-[var(--text-primary)]">{outing.title}</h3>
                                <p className="text-sm text-[var(--text-secondary)] mt-1">{t('outing_card_hosted_by', { name: displayHostName })}</p>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                                <p className="text-sm font-bold text-[var(--text-primary)]">
                                    {new Date(outing.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </p>
                                <p className="text-sm text-[var(--text-secondary)]">{outing.time}</p>
                            </div>
                        </div>
                        
                        <p className="text-[var(--text-secondary)] mt-3 text-sm line-clamp-2">{outing.description}</p>
                        
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded-md border border-teal-100">
                                📍 {outing.location}
                            </span>
                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100">
                                💰 {outing.costDetails}
                            </span>
                            {outing.liveLocationEnabled && (
                                <span className="bg-red-50 text-red-600 px-2 py-1 rounded-md border border-red-100 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Live Location
                                </span>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                                <p className={`text-xs font-bold ${slotsLeft > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {slotsLeft > 0 ? t('outing_card_slots_available', { count: slotsLeft }) : 'Full'}
                                </p>
                                {hasRequested && (
                                    <p className="text-xs text-[var(--text-light)] mt-1">
                                        Status: <span className={`capitalize font-medium ${myRequest?.status === 'accepted' ? 'text-green-600' : 'text-yellow-600'}`}>{myRequest?.status}</span>
                                    </p>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                {/* Chat Button */}
                                <button 
                                    onClick={() => onChat(outing)}
                                    disabled={!canChat}
                                    className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                    title={!canChat ? "Join and get accepted to chat" : ""}
                                >
                                    <span>💬</span> {t('activity_card_chat')}
                                </button>

                                {/* Join / Status Button */}
                                {!isHost && (
                                    <button 
                                        onClick={() => onRequestJoin(outing)} 
                                        disabled={hasRequested || slotsLeft === 0} 
                                        className={`font-bold py-1.5 px-4 rounded-full text-xs shadow-sm transition-transform active:scale-95 
                                            ${hasRequested 
                                                ? 'bg-gray-100 text-gray-500 cursor-default' 
                                                : 'bg-teal-500 hover:bg-teal-600 text-white hover:scale-105'
                                            }`}
                                    >
                                        {hasRequested ? t('outing_card_requested') : t('outing_card_request_to_join')}
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

const ChildOutingScreen: React.FC<ChildOutingScreenProps> = ({ 
    user, outings, onBack, onCreateOuting, onRequestJoin, onOpenChat, onDeleteOuting, refreshData 
}) => {
    const { t } = useLanguage();
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const handleClearAll = async () => {
        if(window.confirm("Delete ALL outings? This cannot be undone.")) {
            try {
                await outingService.deleteAll();
                if (refreshData) refreshData();
            } catch (e) { 
                alert("Failed to clear outings."); 
            }
        }
    };

    const displayedOutings = useMemo(() => {
        if (viewMode === 'calendar' && selectedDate) {
            return outings.filter(o => o.date === selectedDate);
        }
        return outings;
    }, [outings, viewMode, selectedDate]);
    
    const outingDates = useMemo(() => outings.map(o => o.date), [outings]);

    return (
        <div className="p-4 sm:p-8">
            <div className="flex justify-between items-center mb-4">
                <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1">
                    <span>←</span> {t('button_back')}
                </button>
                
                {/* Dev Only: Clear All Button */}
                <button 
                    onClick={handleClearAll} 
                    className="text-xs text-red-500 hover:text-red-700 font-bold border border-red-200 bg-red-50 px-3 py-1.5 rounded-md hover:bg-red-100 transition-colors"
                >
                    Clear All
                </button>
            </div>

            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{t('child_outings_title')}</h2>
                <p className="text-[var(--text-secondary)] max-w-xl mx-auto">{t('child_outings_subtitle')}</p>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                 <button 
                    onClick={onCreateOuting}
                    className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-transform hover:scale-105 flex items-center gap-2"
                >
                    <span>➕</span> {t('button_create_outing')}
                </button>
                
                <div className="flex items-center bg-[var(--bg-card-subtle)] rounded-lg p-1 border border-[var(--border-color)]">
                    <button 
                        onClick={() => setViewMode('list')} 
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'list' ? 'bg-[var(--bg-card)] shadow-sm text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        {t('community_view_list')}
                    </button>
                    <button 
                        onClick={() => setViewMode('calendar')} 
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'calendar' ? 'bg-[var(--bg-card)] shadow-sm text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        {t('community_view_calendar')}
                    </button>
                </div>
            </div>
            
            {viewMode === 'calendar' && (
                <div className="mb-8 max-w-md mx-auto">
                    <Calendar 
                        availableDates={outingDates} 
                        isEditable={false}
                        onDateChange={(date) => setSelectedDate(prev => prev === date ? null : date)}
                    />
                    {selectedDate && (
                        <p className="text-center mt-2 text-sm text-[var(--text-secondary)]">
                            Showing events for: <span className="font-bold">{selectedDate}</span>
                        </p>
                    )}
                </div>
            )}

            <div className="space-y-6">
                {displayedOutings.length > 0 ? (
                    displayedOutings.map(outing => (
                        <OutingCard 
                            key={outing.id} 
                            outing={outing} 
                            currentUserId={user.id} 
                            onRequestJoin={onRequestJoin} 
                            onChat={onOpenChat}
                            onDelete={onDeleteOuting}
                        />
                    ))
                ) : (
                    <div className="text-center bg-[var(--bg-card-subtle)] rounded-xl border-2 border-dashed border-[var(--border-color)] p-12">
                        <span className="text-4xl block mb-2">🌳</span>
                        <p className="text-[var(--text-light)] font-medium">
                            {selectedDate 
                                ? t('community_no_activities_for_date') 
                                : 'No outings created yet. Be the first to plan one!'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChildOutingScreen;