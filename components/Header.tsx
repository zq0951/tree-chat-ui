'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { Plus, X, MessageSquare } from 'lucide-react';

export default function Header() {
  const state = useStore();

  const handleExport = () => {
    const activeTab = state.tabs.find(t => t.id === state.activeTabId);
    if (!activeTab) return;
    const { nodes, edges } = activeTab;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ nodes, edges }, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "tree-chat-export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleSwitchStrategy = () => {
    alert("Switching models globally will be implemented in future phase! Currently defaults to gemini-3-flash-preview for generation.");
  };

  return (
    <div className="flex flex-col w-full z-10 absolute top-0 left-0 bg-black/40 backdrop-blur-md border-b border-white/10">
      <header className="flex h-14 shrink-0 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
          </div>
          <h1 className="font-semibold text-zinc-100 tracking-tight">TreeChat <span className="text-zinc-500 font-normal">Alpha</span></h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="text-xs px-4 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 transition flex items-center gap-2 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
            Export Json
          </button>
          <button
            onClick={handleSwitchStrategy}
            className="text-xs px-4 py-1.5 rounded-full bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/40 text-blue-300 transition flex items-center gap-2 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m12 16 4-4-4-4" /><path d="M8 12h8" /></svg>
            Switch Strategy
          </button>
        </div>
      </header>

      {/* Tabs Row */}
      <div className="flex h-10 items-end px-4 gap-2 overflow-x-auto custom-scroller bg-black/20 pt-2">
        {state.tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => state.switchTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-medium cursor-pointer transition-colors border-b-2 whitespace-nowrap
               ${tab.id === state.activeTabId ? 'bg-[#0a0a0a] border-emerald-500 text-white' : 'bg-transparent border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}
             `}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{tab.name || 'Chat'}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Are you sure you want to close this chat tab? Data in this tab will be deleted.')) {
                  state.deleteTab(tab.id);
                }
              }}
              className="p-0.5 rounded hover:bg-white/10 text-zinc-400 hover:text-red-400 ml-1 transition"
              title="Close chat"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        <button
          onClick={() => { state.createTab('New Chat'); }}
          className="flex items-center gap-1 px-3 py-1 rounded text-xs text-zinc-400 hover:text-white hover:bg-white/10 transition-colors ml-2 cursor-pointer shrink-0 mb-1"
          title="New Chat"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>
      </div>
    </div>
  );
}
