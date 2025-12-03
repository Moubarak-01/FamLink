
import React, { useState, useEffect } from 'react';
import { locations } from '../data/locations';
import SearchableSelect from './SearchableSelect';

interface LocationSelectorProps {
  initialValue?: string;
  onChange: (location: string) => void;
  onCountryChange?: (isoCode: string) => void;
  hasError?: boolean;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ initialValue, onChange, onCountryChange, hasError }) => {
  const [country, setCountry] = useState(''); 
  const [state, setState] = useState('');
  const [city, setCity] = useState('');

  // Parse initial value "City, State, Country"
  useEffect(() => {
    if (initialValue) {
      const parts = initialValue.split(',').map(p => p.trim());
      if (parts.length === 3) {
        const [initCity, initState, initCountry] = parts;
        setCountry(initCountry);
        setState(initState);
        setCity(initCity);
      } else if (parts.length === 1 && parts[0]) {
          // Handle edge case where only country might be stored
          setCountry(parts[0]);
      }
    }
  }, []);

  // Propagate Country ISO code
  useEffect(() => {
      const countryData = locations.find(l => l.name === country);
      if (countryData && onCountryChange) {
          onCountryChange(countryData.isoCode);
      }
  }, [country, onCountryChange]);

  // Update parent when selection is complete
  useEffect(() => {
    if (country) {
        // Build the string based on what we have
        const parts = [];
        if (city) parts.push(city);
        if (state) parts.push(state);
        parts.push(country);
        onChange(parts.join(', '));
    }
  }, [country, state, city, onChange]);

  const selectedCountryData = locations.find(l => l.name === country);
  const selectedStateData = selectedCountryData?.states.find(s => s.name === state);

  // Options for dropdowns
  const countryOptions = locations.map(l => l.name);
  
  // "Learned" Options Logic:
  // If the user typed a custom state that isn't in our DB, we allow it (the component "learns" it for this session)
  // But we won't have cities for it, so cities become free text.
  const stateOptions = selectedCountryData ? selectedCountryData.states.map(s => s.name) : [];
  
  const cityOptions = selectedStateData ? selectedStateData.cities.map(c => c.name) : [];

  const handleCountryChange = (val: string) => {
    setCountry(val);
    setState('');
    setCity('');
  };

  const handleStateChange = (val: string) => {
    setState(val);
    setCity('');
  };

  return (
    <div className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SearchableSelect 
                label="Country" 
                options={countryOptions} 
                value={country} 
                onChange={handleCountryChange} 
                placeholder="Select Country"
                allowCustom={false} // Countries must be from our known list for Phone Input sync
                hasError={hasError}
            />
            <SearchableSelect 
                label="State/Province" 
                options={stateOptions} 
                value={state} 
                onChange={handleStateChange} 
                placeholder={!country ? "Select Country First" : "Select or Type State"}
                disabled={!country} 
                allowCustom={true} // Allow user to add new states (Learning)
            />
            <SearchableSelect 
                label="City" 
                options={cityOptions} 
                value={city} 
                onChange={setCity} 
                placeholder={!state ? "Select State First" : "Select or Type City"}
                disabled={!state} 
                allowCustom={true} // Allow user to add new cities (Learning)
            />
        </div>
    </div>
  );
};

export default LocationSelector;
