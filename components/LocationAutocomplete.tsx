import React, { useState, useEffect, useRef } from 'react';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const MOCK_PLACES = ["New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Paris, France", "London, UK", "Tokyo, Japan", "Dubai, UAE"];

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({ value, onChange, placeholder, className }) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setInputValue(value); }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
    if (val.length > 1) {
      setSuggestions(MOCK_PLACES.filter(p => p.toLowerCase().includes(val.toLowerCase())));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelect = (place: string) => {
    setInputValue(place);
    onChange(place);
    setShowSuggestions(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input type="text" value={inputValue} onChange={handleInputChange} placeholder={placeholder} className={className} autoComplete="off" />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((place, index) => (
            <li key={index} onClick={() => handleSelect(place)} className="cursor-pointer px-4 py-2 hover:bg-gray-100 text-sm text-gray-800">
               📍 {place}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
export default LocationAutocomplete;