import { GoogleGenAI, Type, Model } from "@google/genai";
import { Answer, AssessmentResult, Decision } from '../types';
import {
    ASSESSMENT_QUESTIONS,
    GEMINI_FALLBACK_MODELS,
    PPLX_API_KEY_ENV,
    PPLX_FALLBACK_MODELS,
    OPENROUTER_API_KEY_ENV,
    OPENROUTER_FREE_MODELS
} from '../constants';
import { translations } from "../locales/index";
import { cleanAIText } from '../utils/LLMHelper';

// --- API INITIALIZATION ---

const getApiKey = (envVar: string): string => {
    // @ts-ignore
    if (import.meta.env && import.meta.env[envVar]) {
        // @ts-ignore
        return import.meta.env[envVar];
    }
    try {
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env && process.env[envVar]) {
            // @ts-ignore
            return process.env[envVar];
        }
    } catch (e) { }
    return '';
};

const geminiApiKey = getApiKey('VITE_GEMINI_API_KEY');
const pplxApiKey = getApiKey(PPLX_API_KEY_ENV);
const openrouterApiKey = getApiKey(OPENROUTER_API_KEY_ENV);

const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

// --- TELEMETRY HELPER ---
// @ts-ignore
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const logTelemetry = async (event: string, model: string | undefined, success: boolean, error?: string) => {
    try {
        await fetch(`${API_URL}/telemetry/log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service: 'AiAssistant',
                event,
                model,
                success,
                error
            })
        });
    } catch (e) {
        console.warn('Telemetry log failed', e);
    }
};

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
 * THREE-TIER WATERFALL SYSTEM
 * Executes text generation with automatic failover across three tiers:
 * TIER 1: OpenRouter Free Models (10 models)
 * TIER 2: Gemini API (existing models)
 * TIER 3: Perplexity API (existing models)
 * 
 * Returns an asynchronous generator (stream) of text chunks.
 */
async function* executeTextGenerationWithFailover(prompt: string, systemInstruction: string): AsyncGenerator<string> {
    // --- TIER 1: OPENROUTER FREE MODELS (STREAMING) ---
    if (openrouterApiKey) {
        for (const openrouterModel of OPENROUTER_FREE_MODELS) {
            try {
                console.log(`[LLM] 🔄 Waterfall: Trying ${openrouterModel}...`);
                logTelemetry('ai_attempt', openrouterModel, true);

                const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${openrouterApiKey}`,
                        'HTTP-Referer': window.location.origin, // Required for OpenRouter
                        'X-Title': 'FamLink AI Assistant' // Optional: app identification
                    },
                    body: JSON.stringify({
                        model: openrouterModel,
                        messages: [
                            { role: 'system', content: systemInstruction },
                            { role: 'user', content: prompt }
                        ],
                        temperature: 0.7,
                        stream: true,
                        // OpenRouter-specific parameters for reasoning models
                        include_reasoning: false, // Hide reasoning tokens from UI
                        transforms: ["middle-out", "reasoning"] // Clean reasoning output
                    })
                });

                // Handle waterfall triggers: 402 (insufficient credits), 429 (rate limit), 500+ (server error)
                // Handle waterfall triggers: 402 (insufficient credits), 429 (rate limit), 500+ (server error)
                if (!openrouterResponse.ok) {
                    const status = openrouterResponse.status;
                    const errorBody = await openrouterResponse.text();
                    console.warn(`[LLM] ⚠️ OpenRouter model ${openrouterModel} failed with status ${status}. Body:`, errorBody);

                    logTelemetry('ai_failure', openrouterModel, false, `Status ${status}: ${errorBody.substring(0, 100)}`);
                    continue; // Try next model
                }

                if (openrouterResponse.ok && openrouterResponse.body) {
                    const reader = openrouterResponse.body.getReader();
                    const decoder = new TextDecoder("utf-8");
                    let buffer = '';
                    let hasContent = false;

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || ''; // Keep incomplete line in buffer

                        for (const line of lines) {
                            if (line.startsWith('data:')) {
                                const data = line.substring(5).trim();
                                if (data === '[DONE]') continue;

                                try {
                                    const json = JSON.parse(data);
                                    const content = json.choices?.[0]?.delta?.content;
                                    if (content) {
                                        hasContent = true;
                                        yield cleanAIText(content);
                                    }
                                } catch (e) {
                                    // Handle parsing errors for malformed chunks
                                }
                            }
                        }
                    }

                    if (hasContent) {
                        console.log(`[LLM] ✅ Success with ${openrouterModel}`);
                        logTelemetry('ai_generation', openrouterModel, true);
                        return; // Success: generator completes
                    }
                }

            } catch (error) {
                console.warn(`[LLM] ⚠️ OpenRouter model ${openrouterModel} failed. Error:`, error);
                logTelemetry('ai_failure', openrouterModel, false, String(error));
                // Continue to the next model
            }
        }
    } else {
        console.warn("[LLM] ⏭️ OpenRouter API key missing. Skipping Tier 1, moving to Tier 2 (Gemini)...");
    }

    // --- TIER 2: GEMINI API FALLBACK CHAIN (STREAMING) ---
    if (ai) {
        const modelsToTry = GEMINI_FALLBACK_MODELS && GEMINI_FALLBACK_MODELS.length > 0 ? GEMINI_FALLBACK_MODELS : ['gemini-2.5-flash'];

        for (const currentModel of modelsToTry) {
            try {
                console.log(`[LLM] 🔄 Waterfall: Trying Gemini ${currentModel}...`);
                logTelemetry('ai_attempt', currentModel, true);

                const responseStream = await ai.models.generateContentStream({
                    model: currentModel as any, // Cast to any to accept string models
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
                        const cleanedChunk = cleanAIText(chunkText);
                        yield cleanedChunk;
                        fullResponse += chunkText;
                    }
                }

                if (fullResponse.length > 0) {
                    console.log(`[LLM] ✅ Success with Gemini ${currentModel}`);
                    logTelemetry('ai_generation', currentModel, true);
                    return; // Success: generator completes
                }

            } catch (error) {
                console.warn(`[LLM] ⚠️ Gemini model ${currentModel} failed. Error:`, (error as any)?.error?.message || error);
                logTelemetry('ai_failure', currentModel, false, String((error as any)?.error?.message || error));
                // Continue to the next model in the list
            }
        }
    } else {
        console.warn("[LLM] ⏭️ Gemini API key missing. Skipping Tier 2, moving to Tier 3 (Perplexity)...");
    }

    // --- TIER 3: PERPLEXITY AI FALLBACK CHAIN (STREAMING) ---
    if (pplxApiKey) {
        for (const pplxModel of PPLX_FALLBACK_MODELS) {
            try {
                console.log(`[LLM] 🔄 Waterfall: Trying Perplexity ${pplxModel}...`);
                logTelemetry('ai_attempt', pplxModel, true);

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
                        stream: true
                    })
                });

                if (pplxResponse.ok && pplxResponse.body) {
                    const reader = pplxResponse.body.getReader();
                    const decoder = new TextDecoder("utf-8");
                    let buffer = '';
                    let hasContent = false;

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
                                        hasContent = true;
                                        yield cleanAIText(content);
                                    }
                                } catch (e) {
                                    // Handle parsing errors for non-JSON lines or malformed chunks
                                }
                            }
                        }
                    }

                    if (hasContent) {
                        console.log(`[LLM] ✅ Success with Perplexity ${pplxModel}`);
                        logTelemetry('ai_generation', pplxModel, true);
                        return; // Success: generator completes
                    }
                } else {
                    console.warn(`[LLM] ⚠️ Perplexity model ${pplxModel} failed. Status: ${pplxResponse.status}`);
                }

            } catch (error) {
                console.warn(`[LLM] ⚠️ Perplexity model ${pplxModel} failed. Error:`, error);
                logTelemetry('ai_failure', pplxModel, false, String(error));
                // Continue to the next model
            }
        }
    } else {
        console.warn("[LLM] ⏭️ Perplexity API key missing. All tiers exhausted.");
    }

    // --- GLOBAL FAILURE: ALL TIERS FAILED ---
    console.error("[LLM] ❌ All AI models failed across all three tiers.");
    logTelemetry('ai_generation_fail', undefined, false, 'All tiers exhausted');
    yield "⚠️ FamLink assistant is temporarily unavailable. Please check your connection or try again in a moment.";
};

