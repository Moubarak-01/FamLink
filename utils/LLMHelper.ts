/**
 * utils/LLMHelper.ts
 * * Contains utility functions for processing Large Language Model (LLM) responses 
 * to ensure consistent, clean output across different APIs (Gemini, Perplexity, etc.).
 */

/**
 * Cleans raw AI response text by removing model-specific formatting artifacts 
 * and inline citations that should not be displayed to the user.
 * * @param text The raw string output from the AI model.
 * @returns A cleaned string, ready for Markdown rendering.
 */
export function cleanAIText(text: string): string {
    if (!text) return '';

    let cleanedText = text;

    // 1. Remove DeepSeek/Claude/Perplexity Thinking Tags: <think>...</think> (and content inside)
    // The 's' flag allows '.' to match newlines, ensuring multi-line thinking blocks are captured.
    cleanedText = cleanedText.replace(/<think>[\s\S]*?<\/think>/gs, '');

    // 2. Remove Citations/Footnotes: [1], [5], [1, 2], or single letters/words in brackets
    // Matches any content enclosed in single brackets where the content is one or more
    // digits, comma-separated digits, or letters/words.
    cleanedText = cleanedText.replace(/\[[^\]]+\]/g, '');

    // 3. Return the cleaned text (PRESERVING WHITESPACE for streaming)
    return cleanedText;
}