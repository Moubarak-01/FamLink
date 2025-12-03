
import React from 'react';
import { SharedOuting, User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ChildOutingScreenProps {
    user: User;
    outings: (SharedOuting & { isHostVerified?: boolean })[];
    onBack: () => void;
    onCreateOuting: () => void;
    onRequestJoin: (outing: SharedOuting) => void;
    onOpenChat: (outing: SharedOuting) => void;
    onRateHost?: (hostId: string) => void;
}

const OutingCard: React.FC<{ outing: SharedOuting & { isHostVerified?: boolean }, currentUserId: string, onRequestJoin: (outing: SharedOuting) => void, onOpenChat: (outing: SharedOuting) => void, onRateHost?: (hostId: string) => void }> = ({ outing, currentUserId, onRequestJoin, onOpenChat, onRateHost }) => {
    const { t } = useLanguage();
    const isHost = outing.hostId === currentUserId;
    const acceptedRequests = outing.requests.filter(r => r.status === 'accepted').length;
    const slotsAvailable = outing.maxChildren - acceptedRequests;
    
    // Check if current user has any active requests (pending or accepted)
    const myRequests = outing.requests.filter(r => r.parentId === currentUserId);
    const hasPending = myRequests.some(r => r.status === 'pending');
    const isAccepted = myRequests.some(r => r.status === 'accepted');
    const hasAnyRequest = hasPending || isAccepted;

    const canChat = isHost || isAccepted;

    // Determine logic for requesting another child
    let showRequestButton = false;
    let buttonText = '';

    if (!isHost && slotsAvailable > 0) {
        if (!hasAnyRequest) {
            showRequestButton = true;
            buttonText = t('outing_card_request_to_join');
        } else {
            // Already requested. Only allow another request if more than 1 slot available.
            if (slotsAvailable > 1) {
                showRequestButton = true;
                buttonText = t('outing_card_request_another');
            }
        }
    }
    
    return (
        <div className="bg-[var(--bg-card)] rounded-lg shadow-md overflow-hidden border border-[var(--border-color)]">
            <div className="p-5">
                <div className="flex items-start gap-4">
                    <div className="relative">
                        <img src={outing.hostPhoto} alt={outing.hostName} className="w-12 h-12 rounded-full object-cover" />
                        {outing.isHostVerified && (
                            <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5" title="Verified Parent">
                                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </span>
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg text-[var(--text-primary)]">{outing.title}</h3>
                                <p className="text-xs text-[var(--text-light)] mb-2">{t('outing_card_hosted_by', { name: outing.hostName })}</p>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                                <p className="text-sm font-bold text-[var(--text-primary)]">{new Date(outing.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                <p className="text-sm text-[var(--text-secondary)]">{outing.time}</p>
                            </div>
                        </div>
                        <p className="text-[var(--text-secondary)] mt-1 text-sm">{outing.description}</p>
                        <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                                <p className="text-xs text-[var(--text-light)] font-medium">📍 {outing.location}</p>
                                <p className="text-xs text-[var(--text-light)] mt-1">💰 {outing.costDetails}</p>
                                {outing.liveLocationEnabled && (
                                    <p className="text-xs text-green-600 flex items-center mt-1 font-semibold">
                                        <span className="mr-1 relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        Live Location Enabled
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap justify-end">
                                {canChat && (
                                    <button 
                                        onClick={() => onOpenChat(outing)}
                                        className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] mr-2"
                                    >
                                        {t('activity_card_chat')}
                                    </button>
                                )}
                                
                                {(isAccepted || isHost) && outing.liveLocationEnabled && (
                                    <button className="text-xs bg-green-100 text-green-700 hover:bg-green-200 font-bold py-1 px-2 rounded-lg" title="Track Live Location">
                                        📍 Track
                                    </button>
                                )}

                                {isAccepted && !isHost && onRateHost && (
                                    <button 
                                        onClick={() => onRateHost(outing.hostId)}
                                        className="text-xs bg-yellow-100 text-yellow-700 hover:bg-yellow-200 font-bold py-1 px-2 rounded-lg"
                                    >
                                        ⭐ Rate Host
                                    </button>
                                )}

                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${slotsAvailable > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {slotsAvailable > 0 ? t('outing_card_slots_available', { count: slotsAvailable }) : 'Full'}
                                </span>
                                
                                {showRequestButton ? (
                                    <button 
                                        onClick={() => onRequestJoin(outing)} 
                                        className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-1.5 px-4 rounded-full text-xs"
                                    >
                                        {buttonText}
                                    </button>
                                ) : (
                                    !isHost && hasAnyRequest && (
                                        <span className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                                            {t('outing_card_requested')}
                                        </span>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Host View of Requests - Include Emergency Contact */}
            {isHost && outing.requests.length > 0 && (
                 <div className="bg-[var(--bg-card-subtle)] px-5 py-3 border-t border-[var(--border-color)]">
                    <h5 className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Participants</h5>
                    <ul className="space-y-2">
                        {outing.requests.map((req, idx) => (
                            <li key={idx} className="text-xs text-[var(--text-primary)] flex flex-col border-b border-[var(--border-color)] last:border-0 pb-1">
                                <div className="flex justify-between">
                                    <span className="font-semibold">{req.childName} ({req.childAge})</span>
                                    <span className={`capitalize ${req.status === 'accepted' ? 'text-green-600' : req.status === 'declined' ? 'text-red-600' : 'text-yellow-600'}`}>{req.status}</span>
                                </div>
                                {req.status === 'accepted' && (
                                    <span className="text-[var(--text-light)] mt-0.5">
                                        🆘 Contact: {req.emergencyContactName} ({req.emergencyContactPhone})
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                 </div>
            )}
        </div>
    );
};

const ChildOutingScreen: React.FC<ChildOutingScreenProps> = ({ user, outings, onBack, onCreateOuting, onRequestJoin, onOpenChat, onRateHost }) => {
    const { t } = useLanguage();

    return (
        <div className="p-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{t('child_outings_title')}</h2>
                <p className="text-[var(--text-secondary)] max-w-xl mx-auto">{t('child_outings_subtitle')}</p>
            </div>

            <div className="mb-6 text-center">
                 <button 
                    onClick={onCreateOuting}
                    className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-transform hover:scale-105"
                >
                    {t('button_create_outing')}
                </button>
            </div>
            
            <div className="space-y-6">
                {outings.length > 0 ? (
                    outings.map(outing => <OutingCard key={outing.id} outing={outing} currentUserId={user.id} onRequestJoin={onRequestJoin} onOpenChat={onOpenChat} onRateHost={onRateHost} />)
                ) : (
                    <div className="text-center bg-[var(--bg-card-subtle)] rounded-xl border-2 border-dashed border-[var(--border-color)] p-8">
                        <p className="text-[var(--text-light)] font-medium">No shared outings yet. Be the first to create one!</p>
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

export default ChildOutingScreen;
