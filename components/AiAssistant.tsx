import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { User, Screen } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { geminiService } from '../services/geminiService'; 
import MessageContent from './chat/MessageContent'; 
import { PPLX_API_KEY_ENV } from '../constants'; // Import for better API key awareness

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

const AiAssistant = forwardRef<AiAssistantRef, AiAssistantProps>(({ user, currentScreen }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  const { language } = useLanguage();
  const [aiLanguage, setAiLanguage] = useState<string>(language);
  
  // Define the comprehensive FamLink system prompt
  const FAM_LINK_SYSTEM_INSTRUCTION = `
    You are the official FamLink AI Assistant. Your user is named ${user.fullName} and is on the ${currentScreen} screen.
    Your core goal is to answer user questions *exclusively* about the FamLink application and its features.
    
    FAMILINK APPLICATION CONTEXT:
    1.  **Purpose:** FamLink connects parents with trusted care providers and community features to relieve the mental load of parenthood.
    2.  **Core Features:** Nanny Booking, AI-Powered Nanny Assessment (Gemini evaluated), Task Management, Real-time Chat (E2E encrypted), Notifications, Subscription handling.
    3.  **Community:** Mom-to-Mom Activities, Child Outing Sharing, Skill Marketplace.
    4.  **Technical Info:** Supports multilingual (6 languages), global location services (GeoDB), and uses keyboard shortcuts (Shift+N to open, Shift+A to toggle).

    CONSTRAINTS:
    - **REFUSAL:** You MUST politely refuse to answer general knowledge questions (e.g., history, science, coding help outside of app context) or perform creative writing.
    - **Language:** Answer ONLY in the user's language: ${aiLanguage}.
    - **Tone:** Be friendly, concise, and professional.
    
    Begin by greeting the user and asking how you can help them specifically with the FamLink app.
  `.trim();

  // Initialize with a welcome message
  const [messages, setMessages] = useState<Message[]>([
      { role: 'model', text: `Hello ${user.fullName}, I'm your FamLink AI Assistant. How can I help you today?` }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    openChat: () => setIsOpen(true),
    toggleVisibility: () => setIsVisible(prev => !prev),
  }));

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update AI language setting if context language changes
  useEffect(() => {
    setAiLanguage(language);
  }, [language]);
  
  // Focus the input when the chat opens
  useEffect(() => {
    if (isOpen) {
        textareaRef.current?.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    const newMessages: Message[] = [...messages, { role: 'user', text: userMessage }];
    
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
        const prompt = userMessage; // The system prompt contains all the context now
        
        // NEW: Pass the full system instruction to the service
        const aiResponse = await geminiService.generateResponse(prompt, FAM_LINK_SYSTEM_INSTRUCTION);
        
        setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);

    } catch (error) {
        console.error("AI API Call Failed:", error);
        setMessages(prev => [...prev, { role: 'model', text: "Sorry, a serious error occurred during the API communication. Please try again." }]);
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

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-0 right-0 m-4 transition-all duration-300 ${isOpen ? 'w-full max-w-sm h-96' : 'w-16 h-16'}`}>
      {!isOpen ? (
        // Closed State (Floating Button)
        <button 
          onClick={() => setIsOpen(true)} 
          className="w-16 h-16 bg-[var(--accent-primary)] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[var(--accent-primary-hover)] transition-transform active:scale-95"
          title="Open AI Assistant"
        >
          {/* ICON: Using the lightning bolt icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M13 10V3L4 14h7v7l9-11h-7z" clipRule="evenodd" />
          </svg>
        </button>
      ) : (
        // Open State (Modal-like interface)
        <div className="bg-[var(--bg-card)] rounded-xl shadow-2xl h-full flex flex-col border border-[var(--border-color)]">
          
          {/* Header */}
          <div className="p-3 border-b border-[var(--border-color)] flex justify-between items-center shrink-0">
            <h3 className="font-bold text-[var(--text-primary)]">AI Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xl leading-none">&times;</button>
          </div>
          
          {/* Messages Area */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 scrollbar-thin">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 text-sm rounded-2xl ${msg.role === 'user' ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-card-subtle)] text-[var(--text-primary)] border border-[var(--border-color)]'}`}>
                    {/* Use MessageContent for universal rendering */}
                    <MessageContent 
                        content={msg.text} 
                        isUser={msg.role === 'user'} 
                    />
                </div>
              </div>
            ))}
            {isLoading && <div className="text-xs text-gray-500 ml-2">Typing...</div>}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-[var(--bg-card)] border-t border-[var(--border-color)] shrink-0">
             <form onSubmit={handleSendMessage} className="flex gap-2">
                <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about FamLink features..."
                    rows={1}
                    className="flex-1 px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] resize-none"
                />
                <button type="submit" disabled={!inputValue.trim() || isLoading} className="text-[var(--accent-primary)] font-bold disabled:opacity-50 transition-transform active:scale-95">Send</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
});

export default AiAssistant;