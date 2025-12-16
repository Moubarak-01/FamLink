import { Question } from './types';
import { TFunction } from './contexts/LanguageContext';

// NEW: Constant for Perplexity API Key retrieval in geminiService
export const PPLX_API_KEY_ENV = 'VITE_PPLX_API_KEY';

// NEW: Perplexity Model Constant (for assessment/specific tasks)
export const PPLX_MODEL = 'sonar-reasoning-pro';

// FINALIZED: Array of all Gemini models for chat failover
export const GEMINI_FALLBACK_MODELS: string[] = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite', 
  'gemini-2.5-flash-native-audio-dialog',
  'gemini-2.5-flash-tts',
  'gemini-robotics-er-1.5-preview',
  'gemma-3-27b',
  'gemma-3-12b',
  'gemma-3-4b',
  'gemma-3-2b',
  'gemma-3-1b',
];

// NEW: List of Perplexity models to try in sequential order for chat fallback
export const PPLX_FALLBACK_MODELS: string[] = [
  'sonar', // Default lightweight model for fast answers
  'sonar-reasoning', // For general chat that might need logic
  'sonar-pro', // Advanced search offering
  'sonar-reasoning-pro', // High-end reasoning
  'sonar-deep-research', // Specialized research model
];

export const ASSESSMENT_QUESTIONS = (t: TFunction): Question[] => [
  // Single-Choice (10 questions)
  {
    id: 1,
    type: 'single-choice',
    text: t('q1_text'),
    options: [t('q1_op1'), t('q1_op2'), t('q1_op3'), t('q1_op4')]
  },
  {
    id: 2,
    type: 'single-choice',
    text: t('q2_text'),
    options: [t('q2_op1'), t('q2_op2'), t('q2_op3'), t('q2_op4')]
  },
  {
    id: 3,
    type: 'single-choice',
    text: t('q3_text'),
    options: [t('q3_op1'), t('q3_op2'), t('q3_op3'), t('q3_op4')]
  },
  {
    id: 4,
    type: 'single-choice',
    text: t('q4_text'),
    options: [t('q4_op1'), t('q4_op2'), t('q4_op3'), t('q4_op4')]
  },
  {
    id: 5,
    type: 'single-choice',
    text: t('q5_text'),
    options: [t('q5_op1'), t('q5_op2'), t('q5_op3'), t('q5_op4')]
  },
  {
    id: 6,
    type: 'single-choice',
    text: t('q6_text'),
    options: [t('q6_op1'), t('q6_op2'), t('q6_op3'), t('q6_op4')]
  },
  {
    id: 7,
    type: 'single-choice',
    text: t('q7_text'),
    options: [t('q7_op1'), t('q7_op2'), t('q7_op3'), t('q7_op4')]
  },
  {
    id: 8,
    type: 'single-choice',
    text: t('q8_text'),
    options: [t('q8_op1'), t('q8_op2'), t('q8_op3'), t('q8_op4')]
  },
  {
    id: 9,
    type: 'single-choice',
    text: t('q9_text'),
    options: [t('q9_op1'), t('q9_op2'), t('q9_op3'), t('q9_op4')]
  },
  {
    id: 10,
    type: 'single-choice',
    text: t('q10_text'),
    options: [t('q10_op1'), t('q10_op2'), t('q10_op3'), t('q10_op4')]
  },
  // Multiple-Choice (3 questions)
  {
    id: 11,
    type: 'multiple-choice',
    text: t('q11_text'),
    options: [t('q11_op1'), t('q11_op2'), t('q11_op3'), t('q11_op4')]
  },
  {
    id: 12,
    type: 'multiple-choice',
    text: t('q12_text'),
    options: [t('q12_op1'), t('q12_op2'), t('q12_op3'), t('q12_op4')]
  },
  {
    id: 13,
    type: 'multiple-choice',
    text: t('q13_text'),
    options: [t('q13_op1'), t('q13_op2'), t('q13_op3'), t('q13_op4')]
  },
  // Open-Ended (2 questions)
  {
    id: 14,
    type: 'open-ended',
    text: t('q14_text'),
    options: []
  },
  {
    id: 15,
    type: 'open-ended',
    text: t('q15_text'),
    options: []
  },
  // New Single-Choice Questions
  {
    id: 16,
    type: 'single-choice',
    text: t('q16_text'),
    options: [t('q16_op1'), t('q16_op2'), t('q16_op3'), t('q16_op4')]
  },
  {
    id: 17,
    type: 'single-choice',
    text: t('q17_text'),
    options: [t('q17_op1'), t('q17_op2'), t('q17_op3'), t('q17_op4')]
  },
  {
    id: 18,
    type: 'single-choice',
    text: t('q18_text'),
    options: [t('q18_op1'), t('q18_op2'), t('q18_op3'), t('q18_op4')]
  },
  {
    id: 19,
    type: 'single-choice',
    text: t('q19_text'),
    options: [t('q19_op1'), t('q19_op2'), t('q19_op3'), t('q19_op4')]
  },
  {
    id: 20,
    type: 'single-choice',
    text: t('q20_text'),
    options: [t('q20_op1'), t('q20_op2'), t('q20_op3'), t('q20_op4')]
  },
  // New Multiple-Choice Questions
  {
    id: 21,
    type: 'multiple-choice',
    text: t('q21_text'),
    options: [t('q21_op1'), t('q21_op2'), t('q21_op3'), t('q21_op4')]
  },
  {
    id: 22,
    type: 'multiple-choice',
    text: t('q22_text'),
    options: [t('q22_op1'), t('q22_op2'), t('q22_op3'), t('q22_op4')]
  },
  // New Open-Ended Questions
  {
    id: 23,
    type: 'open-ended',
    text: t('q23_text'),
    options: []
  },
  {
    id: 24,
    type: 'open-ended',
    text: t('q24_text'),
    options: []
  },
  // Expansion to 50 questions
  {
    id: 25,
    type: 'single-choice',
    text: t('q25_text'),
    options: [t('q25_op1'), t('q25_op2'), t('q25_op3'), t('q25_op4')]
  },
  {
    id: 26,
    type: 'single-choice',
    text: t('q26_text'),
    options: [t('q26_op1'), t('q26_op2'), t('q26_op3'), t('q26_op4')]
  },
  {
    id: 27,
    type: 'single-choice',
    text: t('q27_text'),
    options: [t('q27_op1'), t('q27_op2'), t('q27_op3'), t('q27_op4')]
  },
  {
    id: 28,
    type: 'single-choice',
    text: t('q28_text'),
    options: [t('q28_op1'), t('q28_op2'), t('q28_op3'), t('q28_op4')]
  },
  {
    id: 29,
    type: 'single-choice',
    text: t('q29_text'),
    options: [t('q29_op1'), t('q29_op2'), t('q29_op3'), t('q29_op4')]
  },
  {
    id: 30,
    type: 'single-choice',
    text: t('q30_text'),
    options: [t('q30_op1'), t('q30_op2'), t('q30_op3'), t('q30_op4')]
  },
  {
    id: 31,
    type: 'single-choice',
    text: t('q31_text'),
    options: [t('q31_op1'), t('q31_op2'), t('q31_op3'), t('q31_op4')]
  },
  {
    id: 32,
    type: 'single-choice',
    text: t('q32_text'),
    options: [t('q32_op1'), t('q32_op2'), t('q32_op3'), t('q32_op4')]
  },
  {
    id: 33,
    type: 'single-choice',
    text: t('q33_text'),
    options: [t('q33_op1'), t('q33_op2'), t('q33_op3'), t('q33_op4')]
  },
  {
    id: 34,
    type: 'single-choice',
    text: t('q34_text'),
    options: [t('q34_op1'), t('q34_op2'), t('q34_op3'), t('q34_op4')]
  },
  {
    id: 35,
    type: 'single-choice',
    text: t('q35_text'),
    options: [t('q35_op1'), t('q35_op2'), t('q35_op3'), t('q35_op4')]
  },
  {
    id: 36,
    type: 'single-choice',
    text: t('q36_text'),
    options: [t('q36_op1'), t('q36_op2'), t('q36_op3'), t('q36_op4')]
  },
  {
    id: 37,
    type: 'single-choice',
    text: t('q37_text'),
    options: [t('q37_op1'), t('q37_op2'), t('q37_op3'), t('q37_op4')]
  },
  {
    id: 38,
    type: 'single-choice',
    text: t('q38_text'),
    options: [t('q38_op1'), t('q38_op2'), t('q38_op3'), t('q38_op4')]
  },
  {
    id: 39,
    type: 'single-choice',
    text: t('q39_text'),
    options: [t('q39_op1'), t('q39_op2'), t('q39_op3'), t('q39_op4')]
  },
  {
    id: 40,
    type: 'multiple-choice',
    text: t('q40_text'),
    options: [t('q40_op1'), t('q40_op2'), t('q40_op3'), t('q40_op4')]
  },
  {
    id: 41,
    type: 'multiple-choice',
    text: t('q41_text'),
    options: [t('q41_op1'), t('q41_op2'), t('q41_op3'), t('q41_op4')]
  },
  {
    id: 42,
    type: 'multiple-choice',
    text: t('q42_text'),
    options: [t('q42_op1'), t('q42_op2'), t('q42_op3'), t('q42_op4')]
  },
  {
    id: 43,
    type: 'multiple-choice',
    text: t('q43_text'),
    options: [t('q43_op1'), t('q43_op2'), t('q43_op3'), t('q43_op4')]
  },
  {
    id: 44,
    type: 'multiple-choice',
    text: t('q44_text'),
    options: [t('q44_op1'), t('q44_op2'), t('q44_op3'), t('q44_op4')]
  },
  {
    id: 45,
    type: 'multiple-choice',
    text: t('q45_text'),
    options: [t('q45_op1'), t('q45_op2'), t('q45_op3'), t('q45_op4')]
  },
  {
    id: 46,
    type: 'open-ended',
    text: t('q46_text'),
    options: []
  },
  {
    id: 47,
    type: 'open-ended',
    text: t('q47_text'),
    options: []
  },
  {
    id: 48,
    type: 'open-ended',
    text: t('q48_text'),
    options: []
  },
  {
    id: 49,
    type: 'open-ended',
    text: t('q49_text'),
    options: []
  },
  {
    id: 50,
    type: 'open-ended',
    text: t('q50_text'),
    options: []
  }
];


export const LOCATION_OPTIONS = [ /* ... */ ];
export const THEME_MODES = [ /* ... */ ];
export const LANGUAGE_OPTIONS = [ /* ... */ ];
export const DEFAULT_LANGUAGE = 'en';
export const DEFAULT_THEME = 'light';
export const MAP_CENTER = { lat: 34.0522, lng: -118.2437 }; // Los Angeles
export const MAP_ZOOM = 10;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_REVIEWS_DISPLAY = 3;