import React, { useState, useEffect } from 'react';
import { locationService, GeoLocation } from '../services/locationService';

interface LocationSelectorProps {
  initialValue?: string;
  onChange: (location: string) => void;
  onCountryChange?: (isoCode: string) => void;
  hasError?: boolean;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ initialValue, onChange, onCountryChange, hasError }) => {
  const [countries, setCountries] = useState<GeoLocation[]>([]);
  const [states, setStates] = useState<GeoLocation[]>([]);
  const [cities, setCities] = useState<GeoLocation[]>([]);

  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Load Countries on Mount
  useEffect(() => {
      const loadCountries = async () => {
          try {
              const data = await locationService.getCountries();
              setCountries(data);
          } catch (e) { console.error("Failed to load countries", e); }
      };
      loadCountries();
  }, []);

  // Handle Country Selection
  const handleCountryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const countryCode = e.target.value;
      const countryName = e.target.options[e.target.selectedIndex].text;
      
      setSelectedCountry(countryCode);
      setSelectedState('');
      setSelectedCity('');
      setStates([]);
      setCities([]);

      if (onCountryChange) onCountryChange(countryCode);
      onChange(countryName); // Fallback if incomplete

      if (countryCode) {
          setIsLoading(true);
          try {
              const data = await locationService.getStates(countryCode);
              setStates(data);
          } finally { setIsLoading(false); }
      }
  };

  // Handle State Selection
  const handleStateChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const regionCode = e.target.value;
      const stateName = e.target.options[e.target.selectedIndex].text;

      setSelectedState(regionCode);
      setSelectedCity('');
      setCities([]);
      
      const countryName = countries.find(c => c.countryCode === selectedCountry)?.name;
      onChange(`${stateName}, ${countryName}`); // Progressive update

      if (regionCode) {
          setIsLoading(true);
          try {
              const data = await locationService.getCities(selectedCountry, regionCode);
              setCities(data);
          } finally { setIsLoading(false); }
      }
  };

  // Handle City Selection
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const cityName = e.target.value;
      setSelectedCity(cityName);
      
      const countryName = countries.find(c => c.countryCode === selectedCountry)?.name;
      const stateName = states.find(s => s.isoCode === selectedState)?.name; // GeoDB uses isoCode for region code in list
      
      onChange(`${cityName}, ${stateName}, ${countryName}`);
  };

  const selectClass = `block w-full px-3 py-2 bg-[var(--bg-input)] border rounded-md shadow-sm text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-accent)] ${hasError ? 'border-red-500' : 'border-[var(--border-input)]'}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Country</label>
            <select value={selectedCountry} onChange={handleCountryChange} className={selectClass}>
                <option value="">Select Country</option>
                {countries.map((c) => <option key={c.countryCode || c.wikiDataId} value={c.countryCode}>{c.name}</option>)}
            </select>
        </div>
        <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">State/Region</label>
            <select value={selectedState} onChange={handleStateChange} disabled={!selectedCountry} className={selectClass}>
                <option value="">Select State</option>
                {states.map((s) => <option key={s.isoCode || s.wikiDataId} value={s.isoCode}>{s.name}</option>)}
            </select>
        </div>
        <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">City {isLoading && '...'}</label>
            <select value={selectedCity} onChange={handleCityChange} disabled={!selectedState} className={selectClass}>
                <option value="">Select City</option>
                {cities.map((c) => <option key={c.id || c.wikiDataId} value={c.name}>{c.name}</option>)}
            </select>
        </div>
    </div>
  );
};

export default LocationSelector;