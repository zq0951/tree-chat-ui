import React from 'react';
import { Bot, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageRole } from '@/lib/types';

interface NodeContentProps {
  role: MessageRole;
  content: string;
  error?: string;
  viewMode: 'md' | 'txt';
  localContent: string;
  onLocalContentChange: (value: string) => void;
  onBlur: (value: string) => void;
  onPreviewImage: (url: string) => void;
}

export function NodeContent({
  role, error, viewMode,
  localContent, onLocalContentChange, onBlur,
  onPreviewImage,
}: NodeContentProps) {
  const isUser = role === 'user';

  if (viewMode === 'txt') {
    return (
      <textarea
        className="custom-scroller nowheel nodrag w-full flex-1 bg-transparent border-none outline-none resize-none text-sm leading-relaxed min-h-[60px]"
        value={localContent}
        onChange={(e) => onLocalContentChange(e.target.value)}
        onBlur={(e) => onBlur(e.target.value)}
        placeholder={isUser ? "Type your prompt..." : "AI Response..."}
      />
    );
  }

  return (
    <div className="custom-scroller nowheel nodrag w-full flex-1 overflow-auto bg-transparent border-none text-sm min-h-[60px] prose prose-invert prose-sm max-w-none prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10 flex flex-col gap-3">
      {/* Markdown Content */}
      {localContent && (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
            img: ({ node, ...props }: any) => (
              <img
                {...props}
                alt={props.alt || "Markdown illustration"}
                className="cursor-zoom-in rounded-md shadow-sm max-h-64 object-contain inline-block transition-transform hover:scale-[1.02]"
                onClick={() => props.src && onPreviewImage(props.src)}
              />
            )
          }}
        >
          {localContent}
        </ReactMarkdown>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-200 text-xs mt-auto">
          <div className="font-semibold text-red-400 mb-1 flex items-center gap-1.5">
            <X className="w-4 h-4" /> Generation Failed
          </div>
          <div className="font-mono whitespace-pre-wrap opacity-80 break-words">{error}</div>
        </div>
      )}

      {/* Empty / Generating State */}
      {!localContent && !error && (
        <div className="flex items-center gap-2 text-zinc-400 italic pt-1">
          {role === 'assistant' ? (
            <div className="flex items-center gap-1.5 opacity-80">
              <Bot className="w-4 h-4 animate-pulse text-indigo-400" />
              <span className="animate-pulse">Generating...</span>
            </div>
          ) : (
            <span className="opacity-50">*Empty*</span>
          )}
        </div>
      )}
    </div>
  );
}
