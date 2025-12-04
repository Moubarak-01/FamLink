import React, { useState, useEffect, useRef } from 'react';
import { locationService, GeoLocation } from '../services/locationService';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({ value, onChange, placeholder, className }) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<GeoLocation[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { setInputValue(value); }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (query: string) => {
      if (query.length < 3) { setSuggestions([]); return; }
      setLoading(true);
      try {
          const results = await locationService.searchCities(query);
          setSuggestions(results);
          setShowSuggestions(true);
      } catch (e) {
          console.error(e);
          setSuggestions([]);
      } finally {
          setLoading(false);
      }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    
    debounceTimeout.current = setTimeout(() => {
        fetchSuggestions(val);
    }, 400); // 400ms Debounce
  };

  const handleSelect = (place: GeoLocation) => {
    const formatted = `${place.name}, ${place.region || ''}, ${place.country || ''}`.replace(/, ,/g, ',');
    setInputValue(formatted);
    onChange(formatted);
    setShowSuggestions(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input 
        type="text" 
        value={inputValue} 
        onChange={handleInputChange} 
        placeholder={placeholder || "Search city..."} 
        className={className} 
        autoComplete="off" 
      />
      {loading && <div className="absolute right-3 top-3 text-xs text-gray-400">Loading...</div>}
      
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((place, index) => (
            <li 
                key={index} 
                onClick={() => handleSelect(place)} 
                className="cursor-pointer px-4 py-2 hover:bg-[var(--bg-hover)] text-sm text-[var(--text-primary)] border-b border-[var(--border-color)] last:border-0"
            >
               <span className="font-bold">{place.name}</span>
               <span className="text-xs text-[var(--text-light)] ml-2">{place.region}, {place.country}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationAutocomplete;