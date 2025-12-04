import { GoogleGenAI, Type } from "@google/genai";
import { Answer, AssessmentResult, Decision } from '../types';
import { ASSESSMENT_QUESTIONS } from '../constants';
import { translations } from "../locales/index";

// Safer API Key retrieval that won't crash the browser
const getApiKey = () => {
  // 1. Try Vite env var (standard)
  if (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  // 2. Try process.env safely (ignores error if process is undefined)
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
        // @ts-ignore
        return process.env.GEMINI_API_KEY;
    }
  } catch (e) {
    // ignore
  }
  return '';
};

const apiKey = getApiKey();

// Initialize AI only if key exists to prevent immediate crash
const ai = apiKey ? new GoogleGenAI({ apiKey: apiKey }) : null;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.INTEGER,
      description: "The calculated score between 0 and 100."
    },
    feedback: {
      type: Type.STRING,
      description: "A brief, constructive, and personalized feedback for the candidate based on their answers."
    },
    decision: {
      type: Type.STRING,
      description: "The final decision based on the score. Must be one of: 'Approved', 'Rejected'."
    }
  },
  required: ['score', 'feedback', 'decision']
};

export const evaluateAnswers = async (answers: Answer[], language: string): Promise<AssessmentResult> => {
  if (!ai || !apiKey) {
      console.error("Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in .env.local");
      return {
        score: 0,
        feedback: "System Error: AI Configuration missing. Please check your API key settings.",
        decision: 'Rejected'
      };
  }

  const model = 'gemini-2.0-flash'; 
  
  const tEn = (key: string, options?: { [key: string]: string | number }) => {
    let translation = translations.en[key as keyof typeof translations.en] || key;
    if (options) {
      Object.keys(options).forEach(optionKey => {
        translation = translation.replace(`{${optionKey}}`, String(options[optionKey]));
      });
    }
    return translation;
  };
  const englishQuestions = ASSESSMENT_QUESTIONS(tEn);

  const formattedAnswers = answers.map(answer => {
    const question = englishQuestions.find(q => q.id === answer.questionId);
    const answerText = Array.isArray(answer.answer) ? answer.answer.join(', ') : answer.answer;
    return `Question ${answer.questionId}: "${question?.text}"\nAnswer: "${answerText}"`;
  }).join('\n\n');

  const languageMap: { [key: string]: string } = {
    en: 'English',
    fr: 'French',
    es: 'Spanish',
    ja: 'Japanese',
    zh: 'Chinese',
    ar: 'Arabic'
  };
  const responseLanguage = languageMap[language] || 'English';

  const systemInstruction = `You are an expert HR evaluator for 'FamLink', a platform connecting families with trusted nannies. Your task is to assess a nanny candidate's suitability based on their answers to a 15-question assessment.

Analyze the provided answers to evaluate the candidate on these key criteria:
1.  **Empathy and Patience:** Ability to understand and manage a child's emotions.
2.  **Professionalism & Communication:** Clear, respectful interaction with parents.
3.  **Emotional Regulation & Stress Management:** Healthy coping mechanisms.
4.  **Problem-Solving & Safety Awareness:** Adaptability and prioritizing child safety.
5.  **Motivation & Core Values:** Genuine interest in child welfare.

Scoring Rubric:
-   Calculate a final weighted score from 0 to 100 based on the 15 answers provided.
-   Positive, child-centric answers score high. Negative or dismissive answers score low.

Decision Logic:
-   Score >= 70: 'Approved'
-   Score < 70: 'Rejected'

CRITICAL REQUIREMENT: The text for the 'feedback' field in your JSON response must be written exclusively in ${responseLanguage}.`;

  const prompt = `Please evaluate the following candidate's answers:\n\n${formattedAnswers}`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.3,
      },
    });

    const jsonString = response.response.text().trim();
    const result = JSON.parse(jsonString) as { score: number; feedback: string; decision: Decision };
    
    if (!['Approved', 'Rejected'].includes(result.decision)) {
        result.decision = result.score >= 70 ? 'Approved' : 'Rejected';
    }
    
    return result;

  } catch (error) {
    console.error("Error evaluating answers with Gemini API:", error);
    return {
        score: 0,
        feedback: "We're sorry, an error occurred while processing your assessment. Please try again later.",
        decision: 'Rejected'
    };
  }
};