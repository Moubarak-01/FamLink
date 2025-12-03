import { GoogleGenAI, Type } from "@google/genai";
import { Answer, AssessmentResult, Decision } from '../types';
import { ASSESSMENT_QUESTIONS } from '../constants';
import { translations } from "../locales/index";

// Support both standard process.env (cloud/node) and Vite (local)
// Vite requires env vars to start with VITE_ to be exposed to the client
// @ts-ignore
const apiKey = (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || (import.meta.env && import.meta.env.GEMINI_API_KEY) || process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: apiKey });

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
  if (!apiKey) {
      console.error("Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in .env.local");
      return {
        score: 0,
        feedback: "System Error: AI Configuration missing. Please contact support.",
        decision: 'Rejected'
      };
  }

  const model = 'gemini-2.5-flash';
  
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


  const systemInstruction = `You are an expert HR evaluator for 'FamLink', a platform connecting families with trusted nannies. Your task is to assess a nanny candidate's suitability based on their answers to a 15-question assessment, randomly selected from a larger pool of 50.

Analyze the provided answers to evaluate the candidate on these key criteria:
1.  **Empathy and Patience:** Ability to understand and manage a child's emotions.
2.  **Professionalism & Communication:** Clear, respectful interaction with parents.
3.  **Emotional Regulation & Stress Management:** Healthy coping mechanisms.
4.  **Problem-Solving & Safety Awareness:** Adaptability and prioritizing child safety.
5.  **Motivation & Core Values:** Genuine interest in child welfare.

The questionnaire includes single-choice, multiple-choice, and open-ended questions. Evaluate the substance of the open-ended answers carefully.

Scoring Rubric:
-   Assign points for each answer based on how well it aligns with our values. Positive, child-centric, and professional answers score high. Negative, dismissive, or unprofessional answers score low.
-   Calculate a final weighted score from 0 to 100 based on the 15 answers provided.

Decision Logic:
-   Score >= 70: 'Approved'
-   Score < 70: 'Rejected'

Your final output must be a JSON object that adheres strictly to the provided schema. The feedback must be encouraging but honest.

CRITICAL REQUIREMENT: The text for the 'feedback' field in your JSON response must be written exclusively in ${responseLanguage}. Do not use any other language for the feedback. For example, if the requested language is French, the feedback must be entirely in French.`;

  const prompt = `Please evaluate the following candidate's answers:\n\n${formattedAnswers}`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.3,
      },
    });

    const jsonString = response.text.trim();
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