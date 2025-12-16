import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { User, Screen } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { geminiService } from '../services/geminiService'; 
import MessageContent from './chat/MessageContent'; 

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
  
  // Draggability State
  const [isDragging, setIsDragging] = useState(false);
  // Initial position set near the bottom-right corner
  const [position, setPosition] = useState({ x: window.innerWidth - 350, y: window.innerHeight - 400 }); 
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const chatRef = useRef<HTMLDivElement>(null);
  
  // Smart Loader State
  const [isThinking, setIsThinking] = useState(false); // General loading state
  const [showSlowLoader, setShowSlowLoader] = useState(false); // Only true after 2s
  const loadingTimerRef = useRef<number | null>(null); // Reference to the timer

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
  const INITIAL_MESSAGE: Message[] = [{ role: 'model', text: `Hello ${user.fullName}, I'm your FamLink AI Assistant. How can I help you today?` }];
  
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGE);
  const [inputValue, setInputValue] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Drag Handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!chatRef.current) return;
    setIsDragging(true);
    setOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - offset.x;
    const newY = e.clientY - offset.y;
    
    // Calculate boundaries
    const chatWidth = chatRef.current?.offsetWidth || 350;
    const chatHeight = chatRef.current?.offsetHeight || 400;
    const maxX = window.innerWidth - chatWidth;
    const maxY = window.innerHeight - chatHeight;

    setPosition({
      x: Math.min(Math.max(10, newX), maxX - 10), // 10px minimum padding
      y: Math.min(Math.max(10, newY), maxY - 10),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);
  // --- End Drag Handlers ---

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

  // Clear Chat Handler
  const handleClearChat = () => {
      if (window.confirm("Are you sure you want to clear the conversation history?")) {
          setMessages(INITIAL_MESSAGE);
      }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isThinking) return;

    const userMessage = inputValue.trim();
    
    // 1. Setup Initial State
    setMessages(prev => [...prev, { role: 'user', text: userMessage }, { role: 'model', text: '' }]);
    setInputValue('');
    setIsThinking(true);
    
    // 2. Smart Loader Start
    // Show spinner ONLY if thinking takes longer than 2000ms
    loadingTimerRef.current = setTimeout(() => {
        setShowSlowLoader(true);
    }, 2000) as unknown as number; // Type assertion for timer ID

    try {
        const prompt = userMessage; 
        
        const stream = await geminiService.generateResponse(prompt, FAM_LINK_SYSTEM_INSTRUCTION);
        
        let firstTokenReceived = false;
        let finalResponseText = '';

        // 3. Process Stream
        for await (const chunk of stream) {
            if (!firstTokenReceived) {
                // Instant Timer Kill on first token
                if (loadingTimerRef.current) {
                    clearTimeout(loadingTimerRef.current);
                    loadingTimerRef.current = null;
                }
                setShowSlowLoader(false);
                firstTokenReceived = true;
            }

            finalResponseText += chunk;
            
            // Update the last message in state with the new chunk
            setMessages(prev => {
                const lastMessageIndex = prev.length - 1;
                const updatedMessages = [...prev];
                // Ensure we are updating the AI's message
                if (updatedMessages[lastMessageIndex].role === 'model') {
                    updatedMessages[lastMessageIndex] = { 
                        ...updatedMessages[lastMessageIndex], 
                        text: finalResponseText 
                    };
                }
                return updatedMessages;
            });
        }
    } catch (error) {
        console.error("AI API Call Failed:", error);
        setMessages(prev => {
             // Replace the empty message with the error
            const lastMessageIndex = prev.length - 1;
             if (prev[lastMessageIndex].role === 'model') {
                 prev[lastMessageIndex] = { 
                     ...prev[lastMessageIndex], 
                     text: "Sorry, a serious error occurred during the API communication. Please try again." 
                 };
             }
             return [...prev];
        });
    } finally {
        // 4. Cleanup
        if (loadingTimerRef.current) {
            clearTimeout(loadingTimerRef.current);
        }
        setIsThinking(false);
        setShowSlowLoader(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
  };

  if (!isVisible) return null;

  // Calculate position styles for the open chat window
  const chatStyle = isOpen ? {
      position: 'fixed' as const,
      top: `${position.y}px`,
      left: `${position.x}px`,
      width: '100%', 
      maxWidth: '350px',
      height: '400px', 
      maxHeight: '80vh',
      zIndex: 1000,
      transition: isDragging ? 'none' : 'opacity 0.3s' // Disable transition during drag
  } : {};


  return (
    <div 
        ref={chatRef} 
        style={chatStyle} 
        className={`m-4 
            ${!isOpen ? 'fixed bottom-0 right-0 w-16 h-16' : 'shadow-2xl'}
        `}
    >
      {!isOpen ? (
        // Closed State (Floating Button)
        <button 
          onClick={() => setIsOpen(true)} 
          // Use pink accent color for background
          className="w-16 h-16 bg-[var(--accent-primary)] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[var(--accent-primary-hover)] transition-transform active:scale-95"
          title="Open AI Assistant"
        >
          {/* REPLACED ICON: Use a rounded Message Bubble Icon (from second picture) */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 4H3C2.44772 4 2 4.44772 2 5V15C2 15.5523 2.44772 16 3 16H6V20.5724C6 20.8997 6.36531 21.0963 6.63413 20.9238L10.7297 18H21C21.5523 18 22 17.5523 22 17V5C22 4.44772 21.5523 4 21 4Z" />
          </svg>
        </button>
      ) : (
        // Open State (Draggable Modal)
        <div className="bg-[var(--bg-card)] rounded-xl shadow-2xl h-full flex flex-col border border-[var(--border-color)]">
          
          {/* Header */}
          <div className="p-3 border-b border-[var(--border-color)] flex justify-between items-center shrink-0">
              
              {/* Drag Handles / Title Area */}
              <div 
                  onMouseDown={handleMouseDown} 
                  className="flex items-center cursor-move select-none flex-grow"
                  style={{ touchAction: 'none' }} 
              >
                  <h3 className="font-bold text-[var(--text-primary)] mr-3">AI Assistant</h3>
                  
                  {/* IMPLEMENTATION: Center the drag dots relative to the title */}
                  <div className="flex flex-col gap-0.5 items-center justify-center flex-grow opacity-50 text-[var(--text-secondary)]">
                      <div className="flex gap-0.5">
                          <span className="w-1 h-1 bg-current rounded-full"></span>
                          <span className="w-1 h-1 bg-current rounded-full"></span>
                          <span className="w-1 h-1 bg-current rounded-full"></span>
                      </div>
                      <div className="flex gap-0.5">
                          <span className="w-1 h-1 bg-current rounded-full"></span>
                          <span className="w-1 h-1 bg-current rounded-full"></span>
                          <span className="w-1 h-1 bg-current rounded-full"></span>
                      </div>
                  </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                  {/* Clear Chat Button */}
                  <button 
                      onClick={handleClearChat} 
                      className="text-[var(--text-secondary)] hover:text-red-500 p-1 rounded-full transition-colors"
                      title="Clear Chat History"
                  >
                      {/* Trash/Clear Icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 10-2 0v6a1 1 0 102 0V8z" clipRule="evenodd" />
                      </svg>
                  </button>

                  {/* X Close Button */}
                  <button onClick={() => setIsOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xl leading-none p-1 rounded-full">&times;</button>
              </div>
          </div>
          
          {/* Messages Area */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 scrollbar-thin">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 text-sm rounded-2xl ${msg.role === 'user' ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-card-subtle)] text-[var(--text-primary)] border border-[var(--border-color)]'}`}>
                    <MessageContent 
                        content={msg.text} 
                        isUser={msg.role === 'user'} 
                    />
                </div>
              </div>
            ))}
            {/* Show smart loader */}
            {(isThinking && messages[messages.length - 1].text === '') && (
                <div className="flex justify-start items-center gap-2 p-2">
                    <span className="text-xs text-gray-500">
                        {showSlowLoader ? 'AI is engaging deep thought...' : 'AI is processing...'}
                    </span>
                </div>
            )}
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
                    // REPLACED PLACEHOLDER: WhatsApp style icon (Unicode) + text
                    placeholder="💬 Type a FamLink question..." 
                    rows={1}
                    className="flex-1 px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] resize-none"
                />
                {/* RE-STYLED SEND BUTTON: Pink background, White Icon (matching WhatsApp style) */}
                <button 
                    type="submit" 
                    disabled={!inputValue.trim() || isThinking} 
                    // Pink background, ensures icon is white via text-white
                    className="flex items-center justify-center p-2 text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] rounded-lg shadow-md disabled:opacity-50 transition-transform active:scale-95"
                    title="Send Message"
                >
                    {/* REPLACED ICON: Simple solid arrow pointing right/up-right for clean WhatsApp look */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                        <path d="M4.697 19.467l14.93-7.465a.5.5 0 000-.864L4.697 3.533a.5.5 0 00-.773.432L4.015 9.5H10a1 1 0 110 2H4.015l-.091 5.535a.5.5 0 00.773.432z" />
                    </svg>
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
});

export default AiAssistant;