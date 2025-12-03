import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { User, Screen } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface AiAssistantProps {
  user: User;
  currentScreen: Screen;
}

export interface AiAssistantRef {
    openChat: () => void;
    toggleVisibility: () => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

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

  // @ts-ignore
  const apiKey = (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || process.env.API_KEY || '';
  const ai = new GoogleGenAI({ apiKey: apiKey });

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    openChat: () => {
        if (isVisible) setIsOpen(true);
    },
    toggleVisibility: () => {
        setIsVisible(prev => !prev);
    }
  }));

  const displayLanguageMap: { [key: string]: string } = {
    en: 'English',
    fr: 'Français',
    es: 'Español',
    ja: '日本語',
    zh: '中文',
    ar: 'العربية'
  };

  useEffect(() => {
      setAiLanguage(language);
  }, [language]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
      if (!hasSent && messages.length < 3) {
          const tips: Partial<Record<Screen, string>> = {
              [Screen.Dashboard]: "Tip: You can manage your bookings and tasks directly here.",
              [Screen.NannyListing]: "Tip: Use the search bar to find nannies by name or location.",
              [Screen.CommunityActivities]: "Tip: Joining activities is a great way to meet other moms!",
              [Screen.ChildOutings]: "Tip: Hosting an outing can help other parents and build community.",
              [Screen.SkillMarketplace]: "Tip: You can earn money by offering your skills to others.",
              [Screen.NannyProfileDetail]: "Tip: Check reviews to see what other parents say about this nanny."
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
    if (isOpen) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInputValue('');
    setIsLoading(true);
    setHasSent(true);
    
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
    }

    try {
      const targetLangName = displayLanguageMap[aiLanguage] || 'English';
      const systemInstruction = `You are the friendly AI assistant for FamLink.
      User: ${user.fullName} (${user.userType}).
      Target Language: ${targetLangName}.
      Style: Concise, clear, helpful. Use bolding for key terms.
      CRITICAL INSTRUCTION: You must answer ONLY in ${targetLangName}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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

  const getRotationClass = () => {
      if (hasSent) return 'rotate-90';
      if (isHovered) return 'rotate-90';
      return 'rotate-0'; 
  };

  const parseBold = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={index} className="font-bold text-[var(--accent-primary)]">{part.slice(2, -2)}</strong>;
          }
          return part;
      });
  };

  const formatMessageText = (text: string) => {
    return text.split('\n').map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
             return (
                <div key={i} className="flex items-start gap-2 ml-1 mb-1">
                    <span className="text-[var(--accent-primary)] mt-2 h-1.5 w-1.5 rounded-full bg-current flex-shrink-0 block"></span>
                    <span className="flex-1 leading-relaxed">{parseBold(trimmed.replace(/^[\*\-]\s+/, ''))}</span>
                </div>
             );
        }
        if (/^\d+\.\s/.test(trimmed)) {
             const match = trimmed.match(/^(\d+)\.\s+(.*)/);
             if (match) {
                 return (
                    <div key={i} className="flex items-start gap-2 ml-1 mb-1">
                        <span className="font-bold text-[var(--accent-primary)] mt-0.5">{match[1]}.</span>
                        <span className="flex-1 leading-relaxed">{parseBold(match[2])}</span>
                    </div>
                 );
             }
        }
        return <p key={i} className="mb-1.5 leading-relaxed">{parseBold(line)}</p>;
    });
  };

  if (!isVisible) return null;

  return (
    <>
      {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white animate-fade-in-up"
            aria-label="Open AI Assistant"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                 <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.405 0 4.781.173 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clipRule="evenodd" />
            </svg>
          </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-fade-in-up h-[500px] max-h-[80vh]">
          {/* Header */}
          <div className="bg-[var(--accent-primary)] p-4 flex items-center justify-between shadow-sm">
             <div className="flex items-center gap-3">
                 <div className="bg-white/20 p-2 rounded-full text-xl backdrop-blur-sm text-white">
                     ✨
                 </div>
                 <div>
                     <h3 className="font-bold text-white text-base">FamLink Assistant</h3>
                     <div className="flex items-center gap-2">
                       <p className="text-xs text-pink-100 opacity-90">Here to help</p>
                       <div className="relative" ref={langMenuRef}>
                           <button
                              type="button"
                              onClick={() => setShowLangMenu(!showLangMenu)}
                              className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold text-white tracking-wide hover:bg-white/30 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Change AI Language"
                           >
                              {displayLanguageMap[aiLanguage] || aiLanguage}
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                           </button>
                           {showLangMenu && (
                               <div className="absolute top-full left-0 mt-2 w-32 bg-[var(--bg-card)] rounded-lg shadow-xl py-1 z-50 border border-[var(--border-color)] overflow-hidden">
                                   {Object.entries(displayLanguageMap).map(([code, name]) => (
                                       <button
                                           key={code}
                                           onClick={() => {
                                               setAiLanguage(code);
                                               setShowLangMenu(false);
                                           }}
                                           className={`block w-full text-left px-4 py-2 text-sm hover:bg-[var(--bg-hover)] transition-colors
                                                ${aiLanguage === code ? 'text-[var(--accent-primary)] font-bold' : 'text-[var(--text-primary)]'}
                                           `}
                                       >
                                           {name}
                                       </button>
                                   ))}
                               </div>
                           )}
                       </div>
                     </div>
                 </div>
             </div>
             <div className="flex items-center gap-1">
                 <button onClick={handleClearChat} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors" title="Clear Chat">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                 </button>
                 <button onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors" title="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                 </button>
             </div>
          </div>

          {/* Chat Body */}
          <div className="flex-1 p-4 overflow-y-auto bg-[var(--bg-card-subtle)] space-y-4 scrollbar-thin scrollbar-thumb-[var(--border-input)]">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                    className={`max-w-[85%] p-3.5 text-[14px] shadow-sm rounded-2xl ${
                        msg.role === 'user' 
                        ? 'bg-[var(--accent-primary)] text-white rounded-br-none' 
                        : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-bl-none'
                    }`}
                >
                    {formatMessageText(msg.text)}
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex justify-start">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3 rounded-2xl rounded-bl-none flex gap-1.5 items-center h-10">
                        <span className="w-1.5 h-1.5 bg-[var(--text-light)] rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-[var(--text-light)] rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></span>
                        <span className="w-1.5 h-1.5 bg-[var(--text-light)] rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></span>
                    </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-[var(--bg-card)] border-t border-[var(--border-color)]">
             <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring-accent)] text-[var(--text-primary)] placeholder-gray-400 resize-none overflow-y-auto min-h-[44px] max-h-[120px]"
                />
                <button 
                    type="submit" 
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    disabled={!inputValue.trim() || isLoading}
                    className={`bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white p-2.5 rounded-full shadow-md transition-all duration-300 flex-shrink-0 ${!inputValue.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Send"
                >
                   <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-5 w-5 transform transition-transform duration-300 ease-in-out ${getRotationClass()}`} 
                        viewBox="0 0 24 24" 
                        fill="currentColor"
                    >
                         <path d="M2.5 12l19-9-9 19-2-8-8-2z" transform="rotate(-45 12 12)" />
                    </svg>
                </button>
             </form>
          </div>
        </div>
      )}
    </>
  );
});

export default AiAssistant;