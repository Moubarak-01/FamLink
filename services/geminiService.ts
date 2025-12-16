import { GoogleGenAI, Type, Model } from "@google/genai";
import { Answer, AssessmentResult, Decision } from '../types';
import { ASSESSMENT_QUESTIONS, GEMINI_FALLBACK_MODELS, PPLX_API_KEY_ENV, PPLX_FALLBACK_MODELS } from '../constants'; 
import { translations } from "../locales/index";
import { cleanAIText } from '../utils/LLMHelper'; 

// --- API INITIALIZATION ---

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
 * Executes a raw text generation request with multi-model failover (Gemini -> Perplexity), 
 * returning an asynchronous generator (stream) of text chunks.
 */
async function* executeTextGenerationWithFailover(prompt: string, systemInstruction: string): AsyncGenerator<string> {
    // --- 1. GEMINI API FALLBACK CHAIN (STREAMING) ---
    if (ai) {
        const modelsToTry = GEMINI_FALLBACK_MODELS && GEMINI_FALLBACK_MODELS.length > 0 ? GEMINI_FALLBACK_MODELS : ['gemini-2.5-flash'];

        for (const currentModel of modelsToTry) {
            try {
                console.log(`Attempting STREAM with Gemini model: ${currentModel}`);
                
                const responseStream = await ai.models.generateContentStream({
                    model: currentModel as Model,
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    config: { 
                        temperature: 0.7,
                        systemInstruction: systemInstruction 
                    }
                });

                let fullResponse = '';
                for await (const chunk of responseStream) {
                    const chunkText = chunk.text;
                    if (chunkText) {
                        // Yield clean text token immediately
                        const cleanedChunk = cleanAIText(chunkText);
                        yield cleanedChunk; 
                        fullResponse += chunkText;
                    }
                }
                
                if (fullResponse.length > 0) return; // Success: generator completes

            } catch (error) {
                console.warn(`Gemini STREAM Model ${currentModel} failed. Error:`, (error as any)?.error?.message || error);
                // Continue to the next model in the list
            }
        }
    } else {
        console.warn("Gemini API key is missing. Skipping Gemini fallback chain.");
    }
    
    // --- 2. PERPLEXITY AI FALLBACK CHAIN (STREAMING) ---
    if (pplxApiKey) {
        
        for (const pplxModel of PPLX_FALLBACK_MODELS) {
            try {
                console.log(`Attempting STREAM fallback with Perplexity AI model: ${pplxModel}`);
                
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
                        temperature: 0.7,
                        stream: true // Enable streaming for Perplexity
                    })
                });

                if (pplxResponse.ok && pplxResponse.body) {
                    const reader = pplxResponse.body.getReader();
                    const decoder = new TextDecoder("utf-8");
                    let buffer = '';

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || ''; // Keep incomplete line in buffer

                        for (const line of lines) {
                            if (line.startsWith('data:')) {
                                try {
                                    const json = JSON.parse(line.substring(5).trim());
                                    const content = json.choices?.[0]?.delta?.content;
                                    if (content) {
                                        // Yield clean text token immediately
                                        yield cleanAIText(content); 
                                    }
                                } catch (e) {
                                    // Handle parsing errors for non-JSON lines or malformed chunks
                                }
                            }
                        }
                    }
                    return; // Success: generator completes
                } else {
                    console.warn(`Perplexity STREAM Model ${pplxModel} failed. Status: ${pplxResponse.status}`);
                }

            } catch (error) {
                console.warn(`Perplexity STREAM Model ${pplxModel} failed. Network/Parsing Error:`, error);
                // Continue to the next model
            }
        }
    } else {
        console.warn("Perplexity API key is missing. Skipping final fallback.");
    }

    // --- 3. GLOBAL FAILURE ---
    yield "Sorry, I encountered a critical error. All AI streaming services failed. Please try again.";
};

// --- GEMINI SERVICE CLASS ---

class GeminiService {
  
  // Method for AI Assistant chat
  async generateResponse(prompt: string, systemInstruction: string): Promise<AsyncGenerator<string>> {
    return executeTextGenerationWithFailover(prompt, systemInstruction);
  }

  // Method for Nanny Assessment (Non-streaming, JSON output)
  async evaluateAnswers(answers: Answer[], responseLanguage: string): Promise<AssessmentResult> {
    // ... (Assessment logic remains the same, using non-streaming generateContent) ...
    // Note: Assessment logic here is simplified for file generation, relying on the previous non-streaming structure.
    
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

            if (response?.response?.text) {
                const jsonString = response.response.text.trim();
                const result = JSON.parse(jsonString) as { score: number; feedback: string; decision: Decision };
                
                if (!['Approved', 'Rejected'].includes(result.decision)) {
                    result.decision = result.score >= 70 ? 'Approved' : 'Rejected';
                }
                
                return result; 
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
  
  // Helper for Perplexity Assessment logic (JSON response is critical)
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

        for (const pplxModel of PPLX_FALLBACK_MODELS) {
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
                    return result; 
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