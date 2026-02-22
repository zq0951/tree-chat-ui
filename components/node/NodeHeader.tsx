import React from 'react';
import { Edit, Trash, Cpu, ImageIcon, FileText, Copy, Check } from 'lucide-react';
import { MessageRole, ApiConfig } from '@/lib/types';

interface NodeHeaderProps {
  role: MessageRole;
  model?: string;
  configId?: string;
  apiConfigs: ApiConfig[];
  viewMode: 'md' | 'txt';
  onToggleViewMode: () => void;
  onCopy: () => void;
  copied: boolean;
  onDelete: () => void;
  onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function NodeHeader({
  role, model, configId, apiConfigs,
  viewMode, onToggleViewMode, onCopy, copied,
  onDelete, onImageUpload, fileInputRef,
}: NodeHeaderProps) {
  const isUser = role === 'user';

  return (
    <div className="custom-drag-handle flex items-center justify-between px-4 py-2 bg-black/20 cursor-grab active:cursor-grabbing rounded-t-2xl">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono font-semibold opacity-80 uppercase tracking-wider">
          {role}
        </span>
        {model && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-zinc-300 flex items-center gap-1">
            <Cpu className="w-3 h-3" />
            <span className="max-w-[120px] truncate" title={model}>{model}</span>
            {configId && apiConfigs.find(c => c.id === configId) && (
              <span className="opacity-50 ml-1">({apiConfigs.find(c => c.id === configId)?.name})</span>
            )}
          </span>
        )}
      </div>

      <div className="nodrag flex items-center gap-1 opacity-60">
        {isUser && onImageUpload && fileInputRef && (
          <>
            <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={onImageUpload} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 hover:text-indigo-400 hover:bg-black/20 rounded transition-colors group cursor-pointer"
              title="Attach Images"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </>
        )}
        <button type="button" onClick={onCopy} className="p-1.5 hover:text-green-400 hover:bg-black/20 rounded transition-colors group cursor-pointer" title="Copy Content">
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        <button type="button" onClick={onToggleViewMode} className="p-1.5 hover:text-indigo-400 hover:bg-black/20 rounded transition-colors group cursor-pointer" title="Toggle MD/TXT">
          {viewMode === 'md' ? <Edit className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
        </button>
        <button type="button" onClick={onDelete} className="p-1.5 hover:text-red-400 hover:bg-black/20 rounded transition-colors group cursor-pointer" title="Delete Node">
          <Trash className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
