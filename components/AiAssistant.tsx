import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { geminiService } from '../services/geminiService';
// Removed AuthContext import as we use props now
import { useLanguage } from '../contexts/LanguageContext';
import { User, Screen } from '../types';

const FAM_LINK_SYSTEM_INSTRUCTION = `
  You are the **FamLink AI Expert**, the specialized assistant for the FamLink community app.

  ### 🎯 PRIMARY DIRECTIVE: APP EXPERT
  - **Goal:** Help users navigate and understand FamLink with **IN-DEPTH** expertise.
  - **Feature Questions:** When asked about *Nanny Booking*, *Activities*, *Marketplace*, or *Support Groups*, provide **DETAILED** guides. Explain step-by-step usage, benefits, and location in the app.
  - **Tone:** Enthusiastic, professional, and confident.

  ### 🧮 MATH & FORMULA RENDERING (CRITICAL)
  - **RULE:** You **MUST** use LaTeX for ALL mathematical formulas.
  - **FORBIDDEN:** Do NOT use plain text approximations (e.g., do not write "x = (-b +/- sqrt...)").
  - **REQUIRED FORMAT:**
    - **Inline Math:** Use single dollar signs: $E=mc^2$
    - **Block Math:** Use double dollar signs: $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
  - If the user asks for a formula, ALWAYS render it in Block Math ($$).

  ### 🎨 VISUAL RULES
  - **Keywords:** Use **bold** (markdown **) for buttons, key terms, and action verbs. (Renders as Pink).
  - **Lists:** Use clean bullet points.
  
  ### CORE KNOWLEDGE BASE
  1.  **Nanny Booking:** Profiles, verifications, booking requests, hourly rates.
  2.  **Community Activities:** Events, playdates, workshops, age-group filtering.
  3.  **Support Groups:** Forums, advice sharing, safe space for parents.
  4.  **Exchange Marketplace:** Sustainability, trading toys/clothes, "Give what you don't need".
  
  ### USER CONTEXT
  - User Name: **{{userName}}**. Address them kindly.
`.trim();

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AiAssistantProps {
  user: User;
  currentScreen: Screen;
}

export interface AiAssistantRef {
  open: () => void;
  close: () => void;
  toggle: () => void;
  clearHistory: () => void; // Added for Ctrl+D shortcut
}

