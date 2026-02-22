'use client';

import React, { useEffect, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from '@/store/useStore';
import MessageNode from './MessageNode';

const nodeTypes = {
  messageNode: MessageNode,
};

function TreeChatFlow() {
  const state = useStore();
  const activeTab = state.tabs.find(t => t.id === state.activeTabId);
  const nodes = activeTab?.nodes || [];
  const edges = activeTab?.edges || [];
  const { onNodesChange, onEdgesChange, onConnect, addMessage, createTab } = state;

  const { zoomTo, setCenter } = useReactFlow();

  const [hasHydrated, setHasHydrated] = React.useState(false);

  useEffect(() => {
    useStore.persist.onFinishHydration(() => setHasHydrated(true));
    setHasHydrated(useStore.persist.hasHydrated());
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
        snapGrid={[20, 20]}
        className="treechat-flow"
        minZoom={0.1}
        maxZoom={4}
        colorMode="dark"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={2}
          color="#333333"
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

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <button
              onClick={() => {
                const rootId = addMessage(null, 'system', 'You are a helpful assistant who helps users with in-depth reasoning. We will explore different branches of thought. Reply in Chinese.', 'system');
                addMessage(rootId, 'user', '');
              }}
              className="pointer-events-auto flex items-center gap-2 px-6 py-3 bg-indigo-600/80 hover:bg-indigo-500 text-white rounded-xl font-medium tracking-wide shadow-2xl transition-all hover:scale-105 cursor-pointer backdrop-blur-sm border border-white/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
              初始化系统节点 (Initialize Chat)
            </button>
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