// --- GEMINI SERVICE CLASS ---

class GeminiService {

    // Method for AI Assistant chat
    async generateResponse(prompt: string, systemInstruction: string): Promise<AsyncGenerator<string>> {
        return executeTextGenerationWithFailover(prompt, systemInstruction);
    }

    // Method for Nanny Assessment (Non-streaming, JSON output)
    async evaluateAnswers(answers: Answer[], responseLanguage: string): Promise<AssessmentResult> {

        // FIX: Match chat waterfall by trying OpenRouter first (Tier 1)
        // Previous code had "if (!ai) return ..." which skipped Tier 1 if Gemini key was missing.
        // Now flow proceeds: OpenRouter -> Gemini -> Perplexity

        // Create a simple translation helper
        const t = (key: string) => {
            // @ts-ignore
            return translations[responseLanguage]?.[key] || translations['en']?.[key] || key;
        };
        const assessmentQuestions = ASSESSMENT_QUESTIONS(t as any);

        const formattedAnswers = answers.map(answer => {
            const question = assessmentQuestions.find(q => q.id === answer.questionId);
            const questionText = question?.text || `Question ${answer.questionId}`;
            // FIX: answer.answer instead of answer.value
            const answerValue = Array.isArray(answer.answer) ? answer.answer.join('; ') : answer.answer;
            return `Q: ${questionText}\nA: ${answerValue}\n---\n`;
        }).join('\n');

        const systemInstruction = `
You are an expert Nanny Assessment AI. Your task is to evaluate a candidate's answers based on expertise, judgment, and child welfare.
Scoring: 0-100. Decision: Approved (>=70) or Rejected (<70).
CRITICAL REQUIREMENT: The text for the 'feedback' field in your JSON response must be written exclusively in ${responseLanguage}.`;

        const prompt = `Please evaluate the following candidate's answers:\n\n${formattedAnswers}`;

        // --- TIER 1: OPENROUTER ASSESSMENT FAILOVER ---
        if (openrouterApiKey) {
            for (const openrouterModel of OPENROUTER_FREE_MODELS) {
                try {
                    console.log(`[Assessment] 🔄 Waterfall: Trying ${openrouterModel} (Tier 1)...`);

                    const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${openrouterApiKey}`,
                            'HTTP-Referer': window.location.origin,
                            'X-Title': 'FamLink Nanny Assessment'
                        },
                        body: JSON.stringify({
                            model: openrouterModel,
                            messages: [
                                { role: 'system', content: systemInstruction },
                                { role: 'user', content: prompt }
                            ],
                            temperature: 0.3,
                            // Attempt to enforce JSON mode where supported
                            response_format: { type: "json_object" },
                            // OpenRouter specifics
                            include_reasoning: false,
                            transforms: ["middle-out", "reasoning"]
                        })
                    });

                    if (orResponse.ok) {
                        const data = await orResponse.json();
                        const rawContent = data.choices?.[0]?.message?.content;

                        if (rawContent) {
                            // Sanitize: Remove markdown code blocks if present
                            const cleanJson = rawContent.replace(/```json\n?|\n?```/g, '').trim();
                            const result = JSON.parse(cleanJson) as { score: number; feedback: string; decision: Decision };

                            // Validate essential fields
                            if (typeof result.score === 'number' && result.feedback) {
                                if (!['Approved', 'Rejected'].includes(result.decision)) {
                                    result.decision = result.score >= 70 ? 'Approved' : 'Rejected';
                                }
                                console.log(`[Assessment] ✅ Success with ${openrouterModel}`);
                                return result;
                            }
                        }
                    } else {
                        // Quick failover on error status
                        const status = orResponse.status;
                        if (status === 402 || status === 429 || status >= 500) {
                            console.warn(`[Assessment] ⚠️ ${openrouterModel} failed (${status}). Waterfalling...`);
                            continue;
                        }
                    }

                } catch (error) {
                    console.warn(`[Assessment] ⚠️ ${openrouterModel} failed. Error:`, error);
                }
            }
        } else {
            console.warn("[Assessment] ⏭️ OpenRouter API key missing. Skipping Tier 1...");
        }

        // --- GEMINI ASSESSMENT FAILOVER (TIER 2) ---
        // Only try Gemini if 'ai' instance exists
        if (ai) {
            const modelsToTry = GEMINI_FALLBACK_MODELS && GEMINI_FALLBACK_MODELS.length > 0
                ? GEMINI_FALLBACK_MODELS
                : ['gemini-2.5-flash'];

            for (const currentModel of modelsToTry) {
                try {
                    console.log(`Attempting assessment with Gemini model: ${currentModel}`);

                    const response = await ai.models.generateContent({
                        model: currentModel as any,
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        config: {
                            systemInstruction: systemInstruction,
                            responseMimeType: "application/json",
                            responseSchema: responseSchema,
                            temperature: 0.3,
                        },
                    });

                    const anyResponse = response as any;
                    const responseText = typeof anyResponse.text === 'function' ? anyResponse.text() : (anyResponse.text || (anyResponse.response?.text ? anyResponse.response.text() : null));

                    if (responseText) {
                        const jsonString = responseText.trim();
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
        } else {
            console.warn("[Assessment] ⏭️ Gemini API key missing. Skipping Tier 2...");
        }

        // --- PERPLEXITY ASSESSMENT FAILOVER (JSON response is critical) ---
        if (pplxApiKey) {
            return this._evaluateAnswersWithPplx(answers, responseLanguage);
        }

        return { score: 0, feedback: "All AI models failed to complete the assessment. Please try again later.", decision: 'Rejected' };
    }

    // Helper for Perplexity Assessment logic (JSON response is critical)
    private async _evaluateAnswersWithPplx(answers: Answer[], responseLanguage: string): Promise<AssessmentResult> {

        // Helper t function for Perplexity
        const t = (key: string) => {
            // @ts-ignore
            return translations[responseLanguage]?.[key] || translations['en']?.[key] || key;
        };
        const assessmentQuestions = ASSESSMENT_QUESTIONS(t as any);

        const formattedAnswers = answers.map(answer => {
            const question = assessmentQuestions.find(q => q.id === answer.questionId);
            const questionText = question?.text || `Question ${answer.questionId}`;
            // FIX: answer.answer instead of answer.value
            const answerValue = Array.isArray(answer.answer) ? answer.answer.join('; ') : answer.answer;
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