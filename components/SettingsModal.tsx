import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface SettingsModalProps {
  onClose: () => void;
  noiseReductionEnabled: boolean;
  onToggleNoiseReduction: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, noiseReductionEnabled, onToggleNoiseReduction }) => {
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
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-[var(--text-secondary)]">Open AI Chat</span>
                        <kbd className="bg-[var(--bg-input)] border border-[var(--border-input)] rounded px-2 py-1 text-xs text-[var(--text-primary)] font-mono shadow-sm">Shift + N</kbd>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-[var(--text-secondary)]">Toggle AI Visibility</span>
                        <kbd className="bg-[var(--bg-input)] border border-[var(--border-input)] rounded px-2 py-1 text-xs text-[var(--text-primary)] font-mono shadow-sm">Shift + A</kbd>
                    </div>
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