import React, { useState, useEffect, useRef, useMemo } from 'react';
import { locationService, GeoLocation } from '../services/locationService';
import { useLanguage } from '../contexts/LanguageContext';

export type LocationInputMode = 'tiered' | 'autocomplete';

interface LocationInputProps {
  value?: string;
  onChange: (location: string) => void;
  mode?: LocationInputMode;
  onCountryChange?: (regionCode: string) => void; // Useful for PhoneInput sync
  placeholder?: string;
  hasError?: boolean;
  className?: string;
}

const LocationInput: React.FC<LocationInputProps> = ({
  value = '',
  onChange,
  mode = 'autocomplete',
  onCountryChange,
  placeholder,
  hasError,
  className
}) => {
  const { t } = useLanguage();
  const labelStyles = "block text-sm font-medium text-[var(--text-secondary)]";
  const baseInputClass = `w-full px-3 py-2 bg-[var(--bg-input)] border rounded-md shadow-sm text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-accent)] transition-colors ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-[var(--border-input)]'} ${className || ''}`;

  // =========================================================
  // MODE: AUTOCOMPLETE (for general search/forms)
  // =========================================================
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<GeoLocation[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Sync internal input state with external value prop
  useEffect(() => {
    setInputValue(value);
  }, [value, mode]);

  // Handle outside click for autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    setLoadingSearch(true);
    try {
      const results = await locationService.searchCities(query);
      setSuggestions(results);
      setShowSuggestions(true);
    } catch (e) {
      console.error("Location search failed", e);
      setSuggestions([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val); // Update parent immediately

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 400); // 400ms Debounce
  };

  const handleSearchSelect = (place: GeoLocation) => {
    const formatted = `${place.name}, ${place.region || ''}, ${place.country || ''}`.replace(/, ,/g, ',').replace(/, $/, '');
    setInputValue(formatted);
    onChange(formatted);
    setShowSuggestions(false);

    if (place.countryCode && onCountryChange) {
      onCountryChange(place.countryCode);
    }
  };

  // =========================================================
  // MODE: TIERED (for specific profile forms)
  // =========================================================
  const [countries, setCountries] = useState<GeoLocation[]>([]);
  const [states, setStates] = useState<GeoLocation[]>([]);
  const [cities, setCities] = useState<GeoLocation[]>([]);

  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [loadingTiered, setLoadingTiered] = useState(false);

  // Initial Load for Countries in Tiered Mode
  useEffect(() => {
    if (mode === 'tiered' && countries.length === 0) {
      const loadCountries = async () => {
        setLoadingTiered(true);
        try {
          const data = await locationService.getCountries();
          setCountries(data);
        } catch (e) {
          console.error("Failed to load countries", e);
        } finally {
          setLoadingTiered(false);
        }
      };
      loadCountries();
    }
  }, [mode, countries.length]);

  const handleTieredUpdate = (countryCode: string, regionCode: string, cityName: string) => {
    const countryName = countries.find(c => c.countryCode === countryCode)?.name;
    const stateName = states.find(s => s.regionCode === regionCode)?.name;

    let finalLocation = '';
    if (cityName) finalLocation = `${cityName}, `;
    if (stateName) finalLocation += `${stateName}, `;
    if (countryName) finalLocation += countryName;

    finalLocation = finalLocation.replace(/, $/g, '').replace(/, ,/g, ',');

    onChange(finalLocation);
  };

  const handleCountryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const countryCode = e.target.value;
    setSelectedCountry(countryCode);
    setSelectedState('');
    setSelectedCity('');
    setStates([]);
    setCities([]);

    if (onCountryChange) onCountryChange(countryCode);
    handleTieredUpdate(countryCode, '', '');

    if (countryCode) {
      setLoadingTiered(true);
      try {
        const data = await locationService.getStates(countryCode);
        setStates(data);
      } finally {
        setLoadingTiered(false);
      }
    }
  };

  const handleStateChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regionCode = e.target.value;
    setSelectedState(regionCode);
    setSelectedCity('');
    setCities([]);

    handleTieredUpdate(selectedCountry, regionCode, '');

    if (regionCode) {
      setLoadingTiered(true);
      try {
        const data = await locationService.getCities(selectedCountry, regionCode);
        setCities(data);
      } finally {
        setLoadingTiered(false);
      }
    }
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityName = e.target.value;
    setSelectedCity(cityName);
    handleTieredUpdate(selectedCountry, selectedState, cityName);
  };

  // =========================================================
  // RENDER LOGIC
  // =========================================================

  if (mode === 'autocomplete') {
    return (
      <div className="relative w-full" ref={wrapperRef}>
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={handleSearchChange}
            placeholder={placeholder || "Search city (e.g. Paris)..."}
            className={baseInputClass}
            autoComplete="off"
          />
          {loadingSearch && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="animate-spin h-4 w-4 text-[var(--accent-primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-50 w-full mt-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((place, index) => (
              <li
                key={index}
                onClick={() => handleSearchSelect(place)}
                className="cursor-pointer px-4 py-2 hover:bg-[var(--bg-hover)] text-sm text-[var(--text-primary)] border-b border-[var(--border-color)] last:border-0 flex flex-col"
              >
                <span className="font-bold">{place.name}</span>
                <span className="text-xs text-[var(--text-light)]">
                  {[place.region, place.country].filter(Boolean).join(', ')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // RENDER: TIERED
  return (
    <div className="space-y-3">
      {/* Show current value if set (editing mode), as tiered selectors reset on load */}
      {value && !selectedCountry && (
        <div className="text-xs text-[var(--text-light)] mb-1">
          Current: <span className="font-medium text-[var(--text-primary)]">{value}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{t('label_country')}</label>
          <select
            value={selectedCountry}
            onChange={handleCountryChange}
            className={baseInputClass}
            disabled={loadingTiered}
          >
            <option value="">{t('placeholder_select_country')}</option>
            {countries.map((c) => (
              <option key={c.countryCode || c.wikiDataId} value={c.countryCode}>
                {c.name}
              </option>
            ))}
          </select>
          {loadingTiered && !countries.length && selectedCountry === '' && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="animate-spin h-4 w-4 text-[var(--accent-primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>

        <div className="relative">
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">State/Region</label>
          <select
            value={selectedState}
            onChange={handleStateChange}
            disabled={!selectedCountry || loadingTiered}
            className={`${baseInputClass} ${!selectedCountry ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <option value="">{t('placeholder_select_state')}</option>
            {states.map((s) => (
              <option key={s.regionCode || s.wikiDataId} value={s.regionCode}>
                {s.name}
              </option>
            ))}
          </select>
          {loadingTiered && selectedCountry && !selectedState && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="animate-spin h-4 w-4 text-[var(--accent-primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>

        <div className="relative">
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{t('label_city')}</label>
          <select
            value={selectedCity}
            onChange={handleCityChange}
            disabled={!selectedState || loadingTiered}
            className={`${baseInputClass} ${!selectedState ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <option value="">{t('placeholder_select_city')}</option>
            {cities.map((c) => (
              <option key={c.id || c.wikiDataId} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          {loadingTiered && selectedState && !selectedCity && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="animate-spin h-4 w-4 text-[var(--accent-primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationInput;