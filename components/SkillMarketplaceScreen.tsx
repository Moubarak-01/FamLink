import React from 'react';
import { SkillRequest, User, SkillOffer } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface SkillMarketplaceScreenProps {
    user: User;
    requests: SkillRequest[];
    onBack: () => void;
    onCreateRequest: () => void;
    onMakeOffer: (request: SkillRequest) => void;
    onUpdateOffer: (requestId: string, helperId: string, status: 'accepted' | 'declined') => void;
    onOpenChat: (request: SkillRequest) => void;
}

const OfferStatus: React.FC<{ status: SkillOffer['status'] }> = ({ status }) => {
    const { t } = useLanguage();
    const statusStyles = {
        pending: { text: t('booking_status_pending'), bg: 'bg-[var(--bg-status-yellow)]', text_color: 'text-[var(--text-status-yellow)]' },
        accepted: { text: t('booking_status_accepted'), bg: 'bg-[var(--bg-status-green)]', text_color: 'text-[var(--text-status-green)]' },
        declined: { text: t('booking_status_declined'), bg: 'bg-[var(--bg-status-red)]', text_color: 'text-[var(--text-status-red)]' }
    };
    const currentStatus = statusStyles[status];
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${currentStatus.bg} ${currentStatus.text_color}`}>{currentStatus.text}</span>;
};

const SkillRequestCard: React.FC<{ request: SkillRequest, currentUserId: string, onMakeOffer: (request: SkillRequest) => void, onUpdateOffer: (requestId: string, helperId: string, status: 'accepted' | 'declined') => void, onOpenChat: (request: SkillRequest) => void }> = ({ request, currentUserId, onMakeOffer, onUpdateOffer, onOpenChat }) => {
    const { t } = useLanguage();
    const isOwner = request.requesterId === currentUserId;
    
    // Check if user has an accepted offer
    const hasAcceptedOffer = request.offers.some(o => o.helperId === currentUserId && o.status === 'accepted');
    const canChat = isOwner || hasAcceptedOffer;

    return (
        <div className="bg-[var(--bg-card)] rounded-lg shadow-md overflow-hidden border border-[var(--border-color)]">
            <div className="p-5">
                <div className="flex items-start gap-4">
                    <img src={request.requesterPhoto} alt={request.requesterName} className="w-12 h-12 rounded-full object-cover" />
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs font-semibold bg-[var(--bg-blue-card)] text-[var(--text-blue-card-body)] px-2 py-0.5 rounded-full capitalize">
                                    {t(`skill_cat_${request.category}`)}
                                </span>
                                <h3 className="font-bold text-lg text-[var(--text-primary)] mt-1">{request.title}</h3>
                                <p className="text-xs text-[var(--text-light)] mb-2">{t('skill_card_requested_by', { name: request.requesterName })}</p>
                            </div>
                             <div className="text-right flex-shrink-0 ml-4">
                                <p className="text-lg font-bold text-[var(--text-primary)]">€{request.budget}</p>
                                <p className="text-xs text-[var(--text-light)]">Budget</p>
                            </div>
                        </div>
                        <p className="text-[var(--text-secondary)] mt-1 text-sm">{request.description}</p>
                        
                        <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex flex-wrap justify-between items-center gap-2">
                            <p className="text-xs text-[var(--text-light)] font-medium">📍 {request.location}</p>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => onOpenChat(request)}
                                    disabled={!canChat}
                                    className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1 disabled:text-gray-400 disabled:cursor-not-allowed"
                                    title={!canChat ? "Offer must be accepted to chat" : ""}
                                >
                                    Chat {request.messages && request.messages.length > 0 ? `(${request.messages.length})` : ''}
                                </button>
                                {!isOwner && request.status === 'open' && (
                                    <button onClick={() => onMakeOffer(request)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1.5 px-4 rounded-full text-xs">
                                        {t('skill_card_make_offer')}
                                    </button>
                                )}
                            </div>
                        </div>

                        {isOwner && (
                            <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                                <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">{t('skill_card_view_offers', { count: request.offers.length })}</h4>
                                {request.offers.length > 0 ? (
                                    <ul className="space-y-3">
                                        {request.offers.map(offer => (
                                            <li key={offer.helperId} className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm bg-[var(--bg-card-subtle)] p-3 rounded-md">
                                                <div>
                                                    <p className="font-semibold text-[var(--text-primary)]">{t('offer_from', { name: offer.helperName })} - <span className="font-bold">€{offer.offerAmount}</span></p>
                                                    <p className="text-[var(--text-light)] italic mt-1">"{offer.message}"</p>
                                                </div>
                                                <div className="flex gap-2 items-center mt-2 sm:mt-0 self-end sm:self-center">
                                                    {offer.status === 'pending' ? (
                                                        <>
                                                            <button onClick={() => onUpdateOffer(request.id, offer.helperId, 'accepted')} className="text-xs bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-full">{t('button_accept')}</button>
                                                            <button onClick={() => onUpdateOffer(request.id, offer.helperId, 'declined')} className="text-xs bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-full">{t('button_decline')}</button>
                                                        </>
                                                    ) : (
                                                        <OfferStatus status={offer.status} />
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-xs text-[var(--text-light)]">{t('no_offers_yet')}</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const SkillMarketplaceScreen: React.FC<SkillMarketplaceScreenProps> = ({ user, requests, onBack, onCreateRequest, onMakeOffer, onUpdateOffer, onOpenChat }) => {
    const { t } = useLanguage();
    
    return (
        <div className="p-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{t('skill_marketplace_title')}</h2>
                <p className="text-[var(--text-secondary)] max-w-xl mx-auto">{t('skill_marketplace_subtitle')}</p>
            </div>

            <div className="mb-6 text-center">
                 <button 
                    onClick={onCreateRequest}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-transform hover:scale-105"
                >
                    {t('button_post_task')}
                </button>
            </div>
            
            <div className="space-y-6">
                {requests.length > 0 ? (
                    requests.map(request => <SkillRequestCard key={request.id} request={request} currentUserId={user.id} onMakeOffer={onMakeOffer} onUpdateOffer={onUpdateOffer} onOpenChat={onOpenChat} />)
                ) : (
                    <div className="text-center bg-[var(--bg-card-subtle)] rounded-xl border-2 border-dashed border-[var(--border-color)] p-8">
                        <p className="text-[var(--text-light)] font-medium">No tasks posted yet. Be the first to post one!</p>
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

export default SkillMarketplaceScreen;