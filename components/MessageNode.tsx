import React, { memo } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position, NodeProps, NodeResizeControl } from '@xyflow/react';
import { Network, Edit, Trash, Bot, Cpu, ImageIcon, X, FileText, Copy, Check, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AppNode, useStore } from '@/store/useStore';
import { ApiConfig } from '@/lib/types';

export function CustomSelect({
  value,
  options,
  onChange,
  placeholder,
  disabled
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div ref={containerRef} className="relative flex-1 nodrag">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-black/40 border border-white/10 rounded-lg pl-3 pr-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer hover:bg-black/60 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-[100] bottom-full left-0 right-0 mb-1 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl overflow-hidden py-1 max-h-48 overflow-y-auto custom-scroller nowheel nodrag">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-white/10 transition-colors ${value === opt.value ? 'bg-indigo-500/20 text-indigo-300' : 'text-zinc-300'}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              <span className="truncate block">{opt.label}</span>
            </button>
          ))}
          {options.length === 0 && (
            <div className="px-3 py-2 text-xs text-zinc-500 text-center">No options available</div>
          )}
        </div>
      )}
    </div>
  );
}

function MessageNode({ data, id }: NodeProps<AppNode>) {
  const addMessage = useStore(state => state.addMessage);
  const updateMessageNode = useStore(state => state.updateMessageNode);
  const deleteMessageNode = useStore(state => state.deleteMessageNode);
  const generateAIResponse = useStore(state => state.generateAIResponse);
  const addMessageImages = useStore(state => state.addMessageImages);
  const removeMessageImage = useStore(state => state.removeMessageImage);
  const apiConfigs = useStore(state => state.apiConfigs);
  const lastSelectedConfigId = useStore(state => state.lastSelectedConfigId);
  const lastSelectedModel = useStore(state => state.lastSelectedModel);
  const setLastConfigSelection = useStore(state => state.setLastConfigSelection);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isUser = data.role === 'user';
  const isSystem = data.role === 'system';
  // User defaults to txt so they can type, AI defaults to md
  const [viewMode, setViewMode] = React.useState<'md' | 'txt'>(isUser || isSystem ? 'txt' : 'md');
  const [copied, setCopied] = React.useState(false);
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);

  // Default selection for generation
  const [selectedConfigId, setSelectedConfigId] = React.useState<string>('');
  const [selectedModel, setSelectedModel] = React.useState<string>('gemini-3-flash-preview');

  // Auto-select based on history or first available config
  React.useEffect(() => {
    if (apiConfigs.length > 0) {
      const savedConfigIdx = apiConfigs.findIndex(c => c.id === lastSelectedConfigId);
      if (savedConfigIdx !== -1) {
        setSelectedConfigId(lastSelectedConfigId!);
        const configModels = apiConfigs[savedConfigIdx].models;
        if (lastSelectedModel && configModels.includes(lastSelectedModel)) {
          setSelectedModel(lastSelectedModel);
        } else {
          setSelectedModel(configModels[0] || '');
        }
      } else if (!selectedConfigId) {
        // Fallback to first if history is invalid
        setSelectedConfigId(apiConfigs[0].id);
        setSelectedModel(apiConfigs[0].models[0]);
      }
    } else {
      setSelectedConfigId('');
      setSelectedModel('');
    }
  }, [apiConfigs, selectedConfigId, lastSelectedConfigId, lastSelectedModel]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewImage(null);
    };
    if (previewImage) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [previewImage]);

  // Local state for smooth typing and IME compatibility
  const [localContent, setLocalContent] = React.useState(data.content);
  // Sync if data.content changes externally (e.g. AI streaming)
  React.useEffect(() => {
    setLocalContent(data.content);
  }, [data.content]);

  const toggleViewMode = () => setViewMode(v => v === 'md' ? 'txt' : 'md');

  const handleCopy = () => {
    navigator.clipboard.writeText(localContent || data.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBranchUser = () => {
    addMessage(id, 'user', '');
  };

  const handleGenerate = () => {
    if (!localContent.trim()) return;
    if (localContent !== data.content) {
      updateMessageNode(id, localContent);
    }
    // Starts AI streaming output as a child node
    generateAIResponse(id, selectedConfigId || undefined, selectedModel);
  };

  const handleRetry = () => {
    // AI retries itself by asking the store to generate from its parent
    const activeTabId = useStore.getState().activeTabId;
    const activeTab = useStore.getState().tabs.find(t => t.id === activeTabId);
    const incomingEdge = activeTab?.edges.find(e => e.target === id);
    if (incomingEdge) {
      const parentId = incomingEdge.source;
      generateAIResponse(parentId, data.configId, data.model);
    }
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

  const bgColor = data.error
    ? 'bg-red-950/80 text-red-50 border-red-800'
    : isUser
      ? 'bg-blue-950 text-blue-50 border-blue-800'
      : isSystem
        ? 'bg-zinc-900 text-zinc-300 border-zinc-800'
        : 'bg-emerald-950 text-emerald-50 border-emerald-800';

  return (
    <>
      <NodeResizeControl
        minWidth={480}
        minHeight={250}
        position="bottom-right"
        style={{ background: 'transparent', border: 'none', right: 5, bottom: 5 }}
      >
        <div className="w-4 h-4 text-white/20 hover:text-white/80 cursor-nwse-resize flex items-end justify-end">
          <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15L15 21" />
            <path d="M21 8L8 21" />
          </svg>
        </div>
      </NodeResizeControl>

      <div className={`w-full h-full min-w-[480px] min-h-[250px] rounded-2xl border ${bgColor} shadow-lg flex flex-col relative group`}>
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
                <span className="max-w-[120px] truncate" title={data.model}>{data.model}</span>
                {data.configId && apiConfigs.find(c => c.id === data.configId) && (
                  <span className="opacity-50 ml-1">({apiConfigs.find(c => c.id === data.configId)?.name})</span>
                )}
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
                  <img src={url} alt={`Uploaded ${index + 1}`} className="object-cover w-20 h-20 cursor-zoom-in transition-transform hover:scale-105" onClick={() => setPreviewImage(url)} />
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
              value={localContent}
              onChange={(e) => setLocalContent(e.target.value)}
              onBlur={(e) => updateMessageNode(id, e.target.value)}
              placeholder={isUser ? "Type your prompt..." : "AI Response..."}
            />
          ) : (
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
                        onClick={() => props.src && setPreviewImage(props.src)}
                      />
                    )
                  }}
                >
                  {localContent}
                </ReactMarkdown>
              )}

              {/* Error Display */}
              {data.error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-200 text-xs mt-auto">
                  <div className="font-semibold text-red-400 mb-1 flex items-center gap-1.5">
                    <X className="w-4 h-4" /> Generation Failed
                  </div>
                  <div className="font-mono whitespace-pre-wrap opacity-80 break-words">{data.error}</div>
                </div>
              )}

              {/* Empty / Generating State */}
              {!localContent && !data.error && (
                <div className="flex items-center gap-2 text-zinc-400 italic pt-1">
                  {data.role === 'assistant' ? (
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
          )}
        </div>

        <div className="flex justify-between items-center px-4 py-2 bg-black/20 gap-2 border-t border-white/5 rounded-b-2xl">
          {isUser ? (
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center gap-2">
                <CustomSelect
                  value={selectedConfigId}
                  placeholder="Select API Config"
                  options={apiConfigs.map(c => ({ label: c.name, value: c.id }))}
                  onChange={cid => {
                    setSelectedConfigId(cid);
                    const conf = apiConfigs.find(c => c.id === cid);
                    if (conf && conf.models.length > 0) {
                      const firstModel = conf.models[0];
                      setSelectedModel(firstModel);
                      setLastConfigSelection(cid, firstModel);
                    } else {
                      setLastConfigSelection(cid, '');
                    }
                  }}
                />

                <CustomSelect
                  value={selectedModel}
                  placeholder="Select Model"
                  disabled={!selectedConfigId}
                  options={
                    selectedConfigId
                      ? apiConfigs.find(c => c.id === selectedConfigId)?.models.map(m => ({ label: m, value: m })) || []
                      : []
                  }
                  onChange={model => {
                    setSelectedModel(model);
                    if (selectedConfigId) setLastConfigSelection(selectedConfigId, model);
                  }}
                />
              </div>

              <button
                onClick={handleGenerate}
                className="w-full flex items-center justify-center gap-2 text-xs py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200 transition-colors cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Generate AI Response</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center w-full gap-2">
              <button
                onClick={handleBranchUser}
                className="flex-1 flex items-center justify-center gap-2 text-xs py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Network className="w-3.5 h-3.5" />
                <span>Branch New Prompt</span>
              </button>

              {data.error && (
                <button
                  onClick={handleRetry}
                  className="flex items-center justify-center gap-2 text-xs py-1.5 px-3 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-200 transition-colors cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-rotate-cw"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                  <span>Retry</span>
                </button>
              )}
            </div>
          )}
        </div>
        <Handle type="source" position={Position.Bottom} className="!bottom-[-2px] !w-4 !h-4 !bg-[#0a0a0a] !border-2 !border-zinc-500 hover:!border-indigo-400 !transition-colors z-10" />
      </div>

      {previewImage && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white cursor-pointer transition-colors"
            onClick={() => setPreviewImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>,
        document.body
      )
      }
    </>
  );
}

export default memo(MessageNode);
