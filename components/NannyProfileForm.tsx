import React, { useState, useMemo } from 'react';
import { NannyProfile, User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import Calendar from './Calendar';
import LocationSelector from './LocationSelector';
import PhoneInput from './PhoneInput';

interface NannyProfileFormProps {
  user: User;
  onSubmit: (profile: Partial<NannyProfile & {fullName: string, email: string, photo: string}>) => void;
  onBack: () => void;
}

// A simple utility to convert file to base64
const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

const NannyProfileForm: React.FC<NannyProfileFormProps> = ({ user, onSubmit, onBack }) => {
  const [photo, setPhoto] = useState<string>(user.photo || '');
  const [photoPreview, setPhotoPreview] = useState<string>(user.photo || '');
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.profile?.phone || '');
  const [location, setLocation] = useState(user.profile?.location || '');
  const [selectedCountryIso, setSelectedCountryIso] = useState<string | undefined>(undefined);

  const [experience, setExperience] = useState(user.profile?.experience || '');
  const [certifications, setCertifications] = useState(user.profile?.certifications?.join(', ') || '');
  const [availability, setAvailability] = useState(user.profile?.availability || '');
  const [availableDates, setAvailableDates] = useState<string[]>(user.profile?.availableDates || []);
  const [description, setDescription] = useState(user.profile?.description || '');
  const [errors, setErrors] = useState({ fullName: '', email: '', phone: '', experience: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const { t } = useLanguage();

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoPreview(URL.createObjectURL(file));
      const base64 = await toBase64(file);
      setPhoto(base64);
    }
  };
  
  const validateAndSet = (field: 'fullName' | 'email' | 'experience', value: string) => {
    let error = '';
    if (field === 'fullName') {
      if (!/^[a-zA-Z\s]*$/.test(value)) error = t('error_letters_only');
      setFullName(value);
    } else if (field === 'email') {
      if (!/^\S+@\S+\.\S+$/.test(value)) error = t('error_invalid_email');
      setEmail(value);
    } else if (field === 'experience') {
       if (!/^[0-9]*$/.test(value)) error = t('error_numbers_only');
       setExperience(value);
    }
    setErrors(prev => ({ ...prev, [field]: error }));
  };
  
  const handleAvailabilityChange = (date: string) => {
      setAvailableDates(prev => 
          prev.includes(date) 
          ? prev.filter(d => d !== date) 
          : [...prev, date]
      );
  };

  const requiredFields = useMemo(() => [photo, fullName, email, phone, experience, location, availability, description], [photo, fullName, email, phone, experience, location, availability, description]);
  
  const completionPercentage = useMemo(() => {
    const filledFields = requiredFields.filter(field => !!field).length;
    return (filledFields / requiredFields.length) * 100;
  }, [requiredFields]);

  const missingFieldsList = useMemo(() => {
      const missing = [];
      if (!photo) missing.push(t('profile_form_photo'));
      if (!fullName) missing.push(t('form_fullname_label'));
      if (!location) missing.push(t('profile_form_location'));
      if (!phone) missing.push(t('profile_form_phone'));
      if (!experience) missing.push(t('profile_form_experience'));
      if (!availability) missing.push(t('profile_form_availability'));
      if (!description) missing.push(t('profile_form_description'));
      return missing;
  }, [photo, fullName, location, phone, experience, availability, description, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setShowErrors(true);

    if (Object.values(errors).some(err => err)) {
      alert(t('alert_fix_errors'));
      return;
    }
    if (!photo || !fullName || !email || !phone || !experience || !location || !availability || !description) {
        alert(t('alert_fill_required_fields'));
        return;
    }
    
    setIsSubmitting(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    onSubmit({
      photo,
      fullName,
      email,
      phone,
      location,
      experience,
      certifications: certifications.split(',').map(c => c.trim()).filter(c => c),
      availability,
      availableDates,
      description
    });
    setIsSubmitting(false);
  };

  const getInputClass = (value: string, error?: string) => {
      const base = "mt-1 block w-full px-3 py-2 bg-[var(--bg-input)] border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--ring-accent)] focus:border-[var(--border-accent)] sm:text-sm text-[var(--text-primary)]";
      if (showErrors && (!value || error)) {
          return `${base} border-red-500 focus:ring-red-500 focus:border-red-500`;
      }
      return `${base} border-[var(--border-input)]`;
  }

  const labelStyles = "block text-sm font-medium text-[var(--text-secondary)]";

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md mb-6" role="alert">
            <p className="font-bold">{t('profile_form_congrats')}</p>
            <p>{t('profile_form_complete_prompt')}</p>
        </div>
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{t('profile_form_title')}</h2>
        <p className="text-[var(--text-secondary)]">{t('profile_form_subtitle')}</p>
      </div>

       <div className="max-w-lg mx-auto mb-6">
            <h4 className="text-sm font-semibold text-[var(--text-secondary)]">{t('profile_form_progress_title')}</h4>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                <div className="bg-[var(--accent-primary)] h-2.5 rounded-full transition-all duration-500" style={{ width: `${completionPercentage}%` }}></div>
            </div>
            <p className="text-xs text-[var(--text-light)] mt-1">{t('profile_form_progress_subtitle')}</p>
            
            {missingFieldsList.length > 0 && showErrors && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md transition-opacity duration-300">
                    <p className="text-sm font-medium text-red-800 mb-2">{t('profile_form_missing_fields_title')}:</p>
                    <ul className="list-disc list-inside text-xs text-red-700 grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {missingFieldsList.map(field => <li key={field}>{field}</li>)}
                    </ul>
                </div>
            )}
        </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
        
        <div>
          <label className={labelStyles}>{t('profile_form_photo')}<span className="text-red-500">*</span></label>
          <div className="mt-2 flex items-center gap-4">
            <span className={`inline-block h-20 w-20 rounded-full overflow-hidden bg-gray-100 ${showErrors && !photo ? 'ring-2 ring-red-500' : ''}`}>
              {photoPreview ? <img src={photoPreview} alt="Profile Preview" className="h-full w-full object-cover" /> : <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.997A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
            </span>
            <input type="file" id="photo" onChange={handlePhotoUpload} accept="image/*" required className="block w-full text-sm text-[var(--text-light)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"/>
          </div>
        </div>

        <div>
          <label htmlFor="fullName" className={labelStyles}>{t('form_fullname_label')}<span className="text-red-500">*</span></label>
          <input type="text" id="fullName" value={fullName} onChange={(e) => validateAndSet('fullName', e.target.value)} required className={getInputClass(fullName, errors.fullName)}/>
          {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
        </div>
        <div>
            <label htmlFor="email" className={labelStyles}>{t('form_email_label')}<span className="text-red-500">*</span></label>
            <input type="email" id="email" value={email} onChange={(e) => validateAndSet('email', e.target.value)} required className={getInputClass(email, errors.email)}/>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className={labelStyles}>{t('profile_form_location')}<span className="text-red-500">*</span></label>
          <LocationSelector 
            initialValue={location} 
            onChange={setLocation} 
            onCountryChange={setSelectedCountryIso}
            hasError={showErrors && !location}
          />
        </div>
         <div>
            <PhoneInput 
              label={t('profile_form_phone')}
              value={phone}
              onChange={setPhone}
              required
              forcedIsoCode={selectedCountryIso}
              hasError={showErrors && !phone}
            />
        </div>
        <hr className="border-[var(--border-color)]"/>
         <div>
          <label htmlFor="experience" className={labelStyles}>{t('profile_form_experience')}<span className="text-red-500">*</span></label>
          <input type="text" id="experience" value={experience} onChange={(e) => validateAndSet('experience', e.target.value)} placeholder="e.g., 5" required className={getInputClass(experience, errors.experience)}/>
          {errors.experience && <p className="text-red-500 text-xs mt-1">{errors.experience}</p>}
        </div>
        <div>
          <label htmlFor="availability" className={labelStyles}>{t('profile_form_availability')}<span className="text-red-500">*</span></label>
          <input type="text" id="availability" value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder={t('profile_form_availability_placeholder')} required className={getInputClass(availability)}/>
        </div>
        <div>
          <label className={labelStyles}>{t('calendar_title')}</label>
          <p className="text-xs text-[var(--text-light)] mb-2">{t('calendar_instructions')}</p>
          <Calendar availableDates={availableDates} onDateChange={handleAvailabilityChange} isEditable={true} />
        </div>
        <div>
          <label htmlFor="certifications" className={labelStyles}>{t('profile_form_certifications')}</label>
          <input type="text" id="certifications" value={certifications} onChange={(e) => setCertifications(e.target.value)} placeholder={t('profile_form_certifications_placeholder')} className={getInputClass(certifications)}/>
        </div>
        <div>
          <label htmlFor="description" className={labelStyles}>{t('profile_form_description')}<span className="text-red-500">*</span></label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} placeholder={t('profile_form_description_placeholder')} className={getInputClass(description)}/>
        </div>

        <div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)]'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--ring-accent)] transition-colors`}
          >
            {isSubmitting ? 'Saving...' : t('button_save_publish')}
          </button>
        </div>
      </form>
      <div className="mt-8 pt-6 border-t border-[var(--border-color)] flex justify-start">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-6 rounded-full disabled:opacity-50"
        >
          {t('button_back')}
        </button>
      </div>
    </div>
  );
};

export default NannyProfileForm;