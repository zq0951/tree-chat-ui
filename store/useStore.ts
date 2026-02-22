import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { get, set as idbSet, del } from 'idb-keyval';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';
import { MessageNodeData, MessageRole, ApiConfig } from '@/lib/types';

export type AppNode = Node<MessageNodeData, 'messageNode'>;

export interface Tab {
  id: string;
  name: string;
  nodes: AppNode[];
  edges: Edge[];
}

export type AppState = {
  tabs: Tab[];
  activeTabId: string;

  createTab: (name?: string) => string;
  importTab: (name: string, nodes: AppNode[], edges: Edge[]) => string;
  switchTab: (id: string) => void;
  deleteTab: (id: string) => void;
  renameTab: (id: string, name: string) => void;

  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange<Edge>;
  onConnect: OnConnect;
  addMessage: (parentId: string | null, role: MessageRole, content: string, model?: string, configId?: string) => string;
  updateMessageNode: (id: string, newContent: string) => void;
  updateMessageError: (id: string, error?: string) => void;
  addMessageImages: (id: string, imageUrls: string[]) => void;
  removeMessageImage: (id: string, index: number) => void;
  deleteMessageNode: (id: string) => void;
  deleteNodes: (ids: string[]) => void;
  mergeNodes: (nodeIds: string[], configId?: string, model?: string) => string;
  getConversationPath: (nodeId: string) => { role: string; content: string; imageUrls?: string[] }[];
  generateAIResponse: (userNodeId: string, configId?: string, model?: string) => Promise<void>;

  // API Configs
  apiConfigs: ApiConfig[];
  lastSelectedConfigId?: string;
  lastSelectedModel?: string;
  setLastConfigSelection: (configId: string, model: string) => void;
  addApiConfig: (config: Omit<ApiConfig, 'id'>) => string;
  updateApiConfig: (id: string, config: Omit<ApiConfig, 'id'>) => void;
  deleteApiConfig: (id: string) => void;
};

const HORIZONTAL_SPACING = 580;
const VERTICAL_MARGIN = 120;

import { PersistStorage, StorageValue } from 'zustand/middleware';

let writeTimeout: ReturnType<typeof setTimeout>;
let pendingWrite: { name: string; serialized: string } | null = null;

// Flush pending writes immediately (e.g. before page unload)
async function flushPendingWrite() {
  if (pendingWrite) {
    const { name, serialized } = pendingWrite;
    pendingWrite = null;
    if (writeTimeout) clearTimeout(writeTimeout);
    try {
      await idbSet(name, serialized);
    } catch (e) {
      console.error('Failed to flush state to IndexedDB', e);
    }
  }
}

// Register beforeunload handler to reduce data loss on page close
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushPendingWrite();
  });
}

// Support both SSR and robust reading/writing.
const customPersistStorage: PersistStorage<AppState> = {
  getItem: async (name: string) => {
    if (typeof window === 'undefined') return null; // Safe for SSR
    try {
      const value = await get(name);
      if (!value) return null;
      // If the value was saved directly as an object without stringifying (e.g. older versions), return it directly.
      if (typeof value === 'object') return value as StorageValue<AppState>;
      return JSON.parse(value);
    } catch (e) {
      console.error('Failed to parse state from IndexedDB', e);
      return null; // Fallback to empty if corrupted
    }
  },
  setItem: async (name: string, value: StorageValue<AppState>) => {
    if (typeof window === 'undefined') return;
    if (writeTimeout) clearTimeout(writeTimeout);
    try {
      const serialized = JSON.stringify(value);
      pendingWrite = { name, serialized };
      writeTimeout = setTimeout(async () => {
        pendingWrite = null;
        try {
          await idbSet(name, serialized);
        } catch (e) {
          console.error('Failed to save state to IndexedDB', e);
        }
      }, 300);
    } catch (e) {
      console.error('Failed to serialize state for IndexedDB', e);
    }
  },
  removeItem: async (name: string) => {
    if (typeof window === 'undefined') return;
    if (writeTimeout) clearTimeout(writeTimeout);
    pendingWrite = null;
    try {
      await del(name);
    } catch (e) {
      console.error('Failed to remove state from IndexedDB', e);
    }
  },
};

