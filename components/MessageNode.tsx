import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizeControl } from '@xyflow/react';
import { AppNode, useStore } from '@/store/useStore';
import { useApiConfigSelection } from '@/hooks/useApiConfigSelection';
import { NodeHeader } from './node/NodeHeader';
import { NodeContent } from './node/NodeContent';
import { NodeFooter } from './node/NodeFooter';
import { ImageGallery } from './node/ImageGallery';
import { ImagePreviewOverlay } from './node/ImagePreviewOverlay';

function MessageNode({ data, id }: NodeProps<AppNode>) {
  const addMessage = useStore(state => state.addMessage);
  const updateMessageNode = useStore(state => state.updateMessageNode);
  const deleteMessageNode = useStore(state => state.deleteMessageNode);
  const generateAIResponse = useStore(state => state.generateAIResponse);
  const addMessageImages = useStore(state => state.addMessageImages);
  const removeMessageImage = useStore(state => state.removeMessageImage);
  const apiConfigs = useStore(state => state.apiConfigs);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isUser = data.role === 'user';
  const isSystem = data.role === 'system';
  // User defaults to txt so they can type, AI defaults to md
  const [viewMode, setViewMode] = React.useState<'md' | 'txt'>(isUser || isSystem ? 'txt' : 'md');
  const [copied, setCopied] = React.useState(false);
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);

  // Shared API config selection logic
  const {
    selectedConfigId, selectedModel,
    configOptions, modelOptions,
    handleConfigChange, handleModelChange,
  } = useApiConfigSelection();

  // Local state for smooth typing and IME compatibility
  const [localContent, setLocalContent] = React.useState(data.content);
  // Sync if data.content changes externally (e.g. AI streaming)
  React.useEffect(() => {
    setLocalContent(data.content);
  }, [data.content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(localContent || data.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = () => {
    if (!localContent.trim()) return;
    if (localContent !== data.content) {
      updateMessageNode(id, localContent);
    }
    generateAIResponse(id, selectedConfigId || undefined, selectedModel);
  };

  const handleRetry = () => {
    const activeTabId = useStore.getState().activeTabId;
    const activeTab = useStore.getState().tabs.find(t => t.id === activeTabId);
    const incomingEdge = activeTab?.edges.find(e => e.target === id);
    if (incomingEdge) {
      generateAIResponse(incomingEdge.source, data.configId, data.model);
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
          addMessageImages(id, [...newUrls]);
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

        <Handle type="target" position={Position.Top} className="!top-[-2px] !w-4 !h-4 !bg-[#0a0a0a] !border-2 !border-zinc-500 hover:!border-indigo-400 !transition-colors z-10" />

        <NodeHeader
          role={data.role}
          model={data.model}
          configId={data.configId}
          apiConfigs={apiConfigs}
          viewMode={viewMode}
          onToggleViewMode={() => setViewMode(v => v === 'md' ? 'txt' : 'md')}
          onCopy={handleCopy}
          copied={copied}
          onDelete={() => deleteMessageNode(id)}
          onImageUpload={isUser ? handleImageUpload : undefined}
          fileInputRef={isUser ? fileInputRef : undefined}
        />

        <div className="p-4 flex-1 flex flex-col gap-3 h-full overflow-hidden">
          <ImageGallery
            imageUrls={data.imageUrls || []}
            onRemove={(index) => removeMessageImage(id, index)}
            onPreview={setPreviewImage}
          />

          <NodeContent
            role={data.role}
            content={data.content}
            error={data.error}
            viewMode={viewMode}
            localContent={localContent}
            onLocalContentChange={setLocalContent}
            onBlur={(value) => updateMessageNode(id, value)}
            onPreviewImage={setPreviewImage}
          />
        </div>

        <NodeFooter
          isUser={isUser}
          hasError={!!data.error}
          selectedConfigId={selectedConfigId}
          selectedModel={selectedModel}
          configOptions={configOptions}
          modelOptions={modelOptions}
          onConfigChange={handleConfigChange}
          onModelChange={handleModelChange}
          onGenerate={handleGenerate}
          onBranch={() => addMessage(id, 'user', '')}
          onRetry={handleRetry}
        />

        <Handle type="source" position={Position.Bottom} className="!bottom-[-2px] !w-4 !h-4 !bg-[#0a0a0a] !border-2 !border-zinc-500 hover:!border-indigo-400 !transition-colors z-10" />
      </div>

      <ImagePreviewOverlay
        imageUrl={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </>
  );
}

export default memo(MessageNode);
