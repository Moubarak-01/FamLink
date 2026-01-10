/**
 * components/chat/MessageContent.tsx
 * * Component to universally render AI message content using Markdown, 
 * supporting math (LaTeX/KaTeX) and code highlighting.
 */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';

// NOTE: Ensure you have installed the following packages and imported the CSS globally:
// npm install react-markdown remark-math rehype-katex rehype-highlight
// import 'katex/dist/katex.min.css';
// import 'highlight.js/styles/atom-one-dark.css'; 

interface MessageContentProps {
    content: string;
    isUser: boolean;
}

const MessageContent: React.FC<MessageContentProps> = ({ content, isUser }) => {

    const markdownComponents = {
        // Custom rendering for paragraphs to control spacing
        p: ({ node, ...props }: any) => <p className="mb-2 last:mb-0">{props.children}</p>,

        // Custom rendering for lists to fix indentation and spacing
        ul: ({ node, ...props }: any) => <ul className="list-disc list-outside ml-4 mb-2 space-y-1">{props.children}</ul>,
        ol: ({ node, ...props }: any) => <ol className="list-decimal list-outside ml-4 mb-2 space-y-1">{props.children}</ol>,
        li: ({ node, ...props }: any) => <li className="pl-1">{props.children}</li>,

        // Custom rendering for blockquotes (for visual distinction)
        blockquote: ({ node, ...props }: any) => (
            <blockquote className="border-l-4 border-[var(--accent-primary)] pl-3 italic text-[var(--text-secondary)] my-2">
                {props.children}
            </blockquote>
        ),

        // Custom rendering for headers (optional, for custom styling)
        h1: ({ node, ...props }: any) => <h1 className="text-xl font-bold mt-4 mb-2 text-[var(--text-primary)]">{props.children}</h1>,
        h2: ({ node, ...props }: any) => <h2 className="text-lg font-semibold mt-3 mb-1 text-[var(--text-primary)]">{props.children}</h2>,

        // Custom rendering for strong tags to add emphasis color
        strong: ({ node, ...props }: any) => (
            <strong className="font-extrabold text-[var(--accent-primary)]">{props.children}</strong>
        ),

        // Custom rendering for code blocks to enable horizontal scrolling if needed
        pre: ({ node, ...props }: any) => (
            <pre className="bg-gray-800 text-white p-3 rounded-lg overflow-x-auto my-2">
                {props.children}
            </pre>
        ),

        // Custom link styling
        a: ({ node, ...props }: any) => (
            <a href={props.href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline transition-colors">
                {props.children}
            </a>
        ),
    };

    return (
        <div className={`markdown-body ${isUser ? 'text-white' : 'text-[var(--text-primary)]'}`}>
            <ReactMarkdown
                // Plugins for Math (LaTeX) and Code Highlighting
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
                components={markdownComponents}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MessageContent;