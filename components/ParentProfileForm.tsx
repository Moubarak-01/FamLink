import React, { useState, useMemo } from 'react';
import { User, Child, ActivityCategory, SkillCategory } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import LocationInput from './LocationInput'; // Replaced LocationAutocomplete
import PhoneInput from './PhoneInput';

interface ParentProfileFormProps {
  user: User;
  onSubmit: (profileData: {
    fullName: string;
    photo: string;
    location: string;
    interests: ActivityCategory[];
    children: Child[];
    skillsToTeach: SkillCategory[];
    phone: string;
  }) => Promise<void> | void;
  onBack: () => void;
}

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = error => reject(error);
});

const ParentProfileForm: React.FC<ParentProfileFormProps> = ({ user, onSubmit, onBack }) => {
  const { t } = useLanguage();
  const [fullName, setFullName] = useState(user.fullName);
  const [photo, setPhoto] = useState(user.photo || '');
  const [photoPreview, setPhotoPreview] = useState(user.photo || '');
  const [location, setLocation] = useState<string>(typeof user.location === 'string' ? user.location : user.location?.address || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [selectedCountryIso, setSelectedCountryIso] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const [children, setChildren] = useState<Child[]>(user.children || []);
  const [interests, setInterests] = useState<ActivityCategory[]>(user.interests || []);
  const [skillsToTeach, setSkillsToTeach] = useState<SkillCategory[]>(user.skillsToTeach || []);

  const activityCategories: { key: ActivityCategory, label: string }[] = [
    { key: 'playdates', label: t('activity_cat_playdates') }, { key: 'walks', label: t('activity_cat_walks') },
    { key: 'workout', label: t('activity_cat_workout') }, { key: 'shopping', label: t('activity_cat_shopping') },
    { key: 'studying', label: t('activity_cat_studying') }, { key: 'dads', label: t('activity_cat_dads') },
    { key: 'other', label: t('activity_cat_other') },
  ];

  const [customInterestInput, setCustomInterestInput] = useState('');
  const [customSkillInput, setCustomSkillInput] = useState('');

  const standardInterestKeys = activityCategories.map(c => c.key);
  const customInterests = interests.filter(i => !standardInterestKeys.includes(i));

  const handleAddCustomInterest = () => {
    if (customInterestInput.trim()) {
      setInterests(prev => [...prev, customInterestInput.trim()]);
      setCustomInterestInput('');
    }
  };

  const skillCategories: { key: SkillCategory, label: string }[] = [
    { key: 'cooking', label: t('skill_cat_cooking') }, { key: 'cleaning', label: t('skill_cat_cleaning') },
    { key: 'tutoring', label: t('skill_cat_tutoring') }, { key: 'tech', label: t('skill_cat_tech') },
    { key: 'crafts', label: t('skill_cat_crafts') }, { key: 'other', label: t('skill_cat_other') },
  ];

  const standardSkillKeys = skillCategories.map(c => c.key);
  const customSkills = skillsToTeach.filter(s => !standardSkillKeys.includes(s));

  const handleAddCustomSkill = () => {
    if (customSkillInput.trim()) {
      setSkillsToTeach(prev => [...prev, customSkillInput.trim()]);
      setCustomSkillInput('');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoPreview(URL.createObjectURL(file));
      const base64 = await toBase64(file);
      setPhoto(base64);
    }
  };

  const handleAddChild = () => {
    setChildren([...children, { name: '', age: 0 }]);
  };

  const handleChildChange = (index: number, field: 'name' | 'age', value: string | number) => {
    const newChildren = [...children];
    if (field === 'name') {
      if (typeof value === 'string') {
        newChildren[index].name = value;
      }
    } else {
      newChildren[index].age = typeof value === 'string' ? parseInt(value, 10) || 0 : value;
    }
    setChildren(newChildren);
  };

  const handleRemoveChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  const handleInterestToggle = (interest: ActivityCategory) => {
    setInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]);
  };

  const handleSkillToggle = (skill: SkillCategory) => {
    setSkillsToTeach(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const missingFieldsList = useMemo(() => {
    const missing = [];
    if (!photo) missing.push(t('profile_form_photo'));
    if (!fullName.trim()) missing.push(t('form_fullname_label'));
    if (!location.trim()) missing.push(t('profile_form_location'));
    if (!phone) missing.push(t('profile_form_phone'));
    return missing;
  }, [photo, fullName, location, phone, t]);

  const completionPercentage = useMemo(() => {
    const requiredFields = [photo, fullName.trim(), location.trim(), phone];
    const filledFields = requiredFields.filter(Boolean).length;
    return (filledFields / requiredFields.length) * 100;
  }, [photo, fullName, location, phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setShowErrors(true);

    if (!photo || !fullName.trim() || !location.trim() || !phone) {
      alert(t('alert_fill_required_fields'));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ fullName, photo, location: location, interests, children, skillsToTeach, phone });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputClass = (value: string) => {
    const base = "mt-1 block w-full px-3 py-2 bg-[var(--bg-input)] border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--ring-accent)] focus:border-[var(--border-accent)] sm:text-sm text-[var(--text-primary)]";
    if (showErrors && !value) {
      return `${base} border-red-500 focus:ring-red-500 focus:border-red-500`;
    }
    return `${base} border-[var(--border-input)]`;
  }

  const labelStyles = "block text-sm font-medium text-[var(--text-secondary)]";
  const sectionTitleStyles = "text-lg font-medium text-[var(--text-primary)]";
  const sectionSubtitleStyles = "text-sm text-[var(--text-light)]";

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{t('parent_profile_form_title')}</h2>
        <p className="text-[var(--text-secondary)]">{t('parent_profile_form_subtitle')}</p>
        {!user.location && (
          <div className="mt-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md" role="alert">
            <p>{t('profile_form_mandatory_prompt')}</p>
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto mb-6">
        <h4 className="text-sm font-semibold text-[var(--text-secondary)]">{t('profile_form_progress_title')}</h4>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
          <div className="bg-[var(--accent-primary)] h-2.5 rounded-full transition-all duration-500" style={{ width: `${completionPercentage}%` }}></div>
        </div>
        <p className="text-xs text-[var(--text-light)] mt-1">{t('profile_form_progress_subtitle')}</p>

        {missingFieldsList.length > 0 && showErrors && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-left">
            <p className="text-sm font-medium text-red-800 mb-2">{t('profile_form_missing_fields_title')}:</p>
            <ul className="list-disc list-inside text-xs text-red-700 grid grid-cols-1 sm:grid-cols-2 gap-1">
              {missingFieldsList.map(field => <li key={field}>{field}</li>)}
            </ul>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-lg mx-auto">

        <div>
          <label className={labelStyles}>{t('profile_form_photo')}<span className="text-red-500">*</span></label>
          <div className="mt-2 flex items-center gap-4">
            <span className={`inline-block h-20 w-20 rounded-full overflow-hidden bg-gray-100 ${showErrors && !photo ? 'ring-2 ring-red-500' : ''}`}>
              {photoPreview ? <img src={photoPreview} alt="Profile Preview" className="h-full w-full object-cover" /> : <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.997A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
            </span>
            <input type="file" id="photo" onChange={handlePhotoUpload} accept="image/*" required={!photo} className="block w-full text-sm text-[var(--text-light)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100" />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="fullName" className={labelStyles}>{t('form_fullname_label')}<span className="text-red-500">*</span></label>
            <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required className={getInputClass(fullName)} />
          </div>
          <div>
            <label className={labelStyles}>{t('profile_form_location')}<span className="text-red-500">*</span></label>
            {/* UPDATED USAGE: Use LocationInput in autocomplete mode */}
            <LocationInput
              value={location}
              onChange={setLocation}
              placeholder="Search city (e.g. Paris, London)..."
              hasError={showErrors && !location}
              onCountryChange={setSelectedCountryIso}
            />
          </div>
          <div>
            <PhoneInput
              label={t('profile_form_phone')}
              value={phone}
              onChange={setPhone}
              forcedIsoCode={selectedCountryIso}
              required
              hasError={showErrors && !phone}
            />
          </div>
        </div>

        <hr className="border-[var(--border-color)]" />

        <div>
          <h3 className={sectionTitleStyles}>{t('parent_profile_children_title')}</h3>
          <div className="space-y-4 mt-2">
            {children.map((child, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-[var(--bg-card-subtle)] rounded-md">
                <input
                  type="text"
                  placeholder={t('child_name_label')}
                  value={child.name}
                  onChange={(e) => handleChildChange(index, 'name', e.target.value)}
                  className="flex-grow px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-md shadow-sm text-sm"
                />
                <input
                  type="number"
                  placeholder={t('child_age_label')}
                  value={child.age || ''}
                  onChange={(e) => handleChildChange(index, 'age', e.target.value)}
                  className="w-20 px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-md shadow-sm text-sm"
                  min="0"
                />
                <button type="button" onClick={() => handleRemoveChild(index)} className="text-red-500 hover:text-red-700 p-2">&times;</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={handleAddChild} className="mt-2 text-sm font-medium text-[var(--text-accent)] hover:text-[var(--accent-primary)]">{t('parent_profile_add_child')}</button>
        </div>

        <hr className="border-[var(--border-color)]" />

        <div>
          <h3 className={sectionTitleStyles}>{t('parent_profile_interests_title')}</h3>
          <p className={sectionSubtitleStyles}>{t('parent_profile_interests_subtitle')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {activityCategories.map(cat => (
              <button key={cat.key} type="button" onClick={() => handleInterestToggle(cat.key)} className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${interests.includes(cat.key) ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]' : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-input)] hover:bg-[var(--bg-hover)]'}`}>
                {cat.label}
              </button>
            ))}
            {/* Render Custom Interests as Chips */}
            {customInterests.map(custom => (
              <button key={custom} type="button" onClick={() => handleInterestToggle(custom as ActivityCategory)} className="px-3 py-1.5 text-sm rounded-full border bg-pink-100 text-pink-700 border-pink-200 hover:bg-red-100 flex items-center gap-1">
                {custom} <span className="text-xs">✕</span>
              </button>
            ))}
          </div>
          {interests.includes('other') && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={customInterestInput}
                onChange={e => setCustomInterestInput(e.target.value)}
                placeholder={t('profile_add_custom_interest') || "Add interest..."}
                className="px-3 py-1.5 text-sm bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-input)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] w-full max-w-xs"
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCustomInterest())}
              />
              <button type="button" onClick={handleAddCustomInterest} className="px-3 py-1.5 bg-[var(--accent-primary)] text-white rounded-md text-sm">
                +
              </button>
            </div>
          )}
        </div>

        <hr className="border-[var(--border-color)]" />

        <div>
          <h3 className={sectionTitleStyles}>{t('parent_profile_skills_title')}</h3>
          <p className={sectionSubtitleStyles}>{t('parent_profile_skills_subtitle')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {skillCategories.map(cat => (
              <button key={cat.key} type="button" onClick={() => handleSkillToggle(cat.key)} className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${skillsToTeach.includes(cat.key) ? 'bg-blue-500 text-white border-blue-500' : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-input)] hover:bg-[var(--bg-hover)]'}`}>
                {cat.label}
              </button>
            ))}
            {customSkills.map(custom => (
              <button key={custom} type="button" onClick={() => handleSkillToggle(custom as SkillCategory)} className="px-3 py-1.5 text-sm rounded-full border bg-blue-100 text-blue-700 border-blue-200 hover:bg-red-100 flex items-center gap-1">
                {custom} <span className="text-xs">✕</span>
              </button>
            ))}
          </div>
          {skillsToTeach.includes('other') && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={customSkillInput}
                onChange={e => setCustomSkillInput(e.target.value)}
                placeholder={t('profile_add_custom_skill') || "Add skill..."}
                className="px-3 py-1.5 text-sm bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-input)] rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 w-full max-w-xs"
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCustomSkill())}
              />
              <button type="button" onClick={handleAddCustomSkill} className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm">
                +
              </button>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-[var(--border-color)] flex flex-col sm:flex-row gap-4">
          <button type="button" onClick={onBack} disabled={isSubmitting} className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg disabled:opacity-50">
            {t('button_back')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full sm:w-auto flex-grow text-white font-bold py-3 px-4 rounded-lg shadow-sm transition-colors ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)]'}`}
          >
            {isSubmitting ? 'Saving...' : t('button_save_profile')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ParentProfileForm;