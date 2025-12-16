import { GoogleGenAI, Type, Model } from "@google/genai";
import { Answer, AssessmentResult, Decision } from '../types';
import { ASSESSMENT_QUESTIONS, GEMINI_FALLBACK_MODELS, PPLX_API_KEY_ENV, PPLX_FALLBACK_MODELS } from '../constants'; 
import { translations } from "../locales/index";
import { cleanAIText } from '../utils/LLMHelper'; // NEW: Import the cleaner

// --- API INITIALIZATION ---

// Safe API Key retrieval for both services
const getApiKey = (envVar: string): string => {
  if (import.meta.env && (import.meta.env as any)[envVar]) {
    return (import.meta.env as any)[envVar];
  }
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[envVar]) {
        // @ts-ignore
        return process.env[envVar];
    }
  } catch (e) {}
  return '';
};

const geminiApiKey = getApiKey('VITE_GEMINI_API_KEY');
const pplxApiKey = getApiKey(PPLX_API_KEY_ENV);

// Initialize Gemini only if key exists
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

// --- RESPONSE SCHEMA ---

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.INTEGER, description: "The calculated score between 0 and 100." },
    feedback: { type: Type.STRING, description: "Constructive feedback and summary of the candidate's performance, tailored to the assessment, written in the target language." },
    decision: { type: Type.STRING, enum: ['Approved', 'Rejected'], description: "The final decision based on the calculated score." }
  },
  required: ['score', 'feedback', 'decision']
};

/**
 * Executes a raw text generation request with multi-model failover (Gemini -> Perplexity).
 */
const executeTextGenerationWithFailover = async (prompt: string, systemInstruction: string): Promise<string> => {
    // --- 1. GEMINI API FALLBACK CHAIN ---
    if (ai) {
        const modelsToTry = GEMINI_FALLBACK_MODELS && GEMINI_FALLBACK_MODELS.length > 0 
            ? GEMINI_FALLBACK_MODELS 
            : ['gemini-2.5-flash'];

        for (const currentModel of modelsToTry) {
            try {
                console.log(`Attempting API call with Gemini model: ${currentModel}`);
                
                const response = await ai.models.generateContent({
                    model: currentModel as Model,
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    config: { 
                        temperature: 0.7,
                        // NEW: Pass system instruction for grounding
                        systemInstruction: systemInstruction 
                    }
                });

                // FIX: Check for response existence to avoid TypeError
                if (response?.response?.text) {
                    const responseText = response.response.text.trim();
                    // NEW IMPLEMENTATION: Clean the response before returning
                    return cleanAIText(responseText); 
                }
            } catch (error) {
                console.warn(`Gemini Model ${currentModel} failed. Error:`, (error as any)?.error?.message || error);
            }
        }
    } else {
        console.warn("Gemini API key is missing. Skipping Gemini fallback chain.");
    }
    
    // --- 2. PERPLEXITY AI FALLBACK CHAIN (FINAL ATTEMPT) ---
    if (pplxApiKey) {
        
        for (const pplxModel of PPLX_FALLBACK_MODELS) {
            try {
                console.log(`Attempting fallback with Perplexity AI model: ${pplxModel}`);
                
                const pplxResponse = await fetch('https://api.perplexity.ai/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${pplxApiKey}`
                    },
                    body: JSON.stringify({
                        model: pplxModel,
                        messages: [
                            // NEW: Pass system instruction for grounding
                            { role: 'system', content: systemInstruction },
                            { role: 'user', content: prompt }
                        ],
                        temperature: 0.7
                    })
                });

                const pplxData = await pplxResponse.json();
                
                if (pplxResponse.ok && pplxData.choices && pplxData.choices.length > 0) {
                    const responseText = pplxData.choices[0].message.content.trim();
                    // NEW IMPLEMENTATION: Clean the response before returning
                    return cleanAIText(responseText); 
                } else {
                    console.warn(`Perplexity Model ${pplxModel} failed. API Error:`, pplxData);
                }

            } catch (error) {
                console.warn(`Perplexity Model ${pplxModel} failed. Network/Parsing Error:`, error);
            }
        }
    } else {
        console.warn("Perplexity API key is missing. Skipping final fallback.");
    }

    // --- 3. GLOBAL FAILURE ---
    return "Sorry, I encountered an error. All AI services failed. Please try again.";
};

// --- GEMINI SERVICE CLASS (Exports the instance) ---

class GeminiService {
  
  // Method for AI Assistant chat
  async generateResponse(prompt: string, systemInstruction: string): Promise<string> {
    return executeTextGenerationWithFailover(prompt, systemInstruction);
  }

