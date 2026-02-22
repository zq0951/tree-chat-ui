import {
  Connection,
  Edge,
  EdgeChange,
  NodeChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';
import { AppNode, NodeSlice, SetState, GetState } from './types';
import { updateActiveTab, HORIZONTAL_SPACING, VERTICAL_MARGIN, DEFAULT_EDGE_STYLE } from './helpers';

export const createNodeSlice = (_set: SetState, _get: GetState): NodeSlice => ({
  onNodesChange: (changes: NodeChange<AppNode>[]) => {
    updateActiveTab(_get, _set, (tab) => ({
      nodes: applyNodeChanges(changes, tab.nodes) as AppNode[],
    }));
  },

  onEdgesChange: (changes: EdgeChange<Edge>[]) => {
    updateActiveTab(_get, _set, (tab) => ({
      edges: applyEdgeChanges(changes, tab.edges),
    }));
  },

  onConnect: (connection: Connection) => {
    updateActiveTab(_get, _set, (tab) => ({
      edges: addEdge({ ...connection, ...DEFAULT_EDGE_STYLE }, tab.edges),
    }));
  },

  addMessage: (parentId, role, content, model?, configId?) => {
    const id = uuidv4();
    const activeTab = _get().tabs.find(t => t.id === _get().activeTabId);
    if (!activeTab) return id;
    const { nodes, edges } = activeTab;

    let newX = 250;
    let newY = 100;

    if (parentId) {
      const parentNode = nodes.find(n => n.id === parentId);
      if (parentNode) {
        const childCount = edges.filter(e => e.source === parentId).length;
        const parentHeight = parentNode.measured?.height || 250;
        newY = Math.round((parentNode.position.y + parentHeight + VERTICAL_MARGIN) / 10) * 10;
        newX = childCount === 0
          ? Math.round(parentNode.position.x / 10) * 10
          : Math.round((parentNode.position.x + HORIZONTAL_SPACING * childCount) / 10) * 10;
      }
    } else {
      newX = Math.round((100 + (nodes.length % 5) * 50) / 10) * 10;
      newY = Math.round((100 + (nodes.length % 5) * 50) / 10) * 10;
    }

    const newNode: AppNode = {
      id,
      position: { x: newX, y: newY },
      type: 'messageNode',
      style: { width: 540 },
      data: { id, role, content, model, configId, timestamp: Date.now() },
      dragHandle: '.custom-drag-handle',
    };

    const newEdges = parentId
      ? [...edges, { id: `e-${parentId}-${id}`, source: parentId, target: id, ...DEFAULT_EDGE_STYLE }]
      : edges;

    updateActiveTab(_get, _set, () => ({ nodes: [...nodes, newNode], edges: newEdges }));
    return id;
  },

  updateMessageNode: (id, newContent) => {
    updateActiveTab(_get, _set, (tab) => ({
      nodes: tab.nodes.map(n => n.id === id ? { ...n, data: { ...n.data, content: newContent } } : n),
    }));
  },

  updateMessageError: (id, error?) => {
    updateActiveTab(_get, _set, (tab) => ({
      nodes: tab.nodes.map(n => n.id === id ? { ...n, data: { ...n.data, error } } : n),
    }));
  },

  addMessageImages: (id, newImageUrls) => {
    updateActiveTab(_get, _set, (tab) => ({
      nodes: tab.nodes.map(n => {
        if (n.id !== id) return n;
        return { ...n, data: { ...n.data, imageUrls: [...(n.data.imageUrls || []), ...newImageUrls] } };
      }),
    }));
  },

  removeMessageImage: (id, index) => {
    updateActiveTab(_get, _set, (tab) => ({
      nodes: tab.nodes.map(n => {
        if (n.id !== id) return n;
        return { ...n, data: { ...n.data, imageUrls: (n.data.imageUrls || []).filter((_, i) => i !== index) } };
      }),
    }));
  },

  deleteMessageNode: (id) => {
    updateActiveTab(_get, _set, (tab) => ({
      nodes: tab.nodes.filter(n => n.id !== id),
      edges: tab.edges.filter(e => e.source !== id && e.target !== id),
    }));
  },

  deleteNodes: (ids) => {
    updateActiveTab(_get, _set, (tab) => ({
      nodes: tab.nodes.filter(n => !ids.includes(n.id)),
      edges: tab.edges.filter(e => !ids.includes(e.source) && !ids.includes(e.target)),
    }));
  },
});
