
import React from 'react';
import { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import Calendar from './Calendar';

interface NannyProfileDetailScreenProps {
  nanny: User;
  onBack: () => void;
  onContact: (nanny: User) => void;
  onAdd: (nannyId: string) => void;
  onRequestBooking: (nanny: User) => void;
  isAdded: boolean;
  hasPendingRequest?: boolean;
  onReportUser?: (nannyId: string) => void;
}

const NannyProfileDetailScreen: React.FC<NannyProfileDetailScreenProps> = ({ nanny, onBack, onContact, onAdd, onRequestBooking, isAdded, hasPendingRequest, onReportUser }) => {
    const { t } = useLanguage();

    if (!nanny.profile) {
        return (
            <div className="p-8 text-center">
                <p>{t('nanny_listing_no_nannies')}</p>
                 <div className="mt-8 pt-6 border-t border-[var(--border-color)] flex justify-start">
                    <button onClick={onBack} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-6 rounded-full">
                    {t('button_back')}
                    </button>
                </div>
            </div>
        );
    }
    
    const { id, fullName, email, profile, photo } = nanny;
    const { phone, location, experience, availability, certifications, description, rating, availableDates } = profile;

    const DetailItem: React.FC<{label: string, value: string | string[], icon: string}> = ({ label, value, icon }) => (
        <div className="bg-[var(--bg-card-subtle)] p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-[var(--text-accent)] mb-1 flex items-center gap-2">{icon} {label}</h4>
            {Array.isArray(value) && value.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {value.map((item, index) => (
                        <span key={index} className="bg-gray-200 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">{item}</span>
                    ))}
                </div>
            ) : (
                 <p className="text-[var(--text-primary)]">{typeof value === 'string' && value ? value : 'N/A'}</p>
            )}
        </div>
    );

    // Create map URL
    const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(location)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

    return (
        <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b border-[var(--border-color)] relative">
                <img src={photo} alt={fullName} className="w-32 h-32 rounded-full object-cover border-4 border-[var(--bg-card)] shadow-lg transition-transform duration-300 ease-in-out hover:scale-105" />
                <div className="text-center sm:text-left flex-grow">
                    <h2 className="text-3xl font-bold text-[var(--text-primary)]">{fullName}</h2>
                    <p className="text-[var(--text-light)]">{email}</p>
                    <div className="mt-2 flex items-center justify-center sm:justify-start gap-1 text-yellow-500 font-bold">
                        <span>⭐</span>
                        <span>{rating > 0 ? `${rating.toFixed(1)} / 5.0 (${nanny.ratings?.length || 0} ${t('nanny_profile_reviews')})` : t('nanny_card_new')}</span>
                    </div>
                </div>
                {onReportUser && (
                    <button 
                        onClick={() => {
                            if(window.confirm("Report this user for inappropriate behavior?")) {
                                onReportUser(nanny.id);
                            }
                        }}
                        className="absolute top-0 right-0 text-gray-400 hover:text-red-500 transition-colors p-2"
                        title="Report User"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13a1 1 0 011-1h1.5a1 1 0 011 1v5a1 1 0 01-1 1H13a1 1 0 01-1-1V8z" />
                        </svg>
                    </button>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <DetailItem label={t('nanny_profile_experience')} value={`${experience} ${t('nanny_profile_years')}`} icon="🕒" />
                <DetailItem label={t('nanny_profile_availability')} value={availability} icon="📅" />
                <DetailItem label={t('nanny_profile_location')} value={location} icon="📍" />
                <DetailItem label={t('nanny_profile_certifications')} value={certifications} icon="📜" />
            </div>

            <div className="mb-8">
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{t('nanny_profile_about')} {fullName.split(' ')[0]}</h3>
                <p className="text-[var(--text-secondary)] whitespace-pre-wrap">{description}</p>
            </div>

            {/* Embedded Map */}
            <div className="mb-8">
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">Location</h3>
                <div className="w-full h-64 rounded-lg overflow-hidden shadow-md border border-[var(--border-color)]">
                    <iframe
                        title="Nanny Location"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        marginHeight={0}
                        marginWidth={0}
                        src={mapUrl}
                        className="w-full h-full"
                    ></iframe>
                </div>
            </div>
            
            <div className="mb-8">
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t('calendar_title')}</h3>
                <Calendar availableDates={availableDates || []} isEditable={false} />
            </div>

            <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t('nanny_profile_reviews_title')}</h3>
                {nanny.ratings && nanny.ratings.length > 0 ? (
                    <div className="space-y-4">
                        {nanny.ratings.map((review, index) => (
                            <div key={index} className="bg-[var(--bg-card-subtle)] p-4 rounded-lg border-l-4 border-[var(--border-accent)]">
                                <div className="flex items-center mb-1">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className={`text-xl ${i < review.ratingValue ? 'text-yellow-400' : 'text-gray-300'}`}>&#9733;</span>
                                    ))}
                                </div>
                                {review.comment && <p className="text-[var(--text-secondary)] italic">"{review.comment}"</p>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-[var(--text-light)]">{t('nanny_profile_no_reviews')}</p>
                )}
            </div>


            <div className="mt-8 pt-6 border-t border-[var(--border-color)] flex flex-col sm:flex-row gap-4 justify-between items-center">
                <button onClick={onBack} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-6 rounded-full w-full sm:w-auto">
                    {t('button_back')}
                </button>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <button 
                        onClick={() => onContact(nanny)} 
                        className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg shadow-md w-full sm:w-auto"
                    >
                        {t('button_contact')}
                    </button>
                    <button 
                        onClick={() => onRequestBooking(nanny)} 
                        disabled={hasPendingRequest}
                        className={`text-white font-bold py-3 px-6 rounded-lg shadow-md w-full sm:w-auto ${hasPendingRequest ? 'bg-gray-400 cursor-not-allowed' : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)]'}`}
                    >
                        {hasPendingRequest ? 'Request Sent' : t('button_request_booking')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NannyProfileDetailScreen;
