'use client';

import React, { useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  ReactFlowProvider,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from '@/store/useStore';
import MessageNode from './MessageNode';
import { Layers, Plus, Cpu } from 'lucide-react';

const nodeTypes = {
  messageNode: MessageNode,
};

function TreeChatFlow() {
  const state = useStore();
  const activeTab = state.tabs.find(t => t.id === state.activeTabId);
  const nodes = activeTab?.nodes || [];
  const edges = activeTab?.edges || [];
  const { onNodesChange, onEdgesChange, onConnect, addMessage, createTab, mergeNodes } = state;

  const selectedNodeIds = nodes.filter(n => n.selected).map(n => n.id);

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
    if (hasHydrated && state.tabs.length === 0) {
      createTab('New Chat');
      const rootId = addMessage(null, 'system', 'You are a helpful assistant who helps users with in-depth reasoning. We will explore different branches of thought. Reply in Chinese.', 'system');
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
            <div className="flex items-center gap-4 px-6 py-3 bg-indigo-950/80 backdrop-blur-md rounded-2xl border border-indigo-500/30 shadow-2xl">
              <span className="text-sm text-indigo-200 font-medium">{selectedNodeIds.length} Prompt Nodes Selected</span>
              <div className="w-px h-6 bg-indigo-500/30"></div>
              <button
                onClick={() => mergeNodes(selectedNodeIds)}
                className="flex items-center gap-2 px-4 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-lg shadow-indigo-500/20"
              >
                <Layers className="w-4 h-4" />
                <span>Merge into single User Input</span>
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
