
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface SearchableSelectProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowCustom?: boolean; // Allow typing values not in the list
  hasError?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ label, options, value, onChange, placeholder, disabled, allowCustom = true, hasError }) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync search with external value changes
  useEffect(() => {
    setSearch(value || '');
  }, [value]);

  // Filter options and limit results to improve performance on large lists
  const filteredOptions = useMemo(() => {
    // If the search term matches the currently selected value exactly, 
    // show all options to allow selection change.
    if (search === value) {
      return options.slice(0, 300);
    }

    const lowerSearch = search.toLowerCase();
    const results = options.filter(option =>
      option.toLowerCase().includes(lowerSearch)
    );
    return results.slice(0, 300);
  }, [options, search, value]);

  const handleSelect = (option: string) => {
    onChange(option);
    setSearch(option);
    setIsOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearch(newValue);
    if (!isOpen) setIsOpen(true);

    if (newValue === '') {
      onChange('');
    } else if (allowCustom) {
      // In custom mode, we update the parent immediately to allow typing flow
      onChange(newValue);
    }
  };

  const borderClass = hasError && !value
    ? 'border-red-500 ring-1 ring-red-500'
    : isOpen
      ? 'ring-2 ring-[var(--ring-accent)] border-[var(--border-accent)]'
      : 'border-[var(--border-input)]';

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{label}</label>
      <div
        className={`relative w-full bg-[var(--bg-input)] border rounded-md shadow-sm cursor-text transition-colors
            ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'hover:border-[var(--border-accent)]'}
            ${borderClass}
        `}
      >
        <input
          ref={inputRef}
          type="text"
          className="w-full px-3 py-2 bg-transparent border-none focus:outline-none text-[var(--text-primary)] placeholder-gray-400 rounded-md"
          placeholder={disabled ? "Select above first..." : (placeholder || "Search or type...")}
          value={search}
          onChange={handleChange}
          onFocus={(e) => {
            if (!disabled) {
              setIsOpen(true);
              e.target.select(); // Auto-select text on click to allow easy overwrite
            }
          }}
          disabled={disabled}
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && !disabled && (
        <ul className="absolute z-50 w-full mt-1 bg-[var(--bg-card)] border border-[var(--border-input)] rounded-md shadow-lg max-h-60 overflow-y-auto focus:outline-none">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <li
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(option);
                }}
                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-[var(--bg-accent-light)] hover:text-[var(--text-accent)] ${value === option ? 'font-bold text-[var(--text-accent)] bg-[var(--bg-accent-light)]' : 'text-[var(--text-primary)]'}`}
              >
                {option}
              </li>
            ))
          ) : null}

          {/* Allow Custom Input Section - Always show if searching and no exact match */}
          {allowCustom && search && !options.includes(search) && (
            <>
              {filteredOptions.length > 0 && <li className="border-t border-[var(--border-input)] my-1"></li>}
              <li
                className="text-[var(--text-accent)] cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-[var(--bg-accent-light)] italic flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(search);
                }}
              >
                <span className="text-xs bg-[var(--bg-accent-light)] border border-[var(--border-accent)] px-1.5 rounded">{t('label_add')}</span> {t('label_use_search').replace('{search}', search)}
              </li>
            </>
          )}

          {filteredOptions.length === 0 && !search && (
            <li className="text-gray-500 cursor-default select-none py-2 pl-3 pr-9 italic text-sm">Start typing to search...</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchableSelect;
