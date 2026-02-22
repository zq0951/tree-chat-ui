import { v4 as uuidv4 } from 'uuid';
import { Edge } from '@xyflow/react';
import { AppNode, AiSlice, SetState, GetState } from './types';
import { updateActiveTab, VERTICAL_MARGIN, DEFAULT_EDGE_STYLE } from './helpers';

// ── Helpers ──────────────────────────────────────────────────────

/** Stream an AI response from /api/chat and pipe chunks into a node */
async function streamAIResponse(opts: {
  headers: Record<string, string>;
  messages: unknown[];
  nodeId: string;
  updateNode: (id: string, content: string) => void;
  updateError: (id: string, error?: string) => void;
  onSuccess?: () => void;
  fallbackContent?: string;
}) {
  const { headers, messages, nodeId, updateNode, updateError, onSuccess, fallbackContent } = opts;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) throw new Error(await response.text());
    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let fullContent = '';

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value) {
        fullContent += decoder.decode(value, { stream: true });
        updateNode(nodeId, fullContent);
      }
    }

    // Check for in-band error markers injected by the API route
    if (fullContent.includes('[API Error]:')) {
      const parts = fullContent.split('[API Error]:');
      updateNode(nodeId, parts[0].trim());
      throw new Error(parts[1].trim());
    }

    onSuccess?.();
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    updateError(nodeId, errMsg);
    if (fallbackContent) {
      updateNode(nodeId, `*(AI 压缩失败，原文本已直接拼接)*\n\n${fallbackContent}`);
    }
  }
}

/** Build request headers from an API config entry */
function buildRequestHeaders(
  get: GetState,
  configId?: string,
  model?: string,
  useFallback = false,
): { headers: Record<string, string>; targetModel: string } {
  const { apiConfigs } = get();
  let targetModel = model;
  let targetConfig = apiConfigs.find(c => c.id === configId);

  if (useFallback && (!targetConfig || !targetModel)) {
    const { lastSelectedConfigId, lastSelectedModel } = get();
    targetModel = lastSelectedModel || 'gemini-3-flash-preview';
    targetConfig = apiConfigs.find(c => c.id === lastSelectedConfigId);
  }

  targetModel = targetModel || 'gemini-3-flash-preview';

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (targetConfig) {
    headers['X-Api-Key'] = targetConfig.apiKey;
    headers['X-Provider'] = targetConfig.provider;
    if (targetConfig.baseUrl) headers['X-Base-Url'] = targetConfig.baseUrl;
    headers['X-Model'] = targetModel;
  }

  return { headers, targetModel };
}

// ── Slice ────────────────────────────────────────────────────────

