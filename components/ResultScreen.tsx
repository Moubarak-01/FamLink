
import React, { useState, useEffect } from 'react';
import { AssessmentResult } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ResultScreenProps {
  result: AssessmentResult;
  onContinue: () => void;
  onRestart: () => void;
  onBack: () => void;
  isSuspended?: boolean;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ result, onContinue, onRestart, onBack, isSuspended }) => {
  const { t } = useLanguage();
  const [showFullResult, setShowFullResult] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFullResult(true);
    }, 2500); // 2.5 second delay
    return () => clearTimeout(timer);
  }, []);


  const getResultUI = (decision: string) => {
    switch (decision) {
      case 'Approved':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          darkTextColor: 'dark:text-green-300',
          borderColor: 'border-green-500',
          darkBgColor: 'dark:bg-green-900/50',
          darkBorderColor: 'dark:border-green-500',
          icon: '🎉',
          title: t('result_passed_title'),
          message: t('result_passed_message'),
        };
      case 'Rejected':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          darkTextColor: 'dark:text-red-300',
          borderColor: 'border-red-500',
          darkBgColor: 'dark:bg-red-900/50',
          darkBorderColor: 'dark:border-red-500',
          icon: '😔',
          title: t('result_failed_title'),
          message: t('result_failed_message'),
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          darkTextColor: 'dark:text-gray-300',
          borderColor: 'border-gray-500',
          darkBgColor: 'dark:bg-gray-700/50',
          darkBorderColor: 'dark:border-gray-500',
          icon: '📋',
          title: t('result_default_title'),
          message: t('result_default_message'),
        };
    }
  };

  const { score, feedback, decision } = result;
  const ui = getResultUI(decision);
  const isApproved = decision === 'Approved';
  const scoreColor = isApproved ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]';
  const feedbackBg = isApproved ? 'bg-green-100/60 dark:bg-green-900/30' : 'bg-red-100/60 dark:bg-red-900/30';
  const feedbackBorder = isApproved ? 'border-green-500/50' : 'border-red-500/50';
  const feedbackTitleColor = isApproved ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200';

  return (
    <div className="p-8 text-center transition-all duration-500">
      {!showFullResult ? (
        <div className="min-h-[300px] flex flex-col justify-center items-center">
           <h2 className="text-2xl font-bold text-[var(--text-secondary)] mb-4">{t('result_calculating')}</h2>
           <p className="text-[var(--text-light)]">{t('loading_message')}</p>
        </div>
      ) : (
        <>
            <div className="mb-4">
                <span className="text-6xl">{ui.icon}</span>
            </div>
            <h2 className={`text-3xl font-bold mb-3 ${scoreColor}`}>{ui.title}</h2>
            
            <p className="text-[var(--text-secondary)]">{t('result_your_score_is')}</p>
            <div className={`text-6xl font-extrabold mb-4 ${scoreColor}`}>{score}<span className="text-4xl font-medium">%</span></div>

            <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">{ui.message}</p>
            
            <div className={`p-4 rounded-lg text-left border-l-4 ${feedbackBg} ${feedbackBorder}`}>
                <h4 className={`font-semibold ${feedbackTitleColor}`}>{t('result_feedback_title')}:</h4>
                <p className="text-[var(--text-secondary)] mt-1 italic">"{feedback}"</p>
            </div>
            
            {isSuspended && (
               <div className="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                  <p className="font-bold">{t('account_suspended_title')}</p>
                  <p className="text-sm">{t('account_suspended_message')}</p>
               </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                {isApproved ? (
                <button
                    onClick={onContinue}
                    className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300 ease-in-out"
                >
                    {t('button_create_profile')}
                </button>
                ) : (
                    !isSuspended && (
                        <button
                            onClick={onRestart}
                            className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300 ease-in-out"
                        >
                            {t('button_retake_assessment')}
                        </button>
                    )
                )}
                <button
                onClick={onBack}
                className="font-medium text-[var(--text-light)] hover:text-[var(--text-accent)] transition-colors"
                >
                {t('button_back')}
                </button>
            </div>
       </>
      )}
    </div>
  );
};

export default ResultScreen;
