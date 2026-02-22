import { Question } from './types';
import { TFunction } from './contexts/LanguageContext';

// NEW: Constant for Perplexity API Key retrieval in geminiService
export const PPLX_API_KEY_ENV = 'VITE_PPLX_API_KEY';

// NEW: Perplexity Model Constant (for assessment/specific tasks)
export const PPLX_MODEL = 'sonar-reasoning-pro';

// NEW: OpenRouter API Key constant
export const OPENROUTER_API_KEY_ENV = 'VITE_OPENROUTER_API_KEY';

// NEW: OpenRouter Free Models - Tier 1 (Primary)
// These are the best free models available on OpenRouter as of Jan 2026
export const OPENROUTER_FREE_MODELS: string[] = [
  'meta-llama/llama-3.3-70b-instruct:free', // TIER 1: Best Logic (volatile)
  'google/gemini-2.0-flash-exp:free',       // Stable & Smart
  'arcee-ai/trinity-large-preview:free',    // Corrected ID
  'nvidia/nemotron-3-nano:free',            // Corrected ID
  'xiaomi/mimo-v2-flash:free',              // Re-added (Recommended)
  'openai/gpt-oss-120b:free',               // User Request
  'z-ai/glm-4.5-air:free',                  // Stable Fallback (Last Resort)
];

