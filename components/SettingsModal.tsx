import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface SettingsModalProps {
  onClose: () => void;
  noiseReductionEnabled: boolean;
  onToggleNoiseReduction: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, noiseReductionEnabled, onToggleNoiseReduction }) => {
  // Simple internal translations for settings
  const t = (key: string) => {
      const map: Record<string, string> = {
          'settings_title': 'Settings',
          'settings_accessibility': 'Accessibility',
          'settings_noise_reduction': 'Noise Reduction',
          'settings_noise_reduction_desc': 'Simulate audio processing for clearer calls',
          'settings_shortcuts': 'Keyboard Shortcuts',
          'settings_shortcut_ai': 'Open AI Assistant',
          'settings_shortcut_toggle': 'Toggle Assistant Visibility',
          'button_close': 'Close'
      };
      return map[key] || key;
  };

  return (
    <div className="fixed inset-0 bg-[var(--modal-overlay)] flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{t('settings_title')}</h2>
            <button onClick={onClose} className="text-[var(--text-light)] hover:text-[var(--text-primary)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <div className="p-6 space-y-6">
            {/* Accessibility Section */}
            <div>
                <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">{t('settings_accessibility')}</h3>
                <div className="flex items-center justify-between bg-[var(--bg-card-subtle)] p-4 rounded-lg border border-[var(--border-color)]">
                    <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-full ${noiseReductionEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                         </div>
                         <div>
                             <p className="font-medium text-[var(--text-primary)]">{t('settings_noise_reduction')}</p>
                             <p className="text-xs text-[var(--text-light)]">{t('settings_noise_reduction_desc')}</p>
                         </div>
                    </div>
                    <button 
                        onClick={onToggleNoiseReduction}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring-accent)] focus:ring-offset-2 ${noiseReductionEnabled ? 'bg-[var(--accent-primary)]' : 'bg-gray-300'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${noiseReductionEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

            {/* Keyboard Shortcuts Section */}
            <div>
                <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">{t('settings_shortcuts')}</h3>
                <div className="space-y-2">
                    <div className="flex justify-between items-center bg-[var(--bg-card-subtle)] p-3 rounded-lg border border-[var(--border-color)]">
                        <span className="text-sm text-[var(--text-primary)]">{t('settings_shortcut_ai')}</span>
                        <kbd className="px-2 py-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-xs text-[var(--text-secondary)] font-mono">Shift + N</kbd>
                    </div>
                     <div className="flex justify-between items-center bg-[var(--bg-card-subtle)] p-3 rounded-lg border border-[var(--border-color)]">
                        <span className="text-sm text-[var(--text-primary)]">{t('settings_shortcut_toggle')}</span>
                        <kbd className="px-2 py-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-xs text-[var(--text-secondary)] font-mono">Shift + A</kbd>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="p-6 border-t border-[var(--border-color)]">
             <button onClick={onClose} className="w-full bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-bold py-3 rounded-lg transition-colors border border-[var(--border-color)]">
                {t('button_close')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;