  // Method for Nanny Assessment (Uses internal failover logic)
  async evaluateAnswers(answers: Answer[], responseLanguage: string): Promise<AssessmentResult> {
    
    if (!ai) {
        if (pplxApiKey) {
            return this._evaluateAnswersWithPplx(answers, responseLanguage);
        }
        return { score: 0, feedback: "AI system unavailable.", decision: 'Rejected' };
    }

    const assessmentQuestions = ASSESSMENT_QUESTIONS(translations[responseLanguage]?.t || translations.en.t);
    const formattedAnswers = answers.map(answer => {
      const question = assessmentQuestions.find(q => q.id === answer.questionId);
      const questionText = question?.text || `Question ${answer.questionId}`;
      const answerValue = Array.isArray(answer.value) ? answer.value.join('; ') : answer.value; 
      return `Q: ${questionText}\nA: ${answerValue}\n---\n`;
    }).join('\n');

    const systemInstruction = `
You are an expert Nanny Assessment AI. Your task is to evaluate a candidate's answers based on expertise, judgment, and child welfare.
Scoring: 0-100. Decision: Approved (>=70) or Rejected (<70).
CRITICAL REQUIREMENT: The text for the 'feedback' field in your JSON response must be written exclusively in ${responseLanguage}.`;

    const prompt = `Please evaluate the following candidate's answers:\n\n${formattedAnswers}`;

    const modelsToTry = GEMINI_FALLBACK_MODELS && GEMINI_FALLBACK_MODELS.length > 0 
        ? GEMINI_FALLBACK_MODELS 
        : ['gemini-2.5-flash'];

    // --- GEMINI ASSESSMENT FAILOVER ---
    for (const currentModel of modelsToTry) {
        try {
            console.log(`Attempting assessment with Gemini model: ${currentModel}`);
            
            const response = await ai.models.generateContent({
                model: currentModel as Model,
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                    temperature: 0.3,
                },
            });

            // FIX: Check for response existence to avoid errors
            if (response?.response?.text) {
                const jsonString = response.response.text.trim();
                const result = JSON.parse(jsonString) as { score: number; feedback: string; decision: Decision };
                
                if (!['Approved', 'Rejected'].includes(result.decision)) {
                    result.decision = result.score >= 70 ? 'Approved' : 'Rejected';
                }
                
                return result; // Success!
            }

        } catch (error) {
            console.warn(`Assessment model ${currentModel} failed. Attempting next model. Error:`, error);
        }
    }
    
    // --- PERPLEXITY ASSESSMENT FAILOVER (JSON response is critical) ---
    if (pplxApiKey) {
        return this._evaluateAnswersWithPplx(answers, responseLanguage);
    }

    return { score: 0, feedback: "All AI models failed to complete the assessment. Please try again later.", decision: 'Rejected' };
  }
  
  // Helper for Perplexity Assessment logic
  private async _evaluateAnswersWithPplx(answers: Answer[], responseLanguage: string): Promise<AssessmentResult> {
      
        const assessmentQuestions = ASSESSMENT_QUESTIONS(translations[responseLanguage]?.t || translations.en.t);
        const formattedAnswers = answers.map(answer => {
          const question = assessmentQuestions.find(q => q.id === answer.questionId);
          const questionText = question?.text || `Question ${answer.questionId}`;
          const answerValue = Array.isArray(answer.value) ? answer.value.join('; ') : answer.value; 
          return `Q: ${questionText}\nA: ${answerValue}\n---\n`;
        }).join('\n');

        const systemInstruction = `
You are an expert Nanny Assessment AI. Your task is to evaluate a candidate's answers based on expertise, judgment, and child welfare.
Scoring: 0-100. Decision: Approved (>=70) or Rejected (<70).
CRITICAL REQUIREMENT: Output must be a single JSON object matching the schema: { "score": number, "feedback": string, "decision": "Approved" | "Rejected" }. The 'feedback' field must be written exclusively in ${responseLanguage}.`;

        const prompt = `Please evaluate the following candidate's answers:\n\n${formattedAnswers}`;

        for (const pplxModel of PPLX_FALLBACK_MODELS) { // Try all PPLX models for reliable JSON output
            try {
                console.log(`Attempting assessment fallback with Perplexity AI model: ${pplxModel}`);
                
                const pplxResponse = await fetch('https://api.perplexity.ai/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${pplxApiKey}`
                    },
                    body: JSON.stringify({
                        model: pplxModel,
                        messages: [
                            { role: 'system', content: systemInstruction },
                            { role: 'user', content: prompt }
                        ],
                        temperature: 0.3,
                        response_format: { type: "json_object" }
                    })
                });

                const pplxData = await pplxResponse.json();

                if (pplxResponse.ok && pplxData.choices && pplxData.choices.length > 0) {
                    const jsonString = pplxData.choices[0].message.content.trim();
                    const result = JSON.parse(jsonString) as { score: number; feedback: string; decision: Decision };
                    
                    if (!['Approved', 'Rejected'].includes(result.decision)) {
                        result.decision = result.score >= 70 ? 'Approved' : 'Rejected';
                    }
                    return result; // Success!
                } else {
                     console.warn(`Perplexity Assessment Model ${pplxModel} failed. API Error:`, pplxData);
                }
            } catch (error) {
                 console.warn(`Perplexity Assessment Model ${pplxModel} failed. Network/Parsing Error:`, error);
            }
        }
        
        return { score: 0, feedback: "All AI models failed to complete the assessment. Please try again later.", decision: 'Rejected' };
  }
}

// Export the single instance of the service
export const geminiService = new GeminiService();