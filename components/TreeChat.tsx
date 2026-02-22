'use client';

import React, { useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  ReactFlowProvider,
  BackgroundVariant,
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from '@/store/useStore';
import MessageNode from './MessageNode';
import { Layers, Plus, Cpu, Trash } from 'lucide-react';
import { useConfirmStore } from '@/store/useConfirmStore';
import { useApiConfigSelection } from '@/hooks/useApiConfigSelection';
import { CustomSelect } from './MessageNode';

const nodeTypes = {
  messageNode: MessageNode,
};

function TreeChatFlow() {
  // Reactive state
  const activeTabId = useStore(state => state.activeTabId);
  const tabs = useStore(state => state.tabs);
  const activeTab = tabs.find(t => t.id === activeTabId);
  const nodes = activeTab?.nodes || [];
  const edges = activeTab?.edges || [];

  // Stable action references (don't cause re-renders)
  const onNodesChange = useStore(state => state.onNodesChange);
  const onEdgesChange = useStore(state => state.onEdgesChange);
  const onConnect = useStore(state => state.onConnect);
  const addMessage = useStore(state => state.addMessage);
  const createTab = useStore(state => state.createTab);
  const mergeNodes = useStore(state => state.mergeNodes);
  const deleteNodes = useStore(state => state.deleteNodes);

  const confirm = useConfirmStore(state => state.confirm);

  // Shared API config selection logic
  const {
    selectedConfigId, selectedModel,
    configOptions, modelOptions,
    handleConfigChange, handleModelChange,
  } = useApiConfigSelection();

  const selectedNodeIds = nodes.filter(n => n.selected).map(n => n.id);

  const handleDeleteSelected = async () => {
    const ok = await confirm({
      title: 'Delete Selected Nodes',
      message: `Are you sure you want to delete the ${selectedNodeIds.length} selected nodes? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    if (ok) {
      deleteNodes(selectedNodeIds);
    }
  };

  const [hasHydrated, setHasHydrated] = React.useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    useStore.persist.onFinishHydration(() => setHasHydrated(true));
    if (useStore.persist.hasHydrated()) {
      timeoutId = setTimeout(() => setHasHydrated(true), 0);
    }
    return () => clearTimeout(timeoutId);
  }, []);

  // Initialize with a root node
  useEffect(() => {
    if (hasHydrated && tabs.length === 0) {
      createTab('New Chat');
      const rootId = addMessage(null, 'system', 'You are a helpful assistant. Please interact using the language the user sends for the first time.', 'system');
      addMessage(rootId, 'user', '');
    }
  }, [hasHydrated, tabs.length, createTab, addMessage]);

  if (!hasHydrated || tabs.length === 0) {
    return (
      <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center text-zinc-500 font-mono text-sm">
        Loading workspace...
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#0a0a0a] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid={true}
        snapGrid={[10, 10]}
        className="treechat-flow"
        minZoom={0.1}
        maxZoom={4}
        colorMode="dark"
        selectionMode={SelectionMode.Partial}
        selectionKeyCode="Shift"
        multiSelectionKeyCode="Shift"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={2}
          color="rgba(255,255,255,0.06)"
        />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n) => {
            if (n.data?.role === 'user') return '#1e40af';
            if (n.data?.role === 'system') return '#3f3f46';
            return '#047857';
          }}
          maskColor="rgba(0, 0, 0, 0.7)"
          className="rounded-lg shadow-2xl"
        />



        <div className="absolute top-4 left-4 z-50 flex gap-2">
          <button
            onClick={() => addMessage(null, 'system', '')}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 rounded-lg backdrop-blur-md shadow-lg transition-all cursor-pointer text-xs"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="flex items-center gap-1"><Plus className="w-3 h-3" /> New System Prompt Card</span>
          </button>
        </div>

        {selectedNodeIds.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
            <div className="flex items-center gap-3 px-6 py-4 bg-indigo-950/80 backdrop-blur-xl rounded-2xl border border-indigo-500/30 shadow-2xl">
              <span className="text-sm text-indigo-200 font-medium whitespace-nowrap">{selectedNodeIds.length} Nodes Selected</span>
              <div className="w-px h-6 bg-indigo-500/30"></div>

              <div className="flex items-center gap-2 min-w-[280px]">
                <CustomSelect
                  value={selectedConfigId}
                  placeholder="Select API Config"
                  options={configOptions}
                  onChange={handleConfigChange}
                />

                <CustomSelect
                  value={selectedModel}
                  placeholder="Select Model"
                  disabled={!selectedConfigId}
                  options={modelOptions}
                  onChange={handleModelChange}
                />
              </div>

              <div className="w-px h-6 bg-indigo-500/30"></div>

              <button
                onClick={() => mergeNodes(selectedNodeIds, selectedConfigId || undefined, selectedModel || undefined)}
                className="flex items-center gap-2 px-4 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-lg shadow-indigo-500/20 whitespace-nowrap"
              >
                <Layers className="w-4 h-4" />
                <span>AI Merge Docs</span>
              </button>

              <div className="w-px h-6 bg-indigo-500/30"></div>

              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 px-4 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/30 rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-lg shadow-red-500/10 whitespace-nowrap"
              >
                <Trash className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}
      </ReactFlow>
    </div>
  );
}

export default function TreeChat() {
  return (
    <ReactFlowProvider>
      <TreeChatFlow />
    </ReactFlowProvider>
  );
}
