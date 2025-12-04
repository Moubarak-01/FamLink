import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { User, Screen } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface AiAssistantProps {
  user: User;
  currentScreen: Screen;
}

// Define the ref interface
export interface AiAssistantRef {
    openChat: () => void;
    toggleVisibility: () => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

// Safe API Key retrieval
const getApiKey = () => {
  if (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) return import.meta.env.VITE_GEMINI_API_KEY;
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) return process.env.API_KEY || process.env.GEMINI_API_KEY;
  } catch (e) {}
  return '';
};

const AiAssistant = forwardRef<AiAssistantRef, AiAssistantProps>(({ user, currentScreen }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  const { language } = useLanguage();
  const [aiLanguage, setAiLanguage] = useState<string>(language);
  
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Hi ${user.fullName.split(' ')[0]}! 👋 I'm your FamLink assistant. Ask me anything about the app!` }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSent, setHasSent] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const apiKey = getApiKey();
  const ai = apiKey ? new GoogleGenAI({ apiKey: apiKey }) : null;

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    openChat: () => {
        if (isVisible) setIsOpen(true);
    },
    toggleVisibility: () => {
        setIsVisible(prev => !prev);
    }
  }));

  const displayLanguageMap: { [key: string]: string } = {
    en: 'English', fr: 'Français', es: 'Español', ja: '日本語', zh: '中文', ar: 'العربية'
  };

  useEffect(() => { setAiLanguage(language); }, [language]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  useEffect(() => {
      if (!hasSent && messages.length < 3) {
          const tips: Partial<Record<Screen, string>> = {
              [Screen.Dashboard]: "Tip: You can manage your bookings and tasks directly here.",
              [Screen.NannyListing]: "Tip: Use the search bar to find nannies by name or location.",
          };

          const tip = tips[currentScreen];
          if (tip) {
              const lastMsg = messages[messages.length - 1];
              if (lastMsg.text !== tip) {
                  const timer = setTimeout(() => {
                      setMessages(prev => [...prev, { role: 'model', text: tip }]);
                  }, 1000);
                  return () => clearTimeout(timer);
              }
          }
      }
  }, [currentScreen, hasSent]);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    if (!ai) {
        setMessages(prev => [...prev, { role: 'user', text: inputValue.trim() }, { role: 'model', text: "AI Assistant is not configured (Missing API Key)." }]);
        setInputValue('');
        return;
    }

    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInputValue('');
    setIsLoading(true);
    setHasSent(true);

    try {
      const targetLangName = displayLanguageMap[aiLanguage] || 'English';
      const systemInstruction = `You are the friendly AI assistant for FamLink. User: ${user.fullName} (${user.userType}). Answer ONLY in ${targetLangName}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        config: { systemInstruction }
      });

      const text = response.response.text();
      setMessages(prev => [...prev, { role: 'model', text: text || "I'm having trouble connecting right now." }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
      if (window.confirm("Clear conversation history?")) {
        setMessages([{ role: 'model', text: `Hi ${user.fullName.split(' ')[0]}! 👋 I'm your FamLink assistant. Ask me anything about the app!` }]);
        setHasSent(false);
      }
  };

  if (!isVisible) return null;

  return (
    <>
      {!isOpen && (
          <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg bg-[var(--accent-primary)] text-white animate-fade-in-up hover:scale-110 transition-transform">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.405 0 4.781.173 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clipRule="evenodd" /></svg>
          </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden h-[500px] max-h-[80vh]">
          <div className="bg-[var(--accent-primary)] p-4 flex items-center justify-between shadow-sm">
             <h3 className="font-bold text-white text-base">FamLink Assistant</h3>
             <button onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 p-1 rounded-full">✕</button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-[var(--bg-card-subtle)] space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 text-sm rounded-2xl ${msg.role === 'user' ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)]'}`}>
                    {msg.text}
                </div>
              </div>
            ))}
            {isLoading && <div className="text-xs text-gray-500 ml-2">Typing...</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-[var(--bg-card)] border-t border-[var(--border-color)]">
             <form onSubmit={handleSendMessage} className="flex gap-2">
                <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg text-sm focus:outline-none resize-none"
                />
                <button type="submit" disabled={!inputValue.trim() || isLoading} className="text-[var(--accent-primary)] font-bold disabled:opacity-50">Send</button>
             </form>
          </div>
        </div>
      )}
    </>
  );
});

export default AiAssistant;