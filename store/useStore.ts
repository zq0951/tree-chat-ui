import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
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
import { MessageNodeData, MessageRole } from '@/lib/types';

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
  switchTab: (id: string) => void;
  deleteTab: (id: string) => void;
  renameTab: (id: string, name: string) => void;

  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange<Edge>;
  onConnect: OnConnect;
  addMessage: (parentId: string | null, role: MessageRole, content: string, model?: string) => string;
  updateMessageNode: (id: string, newContent: string) => void;
  addMessageImages: (id: string, imageUrls: string[]) => void;
  removeMessageImage: (id: string, index: number) => void;
  deleteMessageNode: (id: string) => void;
  getConversationPath: (nodeId: string) => { role: string; content: string; imageUrls?: string[] }[];
  generateAIResponse: (userNodeId: string) => Promise<void>;
};

const HORIZONTAL_SPACING = 480;
const VERTICAL_MARGIN = 120;

const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

const defaultTab = (): Tab => ({
  id: uuidv4(),
  name: 'New Chat',
  nodes: [],
  edges: []
});

const updateActiveTab = (get: any, set: any, updater: (tab: Tab) => Partial<Tab>) => {
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

      createTab: (name?: string) => {
        const newTab = defaultTab();
        if (name) newTab.name = name;
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
      addMessage: (parentId: string | null, role: MessageRole, content: string, model?: string) => {
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
            newY = parentNode.position.y + parentHeight + VERTICAL_MARGIN;

            if (existingChildrenEdges.length === 0) {
              newX = parentNode.position.x;
            } else {
              newX = parentNode.position.x + HORIZONTAL_SPACING * existingChildrenEdges.length;
            }
          }
        }

        const newNode: AppNode = {
          id,
          position: { x: newX, y: newY },
          type: 'messageNode',
          style: { width: 440 },
          data: {
            id,
            role,
            content,
            model,
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
      getConversationPath: (nodeId: string) => {
        const activeTab = get().tabs.find(t => t.id === get().activeTabId);
        if (!activeTab) return [];
        const { nodes, edges } = activeTab;
        const path: AppNode[] = [];
        let currentId: string | null = nodeId;
        const visited = new Set<string>();

        while (currentId && !visited.has(currentId)) {
          visited.add(currentId);
          const node = nodes.find((n) => n.id === currentId);
          if (node) path.unshift(node);
          const incomingEdge = edges.find((e) => e.target === currentId);
          currentId = incomingEdge ? incomingEdge.source : null;
        }

        return path.map((n) => ({
          role: n.data.role,
          content: n.data.content,
          imageUrls: n.data.imageUrls
        }));
      },
      generateAIResponse: async (userNodeId: string) => {
        const { getConversationPath, addMessage, updateMessageNode } = get();
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

        const assistantNodeId = addMessage(userNodeId, 'assistant', '', 'gemini-3-flash-preview');

        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        } catch (error: any) {
          updateMessageNode(assistantNodeId, `[Error generating AI response: ${error.message}]`);
        }
      }
    }),
    {
      name: 'treechat-storage',
      storage: createJSONStorage(() => storage),
    }
  )
);
