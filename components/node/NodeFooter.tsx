import React from 'react';
import { Bot, Network } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface NodeFooterProps {
  isUser: boolean;
  hasError: boolean;
  selectedConfigId: string;
  selectedModel: string;
  configOptions: { value: string; label: string }[];
  modelOptions: { value: string; label: string }[];
  onConfigChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onGenerate: () => void;
  onBranch: () => void;
  onRetry: () => void;
}

export function NodeFooter({
  isUser, hasError,
  selectedConfigId, selectedModel,
  configOptions, modelOptions,
  onConfigChange, onModelChange,
  onGenerate, onBranch, onRetry,
}: NodeFooterProps) {
  return (
    <div className="flex justify-between items-center px-4 py-2 bg-black/20 gap-2 border-t border-white/5 rounded-b-2xl">
      {isUser ? (
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center gap-2">
            <CustomSelect
              value={selectedConfigId}
              placeholder="Select API Config"
              options={configOptions}
              onChange={onConfigChange}
            />

            <CustomSelect
              value={selectedModel}
              placeholder="Select Model"
              disabled={!selectedConfigId}
              options={modelOptions}
              onChange={onModelChange}
            />
          </div>

          <button
            onClick={onGenerate}
            className="w-full flex items-center justify-center gap-2 text-xs py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200 transition-colors cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Generate AI Response</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center w-full gap-2">
          <button
            onClick={onBranch}
            className="flex-1 flex items-center justify-center gap-2 text-xs py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Network className="w-3.5 h-3.5" />
            <span>Branch New Prompt</span>
          </button>

          {hasError && (
            <button
              onClick={onRetry}
              className="flex items-center justify-center gap-2 text-xs py-1.5 px-3 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-200 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-rotate-cw"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
              <span>Retry</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
