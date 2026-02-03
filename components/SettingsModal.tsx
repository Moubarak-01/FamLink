import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';

interface SettingsModalProps {
  onClose: () => void;
  noiseReductionEnabled: boolean;
  onToggleNoiseReduction: () => void;
  onDeleteAccount: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, noiseReductionEnabled, onToggleNoiseReduction, onDeleteAccount }) => {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 bg-[var(--modal-overlay)] flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-md p-6 border border-[var(--border-color)]" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">{t('settings_title')}</h2>

        <div className="mb-6">
          {/* Audio Settings */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-[var(--text-secondary)]">{t('settings_noise_reduction')}</span>
            <button onClick={onToggleNoiseReduction} className={`w-12 h-6 rounded-full transition-colors ${noiseReductionEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${noiseReductionEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Google Calendar Integration */}
          <div className="mb-6 border-t border-[var(--border-color)] pt-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Integrations</h3>
            <button
              onClick={() => {
                api.get('/calendar/auth-url')
                  .then(res => {
                    if (res.data && res.data.url) window.location.href = res.data.url;
                  })
                  .catch(err => console.error('Failed to get auth url', err));
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-all text-gray-700 font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
              </svg>
              Sync with Google Calendar
            </button>
            <p className="text-xs text-[var(--text-secondary)] mt-2 text-center">
              Sync your confirmed bookings automatically.
            </p>
          </div>

          {/* Shortcuts Section */}
          <div className="border-t border-[var(--border-color)] pt-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{t('settings_keyboard_shortcuts')}</h3>
            <div className="space-y-2">
              {/* IMPLEMENTATION: Shift + P for Settings Modal */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)]">{t('shortcut_open_settings')}</span>
                <kbd className="bg-[var(--bg-input)] border border-[var(--border-input)] rounded px-2 py-1 text-xs text-[var(--text-primary)] font-mono shadow-sm">Shift + P</kbd>
              </div>
              {/* UPDATED: Shift + N toggles chat open/close */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)]">{t('settings_shortcut_toggle_chat')}</span>
                <kbd className="bg-[var(--bg-input)] border border-[var(--border-input)] rounded px-2 py-1 text-xs text-[var(--text-primary)] font-mono shadow-sm">Shift + N</kbd>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)]">{t('settings_shortcut_toggle_visibility')}</span>
                <kbd className="bg-[var(--bg-input)] border border-[var(--border-input)] rounded px-2 py-1 text-xs text-[var(--text-primary)] font-mono shadow-sm">Shift + A</kbd>
              </div>
              {/* NEW: Control + D clears history */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)]">{t('settings_shortcut_clear_history')}</span>
                <kbd className="bg-[var(--bg-input)] border border-[var(--border-input)] rounded px-2 py-1 text-xs text-[var(--text-primary)] font-mono shadow-sm">Ctrl + D</kbd>
              </div>
            </div>
            {/* Danger Zone */}
            <div className="border-t border-[var(--border-color)] pt-4 mt-6">
              <h3 className="text-sm font-semibold text-red-600 mb-3">{t('settings_danger_zone')}</h3>
              <button
                onClick={() => {
                  if (window.confirm(t('settings_delete_account_confirm'))) {
                    onDeleteAccount();
                  }
                }}
                className="w-full text-left px-4 py-3 bg-[var(--bg-status-red)] text-[var(--text-status-red)] rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {t('settings_delete_account')}
              </button>
            </div>
          </div>
        </div>

        <button onClick={onClose} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 rounded-lg transition-colors">
          {t('button_close')}
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;