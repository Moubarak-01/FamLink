import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

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
        <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">Settings</h2>

        <div className="mb-6">
          {/* Audio Settings */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-[var(--text-secondary)]">Noise Reduction</span>
            <button onClick={onToggleNoiseReduction} className={`w-12 h-6 rounded-full transition-colors ${noiseReductionEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${noiseReductionEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Shortcuts Section */}
          <div className="border-t border-[var(--border-color)] pt-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Keyboard Shortcuts</h3>
            <div className="space-y-2">
              {/* IMPLEMENTATION: Shift + P for Settings Modal */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)]">{t('shortcut_open_settings')}</span>
                <kbd className="bg-[var(--bg-input)] border border-[var(--border-input)] rounded px-2 py-1 text-xs text-[var(--text-primary)] font-mono shadow-sm">Shift + P</kbd>
              </div>
              {/* UPDATED: Shift + N toggles chat open/close */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)]">Toggle AI Chat Open/Close</span>
                <kbd className="bg-[var(--bg-input)] border border-[var(--border-input)] rounded px-2 py-1 text-xs text-[var(--text-primary)] font-mono shadow-sm">Shift + N</kbd>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)]">Toggle AI Visibility</span>
                <kbd className="bg-[var(--bg-input)] border border-[var(--border-input)] rounded px-2 py-1 text-xs text-[var(--text-primary)] font-mono shadow-sm">Shift + A</kbd>
              </div>
              {/* NEW: Control + D clears history */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)]">Clear AI Chat History</span>
                <kbd className="bg-[var(--bg-input)] border border-[var(--border-input)] rounded px-2 py-1 text-xs text-[var(--text-primary)] font-mono shadow-sm">Ctrl + D</kbd>
              </div>
            </div>
            {/* Danger Zone */}
            <div className="border-t border-[var(--border-color)] pt-4 mt-6">
              <h3 className="text-sm font-semibold text-red-600 mb-3">Danger Zone</h3>
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                    onDeleteAccount();
                  }
                }}
                className="w-full text-left px-4 py-3 bg-[var(--bg-status-red)] text-[var(--text-status-red)] rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Account
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