const MessageContent = ({ content, isUser }: { content: string, isUser: boolean }) => {
  if (isUser) {
    return <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{content}</p>;
  }
  return (
    <div className="prose prose-sm max-w-none text-[15px] leading-relaxed text-[var(--text-primary)] dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h3: ({ node, ...props }) => <h3 className="text-sm font-bold mt-2 mb-1 uppercase tracking-wide text-[var(--accent-primary)]" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
          li: ({ node, ...props }) => <li className="pl-1 marker:text-[var(--text-secondary)]" {...props} />,
          p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold text-[#ec4899] dark:text-[#f472b6]" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

const AiAssistant = forwardRef<AiAssistantRef, AiAssistantProps>(({ user, currentScreen }, ref) => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [showSlowLoader, setShowSlowLoader] = useState(false);
  const loadingTimerRef = useRef<number | null>(null);

  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
    clearHistory: () => setMessages(getInitialMessage())
  }));

  // Drag State
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: window.innerHeight - 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const chatRef = useRef<HTMLDivElement>(null);

  // Sync AI Language with App Language
  const [aiLanguage, setAiLanguage] = useState(language);

  // Update AI language when app language changes
  useEffect(() => {
    setAiLanguage(language);
  }, [language]);

  // Generate initial message using translation
  const getInitialMessage = (): Message[] => [
    { role: 'model', text: t('ai_welcome_message', { name: user.fullName || 'User' }) }
  ];

  const [messages, setMessages] = useState<Message[]>(getInitialMessage);
  const [inputValue, setInputValue] = useState('');

  // Re-initialize messages when language changes
  useEffect(() => {
    setMessages(getInitialMessage());
  }, [language]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserAtBottomRef = useRef(true);

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Quick Action Chips - dynamic based on current language
  const QUICK_ACTIONS = [
    { label: t('ai_chip_find_nanny'), action: "Nanny Booking" },
    { label: t('ai_chip_create_activity'), action: "Community Activities" },
    { label: t('ai_chip_contact_support'), action: "Support" },
    { label: t('ai_chip_my_schedule'), action: "Schedule" }
  ];

  const handleChipClick = (action: string) => {
    setInputValue(`How do I use ${action}?`);
    // Optional: Auto-send or focus input
    textareaRef.current?.focus();
  };

  // Helper: Check if user is at the bottom (within 30px)
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 30; // 30px threshold
      isUserAtBottomRef.current = isAtBottom;
    }
  };

  // --- Drag Handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!chatRef.current) return;
    setIsDragging(true);
    setOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      // Calculate new position
      let newX = e.clientX - offset.x;
      let newY = e.clientY - offset.y;

      // Boundary Checks (Keep inside viewport)
      const maxX = window.innerWidth - (chatRef.current?.offsetWidth || 400);
      const maxY = window.innerHeight - (chatRef.current?.offsetHeight || 600);

      // Clamp
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, offset]);

  // Initial Position (Bottom Right)
  useEffect(() => {
    setPosition({ x: window.innerWidth - 425, y: window.innerHeight - 620 });
  }, []);


  const handleClearChat = async () => {
    setMessages(getInitialMessage());
    setInputValue('');
  };

  // Expose reset globally for the "Clear History" button in Settings or header
  // (Optional: You could use a Context for this if needed globally)
  // For now, let's assume this component manages its own state entirely.

  // Attach a listener for a custom event 'reset-ai-chat'
  useEffect(() => {
    const handleReset = () => {
      if (window.confirm("Clear all AI chat history?")) {
        handleClearChat();
      }
    };

    // Custom event mechanism if needed (omitted for now to keep simple)
    // window.addEventListener('reset-ai-chat', handleReset);
    // return () => window.removeEventListener('reset-ai-chat', handleReset);
  }, []);

  // Use a ref to expose the clear function to the parent via useImperativeHandle if we were using it,
  // but simpler to just put a clear button in the UI.

  // NOTE: If we wanted to persist chat, we'd use localStorage here.
  // useEffect(() => {
  //   localStorage.setItem('famlink_ai_chat', JSON.stringify(messages));
  // }, [messages]);

  // Re-hydrate on mount
  // useEffect(() => {
  //   const saved = localStorage.getItem('famlink_ai_chat');
  //   if (saved) setMessages(JSON.parse(saved));
  // }, []);


  // Register a small telemetry signal (mock)
  useEffect(() => {
    if (user) {
      // Telemetry loaded
    }
  }, [user]);

  // --- Keyboard Shortcuts & Global Toggles ---
  // Shift+N to Toggle is handled above.

  // --- Theme Syncing ---
  // The component uses CSS variables like var(--bg-card), so it should auto-adapt 
  // if the parent app handles theme classes on the <body> or <html> tag.


  // --- EventSource / Socket Logic for Real-time updates (Future) ---
  // For now, we just use the REST API via GeminiService.


  // Clear Chat Implementation that conforms to the "reset" prop expectation if we had one.
  // Instead, we create a global event listener so the Profile page can trigger it.
  useEffect(() => {
    const resetHandler = () => {
      if (window.confirm("Clear all AI chat history?")) {
        handleClearChat();
      }
    };
    // We are adding it to the window object effectively
    (window as any).clearFamLinkChat = resetHandler;

    return () => {
      delete (window as any).clearFamLinkChat;
    };
  }, []);

  // Additional settings:
  // "Enter" to send is standard. "Shift+Enter" for new line.

  useEffect(() => {
    // Expose a method to open the chat programmatically
    (window as any).openFamLinkChat = () => setIsOpen(true);
    return () => { delete (window as any).openFamLinkChat; };
  }, []);


  // --- Error Boundary / Fallback ---
  // Wrapped internally by try-catch in handleSendMessage

  // Auto-scroll to bottom when messages update (Smart Scroll)
  useEffect(() => {
    // Only auto-scroll if the user hasn't manually scrolled up
    if (isUserAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Update AI language setting if context language changes
  useEffect(() => {
    setAiLanguage(language);
  }, [language]);

  // Clear Chat Button Handler (In-modal version)
  const handleClearButtonClick = () => {
    if (window.confirm("Are you sure you want to clear the conversation history?")) {
      handleClearChat();
    }
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      // STOP RECORDING
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      // START RECORDING
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          // Create Blob
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });

          // Show processing state instead of text
          setIsProcessingVoice(true);

          // Send to Local Whisper Service
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.wav");

          try {
            // Local Whisper Service Port 3002
            const response = await fetch("http://localhost:3002/transcribe", {
              method: "POST",
              body: formData,
            });

            const data = await response.json();

            if (data.text) {
              setInputValue(prev => {
                const trimmed = prev.trim();
                return trimmed ? `${trimmed} ${data.text}` : data.text;
              });

              // UI Updates
              setTimeout(() => {
                // Auto-focus the input so user can edit or send
                textareaRef.current?.focus();
                // Trigger auto-resize logic manually
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto';
                  textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
                }
              }, 50);

            } else {
              console.error("No text returned from transcription");
              alert(t('ai_error_transcription'));
            }
          } catch (error) {
            console.error("Transcription failed:", error);
            setInputValue(t('ai_error_voice_service'));
          } finally {
            setIsProcessingVoice(false);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);

      } catch (err) {
        console.error("Microphone access denied:", err);
        alert(t('ai_microphone_required'));
      }
    }
  };

  const handleInputInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Auto-expand
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isThinking) return;

    // Force scroll to bottom when user sends a message
    isUserAtBottomRef.current = true;

    const userMessage = inputValue.trim();

    // 1. Setup Initial State
    setMessages(prev => [...prev, { role: 'user', text: userMessage }, { role: 'model', text: '' }]);
    setInputValue('');
    setIsThinking(true);

    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // 2. Smart Loader Start
    loadingTimerRef.current = setTimeout(() => {
      setShowSlowLoader(true);
    }, 2000) as unknown as number;

    try {
      const prompt = userMessage;

      // Map language code to full name for clearer AI instruction
      const LANGUAGE_MAP: Record<string, string> = {
        en: "English",
        fr: "French (Français)",
        es: "Spanish (Español)",
        ar: "Arabic (العربية)",
        zh: "Chinese (中文)",
        ja: "Japanese (日本語)"
      };

      const currentLangName = LANGUAGE_MAP[aiLanguage] || "English";

      const languageDirective = `
      
      ### 🌍 LANGUAGE INSTRUCTION (CRITICAL)
      - The user is currently browsing the app in **${currentLangName}**.
      - You **MUST** respond in **${currentLangName}**.
      - Do NOT respond in English unless the user's current language is English.
      - Translate all your answers to **${currentLangName}**.
      `;

      const interpolatedInstruction = FAM_LINK_SYSTEM_INSTRUCTION.replace('{{userName}}', user.fullName || "User") + languageDirective;

      const stream = await geminiService.generateResponse(prompt, interpolatedInstruction);

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
        const lastMessageIndex = prev.length - 1;
        if (prev[lastMessageIndex].role === 'model') {
          prev[lastMessageIndex] = {
            ...prev[lastMessageIndex],
            text: t('ai_error_api')
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



  // Calculate position styles for the open chat window
  const chatStyle = isOpen ? {
    position: 'fixed' as const,
    top: `${position.y}px`,
    left: `${position.x}px`,
    width: '100%',
    maxWidth: '400px', // Slightly wider for Enterprise feel
    height: '550px',   // Taller
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
      <style>{`
        /* Custom Scrollbar for AI Chat */
        .ai-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .ai-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .ai-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.4); /* Gray-400 with opacity */
          border-radius: 20px;
        }
        .ai-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.6);
        }
      `}</style>
      {!isOpen ? (
        // Closed State (Floating Button)
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-[var(--accent-primary)] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[var(--accent-primary-hover)] transition-transform active:scale-95"
          title={t('ai_open_assistant')}
        >
          {/* REPLACED ICON: Use a rounded Message Bubble Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 4H3C2.44772 4 2 4.44772 2 5V15C2 15.5523 2.44772 16 3 16H6V20.5724C6 20.8997 6.36531 21.0963 6.63413 20.9238L10.7297 18H21C21.5523 18 22 17.5523 22 17V5C22 4.44772 21.5523 4 21 4Z" />
          </svg>
        </button>
      ) : (
        // Open State (Draggable Modal) - Enterprise Style
        <div className="bg-[var(--bg-card)] rounded-xl shadow-2xl h-full flex flex-col border border-[var(--border-color)] font-sans transition-colors duration-200">

          {/* Header - Minimalist */}
          <div className="p-4 bg-[var(--bg-card)] border-b border-[var(--border-color)] flex justify-between items-center shrink-0 rounded-t-xl">

            {/* Drag Handles / Title Area */}
            <div
              onMouseDown={handleMouseDown}
              className="flex items-center cursor-move select-none flex-grow"
              style={{ touchAction: 'none' }}
            >
              <div className="mr-3 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm overflow-hidden bg-white">
                <img src="/famlink-icon.png" alt="FamLink" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-primary)] text-sm">FamLink Assistant</h3>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <p className="text-[10px] text-[var(--text-secondary)] font-medium">{t('ai_status_online')}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearButtonClick}
                className="w-8 h-8 flex items-center justify-center bg-transparent hover:bg-red-50 text-red-500 rounded-full transition-colors"
                title="Clear Chat History"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1 rounded-full">&times;</button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            data-lenis-prevent
            onWheel={(e) => e.stopPropagation()}
            className="flex-1 p-4 overflow-y-auto space-y-4 ai-scrollbar bg-[var(--bg-subtle)] overscroll-contain"
          >
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'user' ? (
                  <div className="bg-[var(--accent-primary)] text-white px-5 py-3 rounded-2xl rounded-br-sm ml-auto max-w-[85%] shadow-sm break-words whitespace-pre-wrap overflow-hidden">
                    <MessageContent content={msg.text} isUser={true} />
                  </div>
                ) : (
                  <div className="flex gap-3 max-w-[90%] group">
                    {/* Anchor Icon */}
                    <div className="flex-shrink-0 w-8 h-8 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full flex items-center justify-center mt-0 shadow-sm overflow-hidden p-1">
                      <img src="/famlink-icon.png" alt="AI" className="w-full h-full object-contain" />
                    </div>
                    {/* Message Bubble - Sharp top-left */}
                    <div className="bg-[var(--bg-card)] text-[var(--text-primary)] px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm border border-[var(--border-color)] break-words whitespace-pre-wrap overflow-hidden">
                      <MessageContent content={msg.text} isUser={false} />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Thinking Spinner */}
            {(isThinking && messages[messages.length - 1].text === '') && (
              <div className="flex items-start gap-3 p-2">
                <div className="w-8 h-8 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
                </div>
                <span className="text-xs text-gray-400 mt-2 font-medium">{t('ai_thinking')}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Area with Chips & Input */}
          <div className="pt-2 pb-4 px-4 bg-[var(--bg-card)] border-t border-[var(--border-color)] shrink-0 flex flex-col gap-3 rounded-b-xl">

            {/* Quick Action Chips (Horizontal Scroll + Hidden Scrollbar) */}
            {!isThinking && (
              <div
                className="flex gap-2 overflow-x-auto pb-1 scrollbar-none mask-fade-right"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                data-lenis-prevent
                onWheel={(e) => e.stopPropagation()}
              >
                {QUICK_ACTIONS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChipClick(chip.label)}
                    className="flex-shrink-0 px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] text-[11px] font-medium rounded-full hover:bg-[var(--bg-hover)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors whitespace-nowrap shadow-sm"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            {/* Smart Input Bar */}
            <div>
              <form onSubmit={handleSendMessage} className="relative flex items-end gap-2">
                <div className="relative flex-grow flex items-center bg-[var(--bg-input)] border border-[var(--border-input)] rounded-3xl px-4 py-2 focus-within:ring-2 focus-within:ring-[var(--accent-primary)] focus-within:bg-[var(--bg-card)] transition-all shadow-inner">

                  {/* Processing Overlay */}
                  {isProcessingVoice && (
                    <div className="absolute inset-0 bg-[var(--bg-input)] rounded-3xl z-10 flex items-center px-4 gap-3">
                      <div className="w-5 h-5 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-400 italic">{t('ai_processing_voice')}</span>
                    </div>
                  )}

                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleInputInput}
                    onKeyDown={handleKeyDown}
                    placeholder={t('ai_input_placeholder')}
                    rows={1}
                    data-lenis-prevent
                    onWheel={(e) => e.stopPropagation()}
                    className="flex-grow bg-transparent border-none outline-none focus:outline-none focus:ring-0 shadow-none appearance-none text-sm text-[var(--text-primary)] placeholder-gray-400 resize-none max-h-[100px] py-1"
                    style={{ minHeight: '24px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    spellCheck={false}
                  />

                  {/* Microphone Icon */}
                  <button
                    type="button"
                    onClick={handleVoiceInput}
                    className={`ml-2 transition-colors p-1 flex-shrink-0 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-[var(--accent-primary)]'}`}
                    title={isRecording ? "Stop Recording" : "Voice Input"}
                    disabled={isProcessingVoice}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={isRecording ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                </div>

                {/* Circular Send Button */}
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isThinking}
                  className="flex-shrink-0 w-10 h-10 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white rounded-full shadow-md flex items-center justify-center disabled:opacity-50 disabled:shadow-none transition-all hover:scale-105 active:scale-95 mb-0.5"
                  title="Send Message"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </form>

              {/* Powered By Caption */}
              <div className="text-center mt-2">
                <p className="text-[10px] text-gray-300 font-medium tracking-wide">{t('ai_powered_by')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default AiAssistant;