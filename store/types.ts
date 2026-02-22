import {
  Edge,
  Node,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from '@xyflow/react';
import { MessageNodeData, MessageRole, ApiConfig } from '@/lib/types';

// ── Core Data Types ──────────────────────────────────────────────

export type AppNode = Node<MessageNodeData, 'messageNode'>;

export interface Tab {
  id: string;
  name: string;
  nodes: AppNode[];
  edges: Edge[];
}

// ── Slice Interfaces ─────────────────────────────────────────────

export interface TabSlice {
  tabs: Tab[];
  activeTabId: string;
  createTab: (name?: string) => string;
  importTab: (name: string, nodes: AppNode[], edges: Edge[]) => string;
  switchTab: (id: string) => void;
  deleteTab: (id: string) => void;
  renameTab: (id: string, name: string) => void;
}

export interface NodeSlice {
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
}

export interface AiSlice {
  mergeNodes: (nodeIds: string[], configId?: string, model?: string) => string;
  getConversationPath: (nodeId: string) => { role: string; content: string; imageUrls?: string[] }[];
  generateAIResponse: (userNodeId: string, configId?: string, model?: string) => Promise<void>;
}

export interface ConfigSlice {
  apiConfigs: ApiConfig[];
  lastSelectedConfigId?: string;
  lastSelectedModel?: string;
  setLastConfigSelection: (configId: string, model: string) => void;
  addApiConfig: (config: Omit<ApiConfig, 'id'>) => string;
  updateApiConfig: (id: string, config: Omit<ApiConfig, 'id'>) => void;
  deleteApiConfig: (id: string) => void;
}

// ── Combined App State ───────────────────────────────────────────

export type AppState = TabSlice & NodeSlice & AiSlice & ConfigSlice;

// ── Zustand Helpers ──────────────────────────────────────────────

export type SetState = (partial: Partial<AppState> | ((state: AppState) => Partial<AppState>)) => void;
export type GetState = () => AppState;
