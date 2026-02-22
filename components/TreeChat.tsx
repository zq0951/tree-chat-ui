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

const nodeTypes = {
  messageNode: MessageNode,
};

// Update store references at type definition as well
import { CustomSelect } from './MessageNode';

function TreeChatFlow() {
  const state = useStore();
  const activeTab = state.tabs.find(t => t.id === state.activeTabId);
  const nodes = activeTab?.nodes || [];
  const edges = activeTab?.edges || [];
  const { onNodesChange, onEdgesChange, onConnect, addMessage, createTab, mergeNodes, deleteNodes, apiConfigs, lastSelectedConfigId, lastSelectedModel, setLastConfigSelection } = state;

  const confirm = useConfirmStore(state => state.confirm);

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

  const selectedNodeIds = nodes.filter(n => n.selected).map(n => n.id);

  const [hasHydrated, setHasHydrated] = React.useState(false);

  // Local state for merge config
  const [selectedConfigId, setSelectedConfigId] = React.useState<string>('');
  const [selectedModel, setSelectedModel] = React.useState<string>('');

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
        setSelectedConfigId(apiConfigs[0].id);
        setSelectedModel(apiConfigs[0].models[0]);
      }
    } else {
      setSelectedConfigId('');
      setSelectedModel('');
    }
  }, [apiConfigs, selectedConfigId, lastSelectedConfigId, lastSelectedModel]);

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
    if (hasHydrated && state.tabs.length === 0) {
      createTab('New Chat');
      const rootId = addMessage(null, 'system', 'You are a helpful assistant. Please interact using the language the user sends for the first time.', 'system');
      // Automatically generate a user node for immediate interaction
      addMessage(rootId, 'user', '');
    }
  }, [hasHydrated, state.tabs.length, createTab, addMessage]);

  if (!hasHydrated || state.tabs.length === 0) {
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