const defaultTab = (): Tab => ({
  id: uuidv4(),
  name: 'New Chat',
  nodes: [],
  edges: []
});

const updateActiveTab = (get: () => AppState, set: (updater: (state: AppState) => Partial<AppState> | AppState) => void, updater: (tab: Tab) => Partial<Tab>) => {
  set((state: AppState) => {
    const tabIndex = state.tabs.findIndex(t => t.id === state.activeTabId);
    if (tabIndex === -1) return state;
    const newTabs = [...state.tabs];
    newTabs[tabIndex] = { ...newTabs[tabIndex], ...updater(newTabs[tabIndex]) };
    return { tabs: newTabs };
  });
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: '',
      apiConfigs: [],
      lastSelectedConfigId: undefined,
      lastSelectedModel: undefined,

      setLastConfigSelection: (configId, model) => set({ lastSelectedConfigId: configId, lastSelectedModel: model }),

      createTab: (name?: string) => {
        const newTab = defaultTab();
        if (name) newTab.name = name;
        set((state) => ({
          tabs: [...state.tabs, newTab],
          activeTabId: newTab.id
        }));
        return newTab.id;
      },
      importTab: (name: string, nodes: AppNode[], edges: Edge[]) => {
        const newTab = { id: uuidv4(), name, nodes, edges };
        set((state) => ({
          tabs: [...state.tabs, newTab],
          activeTabId: newTab.id
        }));
        return newTab.id;
      },
      switchTab: (id: string) => set({ activeTabId: id }),
      deleteTab: (id: string) => {
        set((state) => {
          const newTabs = state.tabs.filter(t => t.id !== id);
          if (newTabs.length === 0) {
            const fallback = defaultTab();
            return { tabs: [fallback], activeTabId: fallback.id };
          }
          return {
            tabs: newTabs,
            activeTabId: state.activeTabId === id ? newTabs[newTabs.length - 1].id : state.activeTabId
          };
        });
      },
      renameTab: (id: string, name: string) => {
        set((state) => ({
          tabs: state.tabs.map(t => t.id === id ? { ...t, name } : t)
        }));
      },

      onNodesChange: (changes: NodeChange<AppNode>[]) => {
        updateActiveTab(get, set, (tab) => ({
          nodes: applyNodeChanges(changes, tab.nodes) as AppNode[],
        }));
      },
      onEdgesChange: (changes: EdgeChange<Edge>[]) => {
        updateActiveTab(get, set, (tab) => ({
          edges: applyEdgeChanges(changes, tab.edges),
        }));
      },
      onConnect: (connection: Connection) => {
        updateActiveTab(get, set, (tab) => ({
          edges: addEdge({
            ...connection,
            type: 'default',
            animated: false,
            markerEnd: { type: MarkerType.ArrowClosed, color: '#a1a1aa', width: 14, height: 14 },
            style: { strokeWidth: 3, stroke: '#a1a1aa' }
          }, tab.edges),
        }));
      },
      addMessage: (parentId: string | null, role: MessageRole, content: string, model?: string, configId?: string) => {
        const id = uuidv4();
        const activeTab = get().tabs.find(t => t.id === get().activeTabId);
        if (!activeTab) return id;
        const { nodes, edges } = activeTab;

        let newX = 250;
        let newY = 100;

        if (parentId) {
          const parentNode = nodes.find((n) => n.id === parentId);
          if (parentNode) {
            const existingChildrenEdges = edges.filter((e) => e.source === parentId);
            const parentHeight = parentNode.measured?.height || 250;
            newY = Math.round((parentNode.position.y + parentHeight + VERTICAL_MARGIN) / 10) * 10;

            if (existingChildrenEdges.length === 0) {
              newX = Math.round(parentNode.position.x / 10) * 10;
            } else {
              newX = Math.round((parentNode.position.x + HORIZONTAL_SPACING * existingChildrenEdges.length) / 10) * 10;
            }
          }
        } else {
          // It's a brand new floating node, offset slightly to prevent stacking
          // Check if there are existing nodes to avoid collision
          newX = 100 + (nodes.length % 5) * 50;
          newY = 100 + (nodes.length % 5) * 50;
          newX = Math.round(newX / 10) * 10;
          newY = Math.round(newY / 10) * 10;
        }

        const newNode: AppNode = {
          id,
          position: { x: newX, y: newY },
          type: 'messageNode',
          style: { width: 540 },
          data: {
            id,
            role,
            content,
            model,
            configId,
            timestamp: Date.now(),
          },
          dragHandle: '.custom-drag-handle',
        };

        let newEdges = edges;
        if (parentId) {
          newEdges = [
            ...edges,
            {
              id: `e-${parentId}-${id}`,
              source: parentId,
              target: id,
              type: 'default',
              animated: false,
              markerEnd: { type: MarkerType.ArrowClosed, color: '#a1a1aa', width: 14, height: 14 },
              style: { strokeWidth: 3, stroke: '#a1a1aa' }
            },
          ];
        }

        updateActiveTab(get, set, () => ({
          nodes: [...nodes, newNode],
          edges: newEdges
        }));

        return id;
      },
      updateMessageNode: (id: string, newContent: string) => {
        updateActiveTab(get, set, (tab) => ({
          nodes: tab.nodes.map((node) => node.id === id ? { ...node, data: { ...node.data, content: newContent } } : node)
        }));
      },
      updateMessageError: (id: string, error?: string) => {
        updateActiveTab(get, set, (tab) => ({
          nodes: tab.nodes.map((node) => node.id === id ? { ...node, data: { ...node.data, error } } : node)
        }));
      },
      addMessageImages: (id: string, newImageUrls: string[]) => {
        updateActiveTab(get, set, (tab) => ({
          nodes: tab.nodes.map((node) => {
            if (node.id === id) {
              const currentImages = node.data.imageUrls || [];
              return { ...node, data: { ...node.data, imageUrls: [...currentImages, ...newImageUrls] } };
            }
            return node;
          })
        }));
      },
      removeMessageImage: (id: string, index: number) => {
        updateActiveTab(get, set, (tab) => ({
          nodes: tab.nodes.map((node) => {
            if (node.id === id) {
              const currentImages = node.data.imageUrls || [];
              return { ...node, data: { ...node.data, imageUrls: currentImages.filter((_, i) => i !== index) } };
            }
            return node;
          })
        }));
      },
      deleteMessageNode: (id: string) => {
        updateActiveTab(get, set, (tab) => ({
          nodes: tab.nodes.filter((n) => n.id !== id),
          edges: tab.edges.filter((e) => e.source !== id && e.target !== id)
        }));
      },
      deleteNodes: (ids: string[]) => {
        updateActiveTab(get, set, (tab) => ({
          nodes: tab.nodes.filter((n) => !ids.includes(n.id)),
          edges: tab.edges.filter((e) => !ids.includes(e.source) && !ids.includes(e.target))
        }));
      },
      mergeNodes: (nodeIds: string[], configId?: string, model?: string) => {
        const id = uuidv4();
        const activeTab = get().tabs.find(t => t.id === get().activeTabId);
        if (!activeTab) return id;
        const { nodes, edges } = activeTab;

        const selectedNodes = nodes.filter(n => nodeIds.includes(n.id));
        if (selectedNodes.length === 0) return id;

        // Sort by position Y, then X to roughly maintain reading order
        selectedNodes.sort((a, b) => {
          if (a.position.y === b.position.y) return a.position.x - b.position.x;
          return a.position.y - b.position.y;
        });

        // Combine text contents
        const combinedContent = selectedNodes
          .map(n => n.data.content)
          .filter(c => c && c.trim().length > 0)
          .join('\n\n---\n\n');

        // Combine images
        const combinedImages = Array.from(new Set(
          selectedNodes.flatMap(n => n.data.imageUrls || [])
        ));

        // Position new node below the selected nodes, horizontally centered
        const avgX = selectedNodes.reduce((sum, n) => sum + n.position.x, 0) / selectedNodes.length;
        const lowestNode = selectedNodes.reduce((prev, curr) => (prev.position.y > curr.position.y ? prev : curr));

        const newX = Math.round(avgX / 10) * 10;
        const newY = Math.round((lowestNode.position.y + (lowestNode.measured?.height || 250) + VERTICAL_MARGIN) / 10) * 10;

        const newNode: AppNode = {
          id,
          position: { x: newX, y: newY },
          type: 'messageNode',
          style: { width: 540 },
          data: {
            id,
            role: 'system',
            content: '*AI is thinking and compressing these contexts...*',
            imageUrls: combinedImages,
            timestamp: Date.now(),
            configId,
            model,
          },
          dragHandle: '.custom-drag-handle',
        };

        const newEdges: Edge[] = selectedNodes.map(n => ({
          id: `e-${n.id}-${id}`,
          source: n.id,
          target: id,
          type: 'default',
          animated: false,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#a1a1aa', width: 14, height: 14 },
          style: { strokeWidth: 3, stroke: '#a1a1aa' }
        }));

        updateActiveTab(get, set, () => ({
          nodes: [...nodes.map(n => ({ ...n, selected: false })), { ...newNode, selected: true }],
          edges: [...edges, ...newEdges]
        }));

        // Kick off async AI compression
        setTimeout(async () => {
          const { updateMessageNode, updateMessageError, apiConfigs } = get();

          let targetModel = model;
          let targetConfig = apiConfigs.find(c => c.id === configId);

          // Fallback if not provided or valid
          if (!targetConfig || !targetModel) {
            const { lastSelectedConfigId, lastSelectedModel } = get();
            targetModel = lastSelectedModel || 'gemini-3-flash-preview';
            targetConfig = apiConfigs.find(c => c.id === lastSelectedConfigId);
          }

          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (targetConfig) {
            headers['X-Api-Key'] = targetConfig.apiKey;
            headers['X-Provider'] = targetConfig.provider;
            if (targetConfig.baseUrl) headers['X-Base-Url'] = targetConfig.baseUrl;
            headers['X-Model'] = targetModel!;
          }

          const formattedMessages = [
            {
              role: 'system',
              content: 'You are a highly professional logic summarization AI. Your task is to merge and compress a set of contexts provided by the user from different branch discussions, extracting the core points and summaries with logic and coherence. This will be used as a general upstream context for further deduction or questioning. Keep only the core logic and critical intent, avoiding rambling or casual chat. Output ONLY the compressed context directly. Do not include introductory phrases.'
            },
            {
              role: 'user',
              content: `Please compress, summarize, and fuse the following multiple contexts into a single coherent text:\n\n${combinedContent}`
            }
          ];

          try {
            const response = await fetch('/api/chat', {
              method: 'POST',
              headers,
              body: JSON.stringify({ messages: formattedMessages }),
            });

            if (!response.ok) {
              const errText = await response.text();
              throw new Error(errText);
            }
            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let fullContent = "";

            while (!done) {
              const { value, done: doneReading } = await reader.read();
              done = doneReading;
              if (value) {
                const chunkValue = decoder.decode(value, { stream: true });
                fullContent += chunkValue;
                updateMessageNode(id, fullContent);
              }
            }

            if (fullContent.includes('[API Error]:')) {
              const parts = fullContent.split('[API Error]:');
              const actualContent = parts[0].trim();
              const errorMessage = parts[1].trim();

              updateMessageNode(id, actualContent);
              throw new Error(errorMessage);
            }
          } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : "AI 合并压缩失败";
            updateMessageError(id, errMsg);
            // Fallback to literal combined text if compression failed
            updateMessageNode(id, `*(AI 压缩失败，原文本已直接拼接)*\n\n${combinedContent}`);
          }
        }, 0);

        return id;
      },
      getConversationPath: (nodeId: string) => {
        const activeTab = get().tabs.find(t => t.id === get().activeTabId);
        if (!activeTab) return [];
        const { nodes, edges } = activeTab;

        const pathNodes: AppNode[] = [];
        const visited = new Set<string>();
        const queue = [nodeId];

        while (queue.length > 0) {
          const currentId = queue.shift();
          if (!currentId || visited.has(currentId)) continue;
          visited.add(currentId);

          const node = nodes.find((n) => n.id === currentId);
          if (node) pathNodes.push(node);

          const incomingEdges = edges.filter((e) => e.target === currentId);
          for (const edge of incomingEdges) {
            queue.push(edge.source);
          }
        }

        pathNodes.sort((a, b) => (a.data.timestamp || 0) - (b.data.timestamp || 0));

        const systemNodes = pathNodes.filter((n) => n.data.role === 'system');
        const otherNodes = pathNodes.filter((n) => n.data.role !== 'system');

        const messages: { role: string; content: string; imageUrls?: string[] }[] = [];

        if (systemNodes.length > 0) {
          const combinedSystemContent = systemNodes
            .map((n) => n.data.content)
            .filter((c) => c && c.trim().length > 0)
            .join('\n\n---\n\n');

          if (combinedSystemContent) {
            messages.push({
              role: 'system',
              content: combinedSystemContent
            });
          }
        }

        otherNodes.forEach((n) => {
          messages.push({
            role: n.data.role as string,
            content: n.data.content as string,
            imageUrls: n.data.imageUrls as string[] | undefined
          });
        });

        return messages;
      },
      generateAIResponse: async (userNodeId: string, configId?: string, model?: string) => {
        const { getConversationPath, addMessage, updateMessageNode, updateMessageError, apiConfigs } = get();
        const messages = getConversationPath(userNodeId);

        const validMessages = messages.filter(m => m.content.trim().length > 0 || (m.imageUrls && m.imageUrls.length > 0));

        const formattedMessages = validMessages.map(m => {
          if (m.imageUrls && m.imageUrls.length > 0) {
            return {
              role: m.role,
              content: [
                { type: 'text', text: m.content || "Analyze these images" },
                ...m.imageUrls.map(img => ({ type: 'image', image: img }))
              ]
            };
          }
          return { role: m.role, content: m.content };
        });

        const targetModel = model || 'gemini-3-flash-preview';
        const assistantNodeId = addMessage(userNodeId, 'assistant', '', targetModel, configId);
        updateMessageError(assistantNodeId, undefined);

        const targetConfig = apiConfigs.find(c => c.id === configId);

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (targetConfig) {
          headers['X-Api-Key'] = targetConfig.apiKey;
          headers['X-Provider'] = targetConfig.provider;
          if (targetConfig.baseUrl) headers['X-Base-Url'] = targetConfig.baseUrl;
          headers['X-Model'] = targetModel;
        }

        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers,
            body: JSON.stringify({ messages: formattedMessages }),
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText);
          }
          if (!response.body) throw new Error("No response body");

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let done = false;
          let fullContent = "";

          while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            if (value) {
              const chunkValue = decoder.decode(value, { stream: true });
              fullContent += chunkValue;
              updateMessageNode(assistantNodeId, fullContent);
            }
          }

          if (fullContent.includes('[API Error]:')) {
            const parts = fullContent.split('[API Error]:');
            const actualContent = parts[0].trim();
            const errorMessage = parts[1].trim();

            // Revert the node's content to string without the error marker
            updateMessageNode(assistantNodeId, actualContent);
            throw new Error(errorMessage);
          }

          addMessage(assistantNodeId, 'user', '');

        } catch (error: unknown) {
          const errMsg = error instanceof Error ? error.message : "Unknown error";
          updateMessageError(assistantNodeId, errMsg);
        }
      },

      addApiConfig: (config) => {
        const id = uuidv4();
        set((state) => ({ apiConfigs: [...state.apiConfigs, { ...config, id }] }));
        return id;
      },
      updateApiConfig: (id, newConfig) => {
        set((state) => ({
          apiConfigs: state.apiConfigs.map(c => c.id === id ? { ...newConfig, id } : c)
        }));
      },
      deleteApiConfig: (id) => {
        set((state) => ({
          apiConfigs: state.apiConfigs.filter(c => c.id !== id)
        }));
      }
    }),
    {
      name: 'treechat-storage',
      storage: customPersistStorage,
    }
  )
);
