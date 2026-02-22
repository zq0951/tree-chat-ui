import React from 'react';
import { Handle, Position, NodeProps, NodeResizeControl } from '@xyflow/react';
import { Network, Edit, Trash, ChevronDown, Bot, Cpu, ImageIcon, X, FileText, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageNodeData } from '@/lib/types';
import { AppNode, useStore } from '@/store/useStore';

export default function MessageNode({ data, id, selected }: NodeProps<AppNode>) {
  const { addMessage, updateMessageNode, deleteMessageNode, generateAIResponse, addMessageImages, removeMessageImage } = useStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isUser = data.role === 'user';
  // User defaults to txt so they can type, AI defaults to md
  const [viewMode, setViewMode] = React.useState<'md' | 'txt'>(isUser ? 'txt' : 'md');
  const [copied, setCopied] = React.useState(false);

  const toggleViewMode = () => setViewMode(v => v === 'md' ? 'txt' : 'md');

  const handleCopy = () => {
    navigator.clipboard.writeText(data.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBranchUser = () => {
    // Branching off adds an empty user node below the current node
    addMessage(id, 'user', '');
  };

  const handleGenerate = () => {
    if (!data.content.trim()) return;
    // Starts AI streaming output as a child node
    generateAIResponse(id);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newUrls: string[] = [];
    let processed = 0;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          newUrls.push(result);
        }
        processed++;
        if (processed === files.length) {
          addMessageImages(id, [...newUrls]); // Clone the array to ensure change detection
          // reset input so the same files can be uploaded again if deleted
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const isSystem = data.role === 'system';
  const bgColor = isUser
    ? 'bg-blue-900/40 text-blue-50 border-blue-600/50'
    : isSystem
      ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
      : 'bg-emerald-900/40 text-emerald-50 border-emerald-600/50';

  return (
    <>
      <NodeResizeControl
        minWidth={360}
        minHeight={250}
        position="bottom-right"
        style={{ background: 'transparent', border: 'none', right: 5, bottom: 5 }}
      >
        <div className="w-4 h-4 text-white/20 hover:text-white/80 cursor-nwse-resize">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </div>
      </NodeResizeControl>

      <div className={`w-full h-full min-w-[360px] min-h-[250px] rounded-2xl border ${bgColor} shadow-lg backdrop-blur-md flex flex-col relative group`}>
        <style>{`
        .custom-scroller::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scroller::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scroller::-webkit-scrollbar-thumb {
          background-color: #52525b;
          border-radius: 10px;
        }
        .custom-scroller::-webkit-scrollbar-thumb:hover {
          background-color: #71717a;
        }
      `}</style>

        <Handle type="target" position={Position.Top} className="!top-[-2px] !w-4 !h-4 !bg-[#0a0a0a] !border-2 !border-zinc-500 hover:!border-indigo-400 !transition-colors z-10" />

        <div className="custom-drag-handle flex items-center justify-between px-4 py-2 bg-black/20 cursor-grab active:cursor-grabbing rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold opacity-80 uppercase tracking-wider">
              {data.role}
            </span>
            {data.model && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-zinc-300 flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                {data.model}
              </span>
            )}
          </div>

          <div className="nodrag flex items-center gap-1 opacity-60">
            {isUser && (
              <>
                <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
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
            <button type="button" onClick={handleCopy} className="p-1.5 hover:text-green-400 hover:bg-black/20 rounded transition-colors group cursor-pointer" title="Copy Content">
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button type="button" onClick={toggleViewMode} className="p-1.5 hover:text-indigo-400 hover:bg-black/20 rounded transition-colors group cursor-pointer" title="Toggle MD/TXT">
              {viewMode === 'md' ? <Edit className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
            </button>
            <button type="button" onClick={() => deleteMessageNode(id)} className="p-1.5 hover:text-red-400 hover:bg-black/20 rounded transition-colors group cursor-pointer" title="Delete Node">
              <Trash className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col gap-3 h-full overflow-hidden">
          {data.imageUrls && data.imageUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 shrink-0">
              {data.imageUrls.map((url, index) => (
                <div key={index} className="relative group/image rounded-lg overflow-hidden border border-white/10 shadow-sm bg-black/40 backdrop-blur-sm self-start">
                  <img src={url} alt={`Uploaded ${index + 1}`} className="object-cover w-20 h-20" />
                  <button
                    onClick={() => removeMessageImage(id, index)}
                    className="absolute top-1 right-1 p-1 bg-black/60 backdrop-blur-md rounded-md opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-red-500/80 z-20 cursor-pointer"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'txt' ? (
            <textarea
              className="custom-scroller nowheel nodrag w-full flex-1 bg-transparent border-none outline-none resize-none text-sm leading-relaxed min-h-[60px]"
              value={data.content}
              onChange={(e) => updateMessageNode(id, e.target.value)}
              placeholder={isUser ? "Type your prompt..." : "AI Response..."}
            />
          ) : (
            <div className="custom-scroller nowheel nodrag w-full flex-1 overflow-auto bg-transparent border-none text-sm min-h-[60px] prose prose-invert prose-sm max-w-none prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {data.content || '*Empty content*'}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center px-4 py-2 bg-black/20 gap-2 border-t border-white/5 rounded-b-2xl">
          {isUser ? (
            <button
              onClick={handleGenerate}
              className="flex-1 flex items-center justify-center gap-2 text-xs py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200 transition-colors cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Generate AI Response</span>
            </button>
          ) : (
            <button
              onClick={handleBranchUser}
              className="flex-1 flex items-center justify-center gap-2 text-xs py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Network className="w-3.5 h-3.5" />
              <span>Branch New Prompt</span>
            </button>
          )}
        </div>

        <Handle type="source" position={Position.Bottom} className="!bottom-[-2px] !w-4 !h-4 !bg-[#0a0a0a] !border-2 !border-zinc-500 hover:!border-indigo-400 !transition-colors z-10" />
      </div>
    </>
  );
}