// FINALIZED: Array of all Gemini models for chat failover
export const GEMINI_FALLBACK_MODELS: string[] = [
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
  },
  // IDs 51-80: Single-Choice
  { id: 51, type: 'single-choice', text: t('q51_text'), options: [t('q51_op1'), t('q51_op2'), t('q51_op3'), t('q51_op4')] },
  { id: 52, type: 'single-choice', text: t('q52_text'), options: [t('q52_op1'), t('q52_op2'), t('q52_op3'), t('q52_op4')] },
  { id: 53, type: 'single-choice', text: t('q53_text'), options: [t('q53_op1'), t('q53_op2'), t('q53_op3'), t('q53_op4')] },
  { id: 54, type: 'single-choice', text: t('q54_text'), options: [t('q54_op1'), t('q54_op2'), t('q54_op3'), t('q54_op4')] },
  { id: 55, type: 'single-choice', text: t('q55_text'), options: [t('q55_op1'), t('q55_op2'), t('q55_op3'), t('q55_op4')] },
  { id: 56, type: 'single-choice', text: t('q56_text'), options: [t('q56_op1'), t('q56_op2'), t('q56_op3'), t('q56_op4')] },
  { id: 57, type: 'single-choice', text: t('q57_text'), options: [t('q57_op1'), t('q57_op2'), t('q57_op3'), t('q57_op4')] },
  { id: 58, type: 'single-choice', text: t('q58_text'), options: [t('q58_op1'), t('q58_op2'), t('q58_op3'), t('q58_op4')] },
  { id: 59, type: 'single-choice', text: t('q59_text'), options: [t('q59_op1'), t('q59_op2'), t('q59_op3'), t('q59_op4')] },
  { id: 60, type: 'single-choice', text: t('q60_text'), options: [t('q60_op1'), t('q60_op2'), t('q60_op3'), t('q60_op4')] },
  { id: 61, type: 'single-choice', text: t('q61_text'), options: [t('q61_op1'), t('q61_op2'), t('q61_op3'), t('q61_op4')] },
  { id: 62, type: 'single-choice', text: t('q62_text'), options: [t('q62_op1'), t('q62_op2'), t('q62_op3'), t('q62_op4')] },
  { id: 63, type: 'single-choice', text: t('q63_text'), options: [t('q63_op1'), t('q63_op2'), t('q63_op3'), t('q63_op4')] },
  { id: 64, type: 'single-choice', text: t('q64_text'), options: [t('q64_op1'), t('q64_op2'), t('q64_op3'), t('q64_op4')] },
  { id: 65, type: 'single-choice', text: t('q65_text'), options: [t('q65_op1'), t('q65_op2'), t('q65_op3'), t('q65_op4')] },
  { id: 66, type: 'single-choice', text: t('q66_text'), options: [t('q66_op1'), t('q66_op2'), t('q66_op3'), t('q66_op4')] },
  { id: 67, type: 'single-choice', text: t('q67_text'), options: [t('q67_op1'), t('q67_op2'), t('q67_op3'), t('q67_op4')] },
  { id: 68, type: 'single-choice', text: t('q68_text'), options: [t('q68_op1'), t('q68_op2'), t('q68_op3'), t('q68_op4')] },
  { id: 69, type: 'single-choice', text: t('q69_text'), options: [t('q69_op1'), t('q69_op2'), t('q69_op3'), t('q69_op4')] },
  { id: 70, type: 'single-choice', text: t('q70_text'), options: [t('q70_op1'), t('q70_op2'), t('q70_op3'), t('q70_op4')] },
  { id: 71, type: 'single-choice', text: t('q71_text'), options: [t('q71_op1'), t('q71_op2'), t('q71_op3'), t('q71_op4')] },
  { id: 72, type: 'single-choice', text: t('q72_text'), options: [t('q72_op1'), t('q72_op2'), t('q72_op3'), t('q72_op4')] },
  { id: 73, type: 'single-choice', text: t('q73_text'), options: [t('q73_op1'), t('q73_op2'), t('q73_op3'), t('q73_op4')] },
  { id: 74, type: 'single-choice', text: t('q74_text'), options: [t('q74_op1'), t('q74_op2'), t('q74_op3'), t('q74_op4')] },
  { id: 75, type: 'single-choice', text: t('q75_text'), options: [t('q75_op1'), t('q75_op2'), t('q75_op3'), t('q75_op4')] },
  { id: 76, type: 'single-choice', text: t('q76_text'), options: [t('q76_op1'), t('q76_op2'), t('q76_op3'), t('q76_op4')] },
  { id: 77, type: 'single-choice', text: t('q77_text'), options: [t('q77_op1'), t('q77_op2'), t('q77_op3'), t('q77_op4')] },
  { id: 78, type: 'single-choice', text: t('q78_text'), options: [t('q78_op1'), t('q78_op2'), t('q78_op3'), t('q78_op4')] },
  { id: 79, type: 'single-choice', text: t('q79_text'), options: [t('q79_op1'), t('q79_op2'), t('q79_op3'), t('q79_op4')] },
  { id: 80, type: 'single-choice', text: t('q80_text'), options: [t('q80_op1'), t('q80_op2'), t('q80_op3'), t('q80_op4')] },
  // IDs 81-95: Multiple-Choice
  { id: 81, type: 'multiple-choice', text: t('q81_text'), options: [t('q81_op1'), t('q81_op2'), t('q81_op3'), t('q81_op4')] },
  { id: 82, type: 'multiple-choice', text: t('q82_text'), options: [t('q82_op1'), t('q82_op2'), t('q82_op3'), t('q82_op4')] },
  { id: 83, type: 'multiple-choice', text: t('q83_text'), options: [t('q83_op1'), t('q83_op2'), t('q83_op3'), t('q83_op4')] },
  { id: 84, type: 'multiple-choice', text: t('q84_text'), options: [t('q84_op1'), t('q84_op2'), t('q84_op3'), t('q84_op4')] },
  { id: 85, type: 'multiple-choice', text: t('q85_text'), options: [t('q85_op1'), t('q85_op2'), t('q85_op3'), t('q85_op4')] },
  { id: 86, type: 'multiple-choice', text: t('q86_text'), options: [t('q86_op1'), t('q86_op2'), t('q86_op3'), t('q86_op4')] },
  { id: 87, type: 'multiple-choice', text: t('q87_text'), options: [t('q87_op1'), t('q87_op2'), t('q87_op3'), t('q87_op4')] },
  { id: 88, type: 'multiple-choice', text: t('q88_text'), options: [t('q88_op1'), t('q88_op2'), t('q88_op3'), t('q88_op4')] },
  { id: 89, type: 'multiple-choice', text: t('q89_text'), options: [t('q89_op1'), t('q89_op2'), t('q89_op3'), t('q89_op4')] },
  { id: 90, type: 'multiple-choice', text: t('q90_text'), options: [t('q90_op1'), t('q90_op2'), t('q90_op3'), t('q90_op4')] },
  { id: 91, type: 'multiple-choice', text: t('q91_text'), options: [t('q91_op1'), t('q91_op2'), t('q91_op3'), t('q91_op4')] },
  { id: 92, type: 'multiple-choice', text: t('q92_text'), options: [t('q92_op1'), t('q92_op2'), t('q92_op3'), t('q92_op4')] },
  { id: 93, type: 'multiple-choice', text: t('q93_text'), options: [t('q93_op1'), t('q93_op2'), t('q93_op3'), t('q93_op4')] },
  { id: 94, type: 'multiple-choice', text: t('q94_text'), options: [t('q94_op1'), t('q94_op2'), t('q94_op3'), t('q94_op4')] },
  { id: 95, type: 'multiple-choice', text: t('q95_text'), options: [t('q95_op1'), t('q95_op2'), t('q95_op3'), t('q95_op4')] },
  // IDs 96-100: Open-Ended
  { id: 96, type: 'open-ended', text: t('q96_text'), options: [] },
  { id: 97, type: 'open-ended', text: t('q97_text'), options: [] },
  { id: 98, type: 'open-ended', text: t('q98_text'), options: [] },
  { id: 99, type: 'open-ended', text: t('q99_text'), options: [] },
  { id: 100, type: 'open-ended', text: t('q100_text'), options: [] }
];


export const LOCATION_OPTIONS = [ /* ... */];
export const THEME_MODES = [ /* ... */];
export const LANGUAGE_OPTIONS = [ /* ... */];
export const DEFAULT_LANGUAGE = 'en';
export const DEFAULT_THEME = 'light';
export const MAP_CENTER = { lat: 34.0522, lng: -118.2437 }; // Los Angeles
export const MAP_ZOOM = 10;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_REVIEWS_DISPLAY = 3;