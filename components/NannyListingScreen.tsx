import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface NannyListingScreenProps {
  nannies: User[];
  onBack: () => void;
  onViewProfile: (nannyId: string) => void;
}

const NannyCard: React.FC<{ nanny: User, onViewProfile: (nannyId: string) => void }> = ({ nanny, onViewProfile }) => {
  const { t } = useLanguage();
  if (!nanny.profile) return null;

  const { id, fullName, profile } = nanny;
  // FIX: Destructure ratingCount
  const { rating, ratingCount, location, description, experience, availability } = profile;

  return (
    <div onClick={() => onViewProfile(id)} className="bg-[var(--bg-card)] rounded-3xl shadow-lg flex flex-col sm:flex-row items-center gap-6 p-6 border border-white/10 hover:shadow-xl hover:scale-[1.01] cursor-pointer transition-all duration-300">
      <img src={nanny.photo} alt={fullName} className="w-24 h-24 rounded-full object-cover border-4 border-pink-200" />
      <div className="flex-1 text-center sm:text-left space-y-2">
        <div className="flex items-center justify-center sm:justify-start gap-4">
          <h3 className="text-xl font-bold text-[var(--text-primary)]">{fullName}</h3>
          <div className="flex items-center gap-1 text-yellow-500 font-bold">
            <span>⭐</span>
            {/* UPDATE HERE: Use ratingCount instead of ratings.length */}
            <span>{rating > 0 ? `${rating.toFixed(1)} (${ratingCount || 0})` : t('nanny_card_new')}</span>
          </div>
        </div>
        <p className="text-sm text-[var(--text-light)] font-medium">{typeof location === 'string' ? location : location.address}</p>
        <p className="text-[var(--text-secondary)] text-sm line-clamp-2 leading-relaxed">{description}</p>
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start text-xs pt-1">
          <span className="bg-purple-100 text-purple-700 font-semibold px-3 py-1.5 rounded-full">🕒 {experience} {t('nanny_card_years_experience')}</span>
          <span className="bg-green-100 text-green-700 font-semibold px-3 py-1.5 rounded-full">{availability}</span>
        </div>
      </div>
      <button className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-bold py-3 px-8 rounded-full shadow-md transform hover:scale-105 transition-transform">
        {t('button_view_profile')}
      </button>
    </div>
  );
}

const NannyListingScreen: React.FC<NannyListingScreenProps> = ({ nannies, onBack, onViewProfile }) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNannies = useMemo(() => {
    if (!searchQuery.trim()) {
      return nannies;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return nannies.filter(nanny =>
      nanny.fullName.toLowerCase().includes(lowercasedQuery) ||
      (nanny.profile?.location && (typeof nanny.profile.location === 'string' ? nanny.profile.location : nanny.profile.location.address).toLowerCase().includes(lowercasedQuery))
    );
  }, [nannies, searchQuery]);

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{t('nanny_listing_title')}</h2>
        <p className="text-[var(--text-secondary)]">{t('nanny_listing_subtitle')}</p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('search_placeholder')}
          className="w-full px-4 py-3 bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-input)] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring-accent)] transition-shadow"
          aria-label="Search nannies"
        />
      </div>

      <div className="space-y-6">
        {filteredNannies.length > 0 ? (
          filteredNannies.map(nanny => <NannyCard key={nanny.id} nanny={nanny} onViewProfile={onViewProfile} />)
        ) : (
          <div className="text-center bg-[var(--bg-card-subtle)] rounded-xl border-2 border-dashed border-[var(--border-color)] p-8">
            <p className="text-[var(--text-light)] font-medium">{searchQuery ? t('search_no_results') : t('nanny_listing_no_nannies')}</p>
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

export default NannyListingScreen;