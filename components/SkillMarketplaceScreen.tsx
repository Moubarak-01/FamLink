import React, { useState, useMemo } from 'react';
import { SkillRequest, User, SkillOffer } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import DeleteButton from './DeleteButton';

interface SkillMarketplaceScreenProps {
    user: User;
    requests: SkillRequest[];
    onBack: () => void;
    onCreateRequest: () => void;
    onMakeOffer: (request: SkillRequest) => void;
    onUpdateOffer: (requestId: string, helperId: string, status: 'accepted' | 'declined') => void;
    onOpenChat: (request: SkillRequest) => void;
    onDeleteSkillRequest: (id: string) => void;
    onDeleteAllSkillRequests: () => void;
}

const OfferStatus: React.FC<{ status: SkillOffer['status'] }> = ({ status }) => {
    const { t } = useLanguage();
    const statusStyles = {
        pending: { text: t('status_pending'), bg: 'bg-[var(--bg-status-yellow)]', text_color: 'text-[var(--text-status-yellow)]' },
        accepted: { text: t('status_accepted'), bg: 'bg-[var(--bg-status-green)]', text_color: 'text-[var(--text-status-green)]' },
        declined: { text: t('status_declined'), bg: 'bg-[var(--bg-status-red)]', text_color: 'text-[var(--text-status-red)]' }
    };
    const currentStatus = statusStyles[status] || statusStyles.pending;
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${currentStatus.bg} ${currentStatus.text_color}`}>{currentStatus.text}</span>;
};

const getRequesterName = (reqId: any, reqName?: string) => {
    if (typeof reqId === 'object' && reqId?.fullName) return reqId.fullName;
    if (reqName) return reqName;
    return 'Unknown User';
};

const getRequesterPhoto = (reqId: any, reqPhoto?: string) => {
    if (typeof reqId === 'object' && reqId?.photo) return reqId.photo;
    if (reqPhoto) return reqPhoto;
    return 'https://i.pravatar.cc/150?u=default';
};

const SkillRequestCard: React.FC<{ request: SkillRequest, currentUserId: string, onMakeOffer: (request: SkillRequest) => void, onUpdateOffer: (requestId: string, helperId: string, status: 'accepted' | 'declined') => void, onOpenChat: (request: SkillRequest) => void, onDelete: (id: string) => void }> = ({ request, currentUserId, onMakeOffer, onUpdateOffer, onOpenChat, onDelete }) => {
    const { t } = useLanguage();
    // FIX: Safely handle null requesterId
    const reqIdStr = (request.requesterId && typeof request.requesterId === 'object') ? request.requesterId._id : (request.requesterId as string || '');
    const isOwner = reqIdStr === currentUserId;

    // CRITICAL FIX: Safe access to offers
    const offers = request.offers || [];
    const hasAcceptedOffer = offers.some(o => o.helperId === currentUserId && o.status === 'accepted');
    const myOffer = offers.find(o => {
        const hId = typeof o.helperId === 'object' ? (o.helperId as any)._id : o.helperId;
        return hId === currentUserId;
    });
    const hasOffered = !!myOffer;
    const canChat = isOwner || hasAcceptedOffer;

    const displayName = getRequesterName(request.requesterId, request.requesterName);
    const displayPhoto = getRequesterPhoto(request.requesterId, request.requesterPhoto);

    return (
        <div className="bg-[var(--bg-card)] rounded-lg shadow-md overflow-hidden border border-[var(--border-color)] relative group">
            {isOwner && (
                <DeleteButton
                    onDelete={() => onDelete(request.id)}
                    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                />
            )}

            {request.image && (
                <div className="w-full h-48 bg-gray-100">
                    <img src={request.image} alt={request.title} className="w-full h-full object-cover" />
                </div>
            )}

            <div className="p-4" onClick={() => onMakeOffer(request)} /* Card clickable for details if needed, but keeping simple */>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                        <img src={displayPhoto} alt={displayName} className="w-10 h-10 rounded-full object-cover border border-[var(--border-color)]" />
                        <div>
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-blue-100 text-blue-800 mb-1">
                                {t(`skill_cat_${request.category}` as any) || request.category}
                            </span>
                            <h3 className="font-bold text-lg text-[var(--text-primary)] mt-1">{request.title}</h3>
                            <p className="text-xs text-[var(--text-light)] mb-2">{t('skill_card_requested_by', { name: displayName })}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4 mr-8">
                            <p className="text-lg font-bold text-[var(--text-primary)]">€{request.budget}</p>
                            <p className="text-xs text-[var(--text-light)]">{t('label_budget')}</p>
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
                            {!isOwner && (
                                <button
                                    onClick={() => onMakeOffer(request)}
                                    disabled={hasOffered || request.status !== 'open'}
                                    className={`font-bold py-1.5 px-4 rounded-full text-xs transition-colors ${hasOffered
                                        ? (myOffer?.status === 'accepted' ? 'bg-green-100 text-green-600 cursor-default' :
                                            myOffer?.status === 'declined' ? 'bg-red-100 text-red-600 cursor-default' :
                                                'bg-gray-100 text-gray-500 cursor-default')
                                        : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                                >
                                    {hasOffered
                                        ? (myOffer?.status === 'accepted' ? t('status_accepted') :
                                            myOffer?.status === 'declined' ? t('status_declined') :
                                                t('outing_card_requested'))
                                        : (request.privacy === 'public' ? t('skill_card_take_task') : t('skill_card_make_offer'))
                                    }
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {isOwner && (
                    <div className="mt-4 pt-4 border-t border-[var(--border-color)] px-4 pb-4">
                        <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">{t('skill_card_view_offers', { count: offers.length })}</h4>
                        {offers.length > 0 ? (
                            <ul className="space-y-3">
                                {offers.map((offer, index) => {
                                    const helperIdStr = typeof offer.helperId === 'object' ? (offer.helperId as any)._id || (offer.helperId as any).id : offer.helperId;
                                    return (
                                        <li key={`${helperIdStr}-${index}`} className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm bg-[var(--bg-card-subtle)] p-3 rounded-md">
                                            <div>
                                                <p className="font-semibold text-[var(--text-primary)]">{t('offer_from', { name: offer.helperName })} - <span className="font-bold">€{offer.offerAmount}</span></p>
                                                <p className="text-[var(--text-light)] italic mt-1">"{offer.message}"</p>
                                            </div>
                                            <div className="flex gap-2 items-center mt-2 sm:mt-0 self-end sm:self-center">
                                                {offer.status === 'pending' ? (
                                                    <>
                                                        <button onClick={() => onUpdateOffer(request.id, helperIdStr, 'accepted')} className="text-xs bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-full">{t('button_accept')}</button>
                                                        <button onClick={() => onUpdateOffer(request.id, helperIdStr, 'declined')} className="text-xs bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-full">{t('button_decline')}</button>
                                                    </>
                                                ) : (
                                                    <OfferStatus status={offer.status} />
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : <p className="text-xs text-[var(--text-light)]">{t('no_offers_yet')}</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

const SkillMarketplaceScreen: React.FC<SkillMarketplaceScreenProps> = ({ user, requests, onBack, onCreateRequest, onMakeOffer, onUpdateOffer, onOpenChat, onDeleteSkillRequest, onDeleteAllSkillRequests }) => {
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredRequests = useMemo(() => {
        if (!searchQuery.trim()) return requests;
        const query = searchQuery.toLowerCase();
        return requests.filter(req =>
            req.title.toLowerCase().includes(query) ||
            req.description.toLowerCase().includes(query) ||
            req.category.toLowerCase().includes(query) ||
            req.location.toLowerCase().includes(query)
        );
    }, [requests, searchQuery]);

    const handleClearAll = () => {
        if (window.confirm("Delete ALL requests? This cannot be undone.")) {
            onDeleteAllSkillRequests();
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-4">
                <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-800">{t('button_back_arrow')}</button>
                <button onClick={handleClearAll} className="text-xs text-red-500 hover:text-red-700 font-bold border border-red-200 bg-red-50 px-3 py-1 rounded-md">{t('button_clear_all')}</button>
            </div>

            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{t('skill_marketplace_title')}</h2>
                <p className="text-[var(--text-secondary)] max-w-xl mx-auto">{t('skill_marketplace_subtitle')}</p>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                <div className="relative w-full max-w-md">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('placeholder_search_skills')}
                        className="w-full px-4 py-3 pl-10 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--text-primary)]"
                    />
                    <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
                </div>
                <button
                    onClick={onCreateRequest}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-transform hover:scale-105 whitespace-nowrap"
                >
                    {t('button_post_task')}
                </button>
            </div>

            <div className="space-y-6">
                {filteredRequests.length > 0 ? (
                    filteredRequests.map(request => (
                        <SkillRequestCard
                            key={request.id}
                            request={request}
                            currentUserId={user.id}
                            onMakeOffer={onMakeOffer}
                            onUpdateOffer={onUpdateOffer}
                            onOpenChat={onOpenChat}
                            onDelete={onDeleteSkillRequest}
                        />
                    ))
                ) : (
                    <div className="text-center bg-[var(--bg-card-subtle)] rounded-xl border-2 border-dashed border-[var(--border-color)] p-8">
                        <p className="text-[var(--text-light)] font-medium">{t('no_tasks_posted')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SkillMarketplaceScreen;