export const createAiSlice = (_set: SetState, _get: GetState): AiSlice => ({
  getConversationPath: (nodeId) => {
    const activeTab = _get().tabs.find(t => t.id === _get().activeTabId);
    if (!activeTab) return [];
    const { nodes, edges } = activeTab;

    // BFS to collect all ancestor nodes
    const pathNodes: AppNode[] = [];
    const visited = new Set<string>();
    const queue = [nodeId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId || visited.has(currentId)) continue;
      visited.add(currentId);

      const node = nodes.find(n => n.id === currentId);
      if (node) pathNodes.push(node);

      for (const edge of edges.filter(e => e.target === currentId)) {
        queue.push(edge.source);
      }
    }

    // Sort by timestamp to maintain reading order
    pathNodes.sort((a, b) => (a.data.timestamp || 0) - (b.data.timestamp || 0));

    const systemNodes = pathNodes.filter(n => n.data.role === 'system');
    const otherNodes = pathNodes.filter(n => n.data.role !== 'system');

    const messages: { role: string; content: string; imageUrls?: string[] }[] = [];

    if (systemNodes.length > 0) {
      const combinedSystemContent = systemNodes
        .map(n => n.data.content)
        .filter(c => c && c.trim().length > 0)
        .join('\n\n---\n\n');

      if (combinedSystemContent) {
        messages.push({ role: 'system', content: combinedSystemContent });
      }
    }

    otherNodes.forEach(n => {
      messages.push({
        role: n.data.role as string,
        content: n.data.content as string,
        imageUrls: n.data.imageUrls as string[] | undefined,
      });
    });

    return messages;
  },

  mergeNodes: (nodeIds, configId?, model?) => {
    const id = uuidv4();
    const activeTab = _get().tabs.find(t => t.id === _get().activeTabId);
    if (!activeTab) return id;
    const { nodes, edges } = activeTab;

    const selectedNodes = nodes.filter(n => nodeIds.includes(n.id));
    if (selectedNodes.length === 0) return id;

    // Sort by visual reading order (top-to-bottom, left-to-right)
    selectedNodes.sort((a, b) =>
      a.position.y === b.position.y ? a.position.x - b.position.x : a.position.y - b.position.y,
    );

    const combinedContent = selectedNodes
      .map(n => n.data.content)
      .filter(c => c && c.trim().length > 0)
      .join('\n\n---\n\n');

    const combinedImages = Array.from(new Set(selectedNodes.flatMap(n => n.data.imageUrls || [])));

    // Position below selected nodes, horizontally centered
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
        id, role: 'system',
        content: '*AI is thinking and compressing these contexts...*',
        imageUrls: combinedImages,
        timestamp: Date.now(),
        configId, model,
      },
      dragHandle: '.custom-drag-handle',
    };

    const newEdges: Edge[] = selectedNodes.map(n => ({
      id: `e-${n.id}-${id}`,
      source: n.id,
      target: id,
      ...DEFAULT_EDGE_STYLE,
    }));

    updateActiveTab(_get, _set, () => ({
      nodes: [...nodes.map(n => ({ ...n, selected: false })), { ...newNode, selected: true }],
      edges: [...edges, ...newEdges],
    }));

    // Kick off async AI compression
    const { headers } = buildRequestHeaders(_get, configId, model, true);

    setTimeout(() => {
      const { updateMessageNode, updateMessageError } = _get();
      streamAIResponse({
        headers,
        messages: [
          {
            role: 'system',
            content: 'You are a highly professional logic summarization AI. Your task is to merge and compress a set of contexts provided by the user from different branch discussions, extracting the core points and summaries with logic and coherence. This will be used as a general upstream context for further deduction or questioning. Keep only the core logic and critical intent, avoiding rambling or casual chat. Output ONLY the compressed context directly. Do not include introductory phrases.',
          },
          {
            role: 'user',
            content: `Please compress, summarize, and fuse the following multiple contexts into a single coherent text:\n\n${combinedContent}`,
          },
        ],
        nodeId: id,
        updateNode: updateMessageNode,
        updateError: updateMessageError,
        fallbackContent: combinedContent,
      });
    }, 0);

    return id;
  },

  generateAIResponse: async (userNodeId, configId?, model?) => {
    const { getConversationPath, addMessage, updateMessageNode, updateMessageError } = _get();
    const messages = getConversationPath(userNodeId);

    const validMessages = messages.filter(
      m => m.content.trim().length > 0 || (m.imageUrls && m.imageUrls.length > 0),
    );

    const formattedMessages = validMessages.map(m => {
      if (m.imageUrls && m.imageUrls.length > 0) {
        return {
          role: m.role,
          content: [
            { type: 'text', text: m.content || 'Analyze these images' },
            ...m.imageUrls.map(img => ({ type: 'image', image: img })),
          ],
        };
      }
      return { role: m.role, content: m.content };
    });

    const { headers, targetModel } = buildRequestHeaders(_get, configId, model);
    const assistantNodeId = addMessage(userNodeId, 'assistant', '', targetModel, configId);
    updateMessageError(assistantNodeId, undefined);

    await streamAIResponse({
      headers,
      messages: formattedMessages,
      nodeId: assistantNodeId,
      updateNode: updateMessageNode,
      updateError: updateMessageError,
      onSuccess: () => addMessage(assistantNodeId, 'user', ''),
    });
  },
});
