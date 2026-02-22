
import React, { useState, useMemo, useEffect } from 'react';
import { ASSESSMENT_QUESTIONS } from '../constants';
import { getRandomParentQuestionIds, getParentAssessmentQuestionsBank } from '../data/parentAssessment';
import { Answer, Question, User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface QuestionnaireProps {
  user: User;
  onSubmit: (answers: Answer[]) => void;
  error: string | null;
  onBack: () => void;
}

// Fisher-Yates shuffle algorithm
const shuffleArray = (array: any[]) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};


const Questionnaire: React.FC<QuestionnaireProps> = ({ user, onSubmit, error, onBack }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // Auto-load saved answers
  const [answers, setAnswers] = useState<Answer[]>(() => {
    try {
      const saved = localStorage.getItem('questionnaire_backup');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  // Auto-save answers
  useEffect(() => {
    localStorage.setItem('questionnaire_backup', JSON.stringify(answers));
  }, [answers]);
  const { t, language } = useLanguage();

  const [selectedQuestionIds, setSelectedQuestionIds] = useState<(number | string)[]>([]);

  // Initialize questions once on mount to prevent reshuffling on language change
  useEffect(() => {
    if (user.userType === 'parent') {
      // Pull 25 random psychometric IDs from the 80-question bank
      setSelectedQuestionIds(getRandomParentQuestionIds(25));
      return;
    }

    // Nanny Logic
    // Use the current 't' for initial selection structure (IDs don't change based on language)
    const allQuestions = ASSESSMENT_QUESTIONS(t);

    // Separate questions by type
    const singleChoice = allQuestions.filter(q => q.type === 'single-choice');
    const multipleChoice = allQuestions.filter(q => q.type === 'multiple-choice');
    const openEnded = allQuestions.filter(q => q.type === 'open-ended');

    // Select specific amounts (25 total for nanny assessment)
    const selectedSingle = shuffleArray([...singleChoice]).slice(0, 13);
    const selectedMultiple = shuffleArray([...multipleChoice]).slice(0, 7);
    const selectedOpen = shuffleArray([...openEnded]).slice(0, 5);

    // Combine and shuffle final set
    const combined = [...selectedSingle, ...selectedMultiple, ...selectedOpen];
    const finalSet = shuffleArray(combined);

    setSelectedQuestionIds(finalSet.map(q => q.id));
  }, []); // Empty dependency array = run once on mount

  const questions = useMemo(() => {
    if (selectedQuestionIds.length === 0) return [];

    if (user.userType === 'parent') {
      const allParentQuestions = getParentAssessmentQuestionsBank(t);
      return selectedQuestionIds.map(id =>
        allParentQuestions.find(q => q.id === id)
      ).filter((q): q is any => !!q) as unknown as Question[]; // Mapped gracefully to unify type mapping in component
    }

    const allTranslatedQuestions = ASSESSMENT_QUESTIONS(t);
    // Map the stored IDs to the current language's question objects
    return selectedQuestionIds.map(id =>
      allTranslatedQuestions.find(q => q.id === id)
    ).filter((q): q is Question => !!q);
  }, [t, selectedQuestionIds, user.userType]);

  // HOOKS MUST BE UNCONDITIONAL - MOVED UP
  const isSuspended = useMemo(() => {
    if (user.userType === 'nanny' && user.suspendedUntil) {
      return new Date(user.suspendedUntil) > new Date();
    }
    return false;
  }, [user]);

  const suspensionRemainingText = useMemo(() => {
    if (isSuspended && user.suspendedUntil) {
      const end = new Date(user.suspendedUntil).getTime();
      const now = new Date().getTime();
      const diff = end - now;

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours} ${t('unit_hours')} ${minutes} ${t('unit_minutes')}`;
      }
    }
    return '';
  }, [isSuspended, user.suspendedUntil, t]);

  const currentQuestion = questions[currentQuestionIndex];
  const isMultiAnswer = currentQuestion?.type === 'multiple-choice' || currentQuestion?.type === 'multiple_answer';
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?.id)?.answer || (isMultiAnswer ? [] : '');

  const isCurrentQuestionAnswered = useMemo(() => {
    if (!currentQuestion) return false;
    // Multiple-answer types (nanny: 'multiple-choice', parent: 'multiple_answer')
    if (currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'multiple_answer') {
      return Array.isArray(currentAnswer) && currentAnswer.length > 0;
    }
    // Free-text types (nanny: 'open-ended', parent: 'text_input')
    if (currentQuestion.type === 'open-ended' || currentQuestion.type === 'text_input') {
      return typeof currentAnswer === 'string' && currentAnswer.trim().length > 3;
    }
    // Single-choice types (nanny: 'single-choice', parent: 'multiple_choice')
    return typeof currentAnswer === 'string' && currentAnswer !== '';
  }, [currentAnswer, currentQuestion]);

  useEffect(() => {
    setValidationError(null); // Clear validation error on question change
  }, [currentQuestionIndex]);

  // CONDITIONAL RENDERING NOW HAPPENS AFTER ALL HOOKS
  if (isSuspended) {
    return (
      <div className="p-8 text-center min-h-[400px] flex flex-col justify-center items-center">
        <div className="mb-4 text-5xl">🛑</div>
        <h2 className="text-2xl font-bold text-[var(--accent-red)] mb-4">{t('account_suspended_title')}</h2>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto">{t('account_suspended_message')}</p>
        <p className="text-[var(--text-secondary)] mt-4">{t('account_suspended_try_again')}</p>
        <p className="text-lg font-semibold text-[var(--text-primary)] mt-2 bg-[var(--bg-accent-light)] px-4 py-2 rounded-lg">{suspensionRemainingText}</p>
        <div className="mt-8">
          <button onClick={onBack} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-6 rounded-full">
            {t('button_back')}
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return <div className="p-8 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)] mx-auto"></div></div>;
  }





  const handleAnswerUpdate = (answerValue: string | string[]) => {
    const questionId = currentQuestion.id;
    const newAnswers = answers.filter(a => a.questionId !== questionId);
    setAnswers([...newAnswers, { questionId, answer: answerValue }]);
    setValidationError(null);
  };

  const handleSingleChoice = (option: string) => {
    handleAnswerUpdate(option);
  };

  const handleMultipleChoice = (option: string) => {
    const currentSelection = (Array.isArray(currentAnswer) ? currentAnswer : []) as string[];
    const newSelection = currentSelection.includes(option)
      ? currentSelection.filter(item => item !== option)
      : [...currentSelection, option];
    handleAnswerUpdate(newSelection);
  };

  const handleOpenEndedChange = (text: string) => {
    handleAnswerUpdate(text);
  };

  const goToNextQuestion = () => {
    if (!isCurrentQuestionAnswered) {
      setValidationError(t('alert_answer_required'));
      return;
    }
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const progressPercentage = (answers.length / questions.length) * 100;

  // Helper: extract display text from an option (handles both {id, text} objects and plain strings)
  const getOptionText = (option: any): string => {
    return typeof option === 'object' && option.text ? option.text : String(option);
  };
  // Helper: get the value to store for an option (use 'id' if available, otherwise the string itself)
  const getOptionValue = (option: any): string => {
    return typeof option === 'object' && option.id ? option.id : String(option);
  };

  const renderAnswerOptions = () => {
    switch (currentQuestion.type) {
      // === SINGLE-CHOICE: pick one answer (nanny: 'single-choice', parent: 'multiple_choice') ===
      case 'single-choice':
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {currentQuestion.options.map((option: any, index: number) => {
              const value = getOptionValue(option);
              const text = getOptionText(option);
              return (
                <button
                  key={index}
                  onClick={() => handleSingleChoice(value)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 text-[var(--text-primary)] ${currentAnswer === value
                    ? 'bg-[var(--bg-accent-light)] border-[var(--border-accent)] ring-2 ring-[var(--ring-accent)]'
                    : 'bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-accent-light)] border-[var(--border-color)] hover:border-[var(--border-accent)]'
                    }`}
                >
                  {text}
                </button>
              );
            })}
          </div>
        );
      // === MULTIPLE-ANSWER: pick many answers (nanny: 'multiple-choice', parent: 'multiple_answer') ===
      case 'multiple-choice':
      case 'multiple_answer':
        return (
          <div className="space-y-3">
            {currentQuestion.options.map((option: any, index: number) => {
              const value = getOptionValue(option);
              const text = getOptionText(option);
              const isSelected = (currentAnswer as string[]).includes(value);
              return (
                <button
                  key={index}
                  onClick={() => handleMultipleChoice(value)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-4 text-[var(--text-primary)] ${isSelected
                    ? 'bg-[var(--bg-accent-light)] border-[var(--border-accent)] ring-2 ring-[var(--ring-accent)]'
                    : 'bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-accent-light)] border-[var(--border-color)] hover:border-[var(--border-accent)]'
                    }`}
                >
                  <div className={`w-5 h-5 border-2 rounded ${isSelected ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]' : 'border-gray-300'}`}></div>
                  <span>{text}</span>
                </button>
              );
            })}
          </div>
        );
      // === FREE TEXT: type an answer (nanny: 'open-ended', parent: 'text_input') ===
      case 'open-ended':
      case 'text_input':
        return (
          <textarea
            value={currentAnswer as string}
            onChange={(e) => handleOpenEndedChange(e.target.value)}
            rows={5}
            placeholder={t('profile_form_description_placeholder')}
            className="mt-1 block w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--ring-accent)] focus:border-[var(--border-accent)] sm:text-sm text-[var(--text-primary)]"
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <div className="flex justify-between mb-1">
          <span className="text-base font-medium text-[var(--text-accent)]">{user.userType === 'parent' ? t('parent_assessment_title') : t('questionnaire_title')}</span>
          <span className="text-sm font-medium text-[var(--text-accent)]">{currentQuestionIndex + 1}/{questions.length}</span>
        </div>
        <div className="w-full bg-[var(--bg-accent-light)] rounded-full h-2.5">
          <div className="bg-[var(--accent-primary)] h-2.5 rounded-full transition-all duration-500" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
        </div>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
        <strong className="font-bold">{t('error_oops')}</strong>
        <span className="block sm:inline ml-2">{error}</span>
      </div>}
      {validationError && <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
        <span className="block sm:inline">{validationError}</span>
      </div>}


      <div className="mb-6 min-h-[80px]">
        <p className="text-sm text-[var(--text-light)] mb-1">{t('questionnaire_question_of', { current: currentQuestionIndex + 1, total: questions.length })}</p>
        <h3 className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)]">{currentQuestion.text}</h3>
      </div>

      {renderAnswerOptions()}

      <div className="mt-8 pt-6 border-t border-[var(--border-color)] flex justify-between items-center">
        <button onClick={onBack} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-6 rounded-full">
          {t('button_back')}
        </button>
        <div className="flex items-center gap-2">
          <button onClick={goToPrevQuestion} disabled={currentQuestionIndex === 0} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold py-2 px-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed">
            {t('button_prev')}
          </button>
          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={() => {
                if (!isCurrentQuestionAnswered) {
                  setValidationError(t('alert_answer_required'));
                  return;
                }
                onSubmit(answers)
              }}
              className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-bold py-2 px-6 rounded-full shadow-md transform hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isCurrentQuestionAnswered}
            >
              {t('button_submit_assessment')}
            </button>
          ) : (
            <button
              onClick={goToNextQuestion}
              className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-bold py-2 px-6 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('button_next')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Questionnaire;
