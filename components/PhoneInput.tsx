import React, { useEffect, useState } from 'react';
import PhoneInputObj from 'react-phone-number-input';
import { Country } from 'react-phone-number-input';

// Because the library might be imported differently depending on environment
const PhoneInputComponent = (PhoneInputObj as any).default || PhoneInputObj;

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  forcedIsoCode?: string; // Allow external control (e.g., from LocationSelector)
  hasError?: boolean;
}

const PhoneInput: React.FC<PhoneInputProps> = ({ value, onChange, label, required, forcedIsoCode, hasError }) => {
  const [country, setCountry] = useState<Country | undefined>(undefined);

  useEffect(() => {
    if (forcedIsoCode) {
      // Ensure the ISO code is valid (2 chars, uppercase) for the library
      const validIso = forcedIsoCode.toUpperCase() as Country;
      if (validIso !== country) {
        setCountry(validIso);
      }
    }
  }, [forcedIsoCode]);

  const labelStyles = "block text-sm font-medium text-[var(--text-secondary)]";

  return (
    <div className="w-full">
      {label && <label className={`mb-1 ${labelStyles}`}>{label}{required && <span className="text-red-500">*</span>}</label>}
      <div className={`mt-1 relative bg-[var(--bg-input)] border rounded-md shadow-sm transition-colors ${hasError ? 'border-red-500' : 'border-[var(--border-input)] focus-within:border-[var(--border-accent)] focus-within:ring-1 focus-within:ring-[var(--ring-accent)]'}`}>
        <PhoneInputComponent
          international
          defaultCountry="US"
          country={country}
          onCountryChange={setCountry}
          value={value}
          onChange={(val: string) => onChange(val || '')}
          className={`PhoneInput flex items-center p-0.5`}
          numberInputProps={{
            className: "PhoneInputInput bg-transparent border-none focus:ring-0 text-[var(--text-primary)] placeholder-gray-400 h-full py-2 w-full focus:outline-none"
          }}
          countrySelectProps={{ className: "bg-transparent border-none focus:ring-0 cursor-pointer" }}
          required={required}
          limitMaxLength={true}
        />
      </div>
    </div>
  );
};

export default PhoneInput;