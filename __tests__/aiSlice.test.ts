import { describe, it, expect, beforeEach } from 'vitest';
import { createTestStore } from './helpers/createTestStore';
import type { StoreApi, UseBoundStore } from 'zustand';
import type { AppState } from '@/store/types';

describe('aiSlice - getConversationPath', () => {
  let useStore: UseBoundStore<StoreApi<AppState>>;

  beforeEach(() => {
    useStore = createTestStore();
    useStore.getState().createTab('Test');
  });

  it('should return an empty array when no active tab exists', () => {
    // Create a separate store with no tabs
    const emptyStore = createTestStore();
    const path = emptyStore.getState().getConversationPath('nonexistent');
    expect(path).toEqual([]);
  });

  it('should collect ancestors for a linear conversation path', () => {
    const systemId = useStore.getState().addMessage(null, 'system', 'You are helpful');
    const userId = useStore.getState().addMessage(systemId, 'user', 'Hello');
    const assistantId = useStore.getState().addMessage(userId, 'assistant', 'Hi there!');

    const path = useStore.getState().getConversationPath(assistantId);

    // Should contain all 3 messages
    expect(path).toHaveLength(3);

    // System message is always placed first by the algorithm
    expect(path[0].role).toBe('system');
    expect(path[0].content).toBe('You are helpful');

    // The remaining messages should contain both user and assistant
    const roles = path.slice(1).map(m => m.role);
    expect(roles).toContain('user');
    expect(roles).toContain('assistant');

    // Verify content is present
    const contents = path.map(m => m.content);
    expect(contents).toContain('Hello');
    expect(contents).toContain('Hi there!');
  });

  it('should merge multiple system nodes into one system message', () => {
    const sys1 = useStore.getState().addMessage(null, 'system', 'Rule 1');
    const sys2 = useStore.getState().addMessage(null, 'system', 'Rule 2');

    // Create a user node connected to both system nodes manually
    const userId = useStore.getState().addMessage(sys1, 'user', 'Question');

    // Manually add an extra edge from sys2 to user (simulating merge scenario)
    const tab = useStore.getState().tabs[0];
    const extraEdge = { id: `e-${sys2}-${userId}`, source: sys2, target: userId };
    useStore.setState({
      tabs: useStore.getState().tabs.map(t =>
        t.id === tab.id ? { ...t, edges: [...t.edges, extraEdge] } : t
      ),
    });

    const path = useStore.getState().getConversationPath(userId);

    // System messages should be combined into one
    const systemMessages = path.filter(m => m.role === 'system');
    expect(systemMessages).toHaveLength(1);
    expect(systemMessages[0].content).toContain('Rule 1');
    expect(systemMessages[0].content).toContain('Rule 2');
  });

  it('should skip empty system nodes', () => {
    const sys1 = useStore.getState().addMessage(null, 'system', '');
    const sys2 = useStore.getState().addMessage(sys1, 'system', 'Active rule');
    const userId = useStore.getState().addMessage(sys2, 'user', 'Hello');

    const path = useStore.getState().getConversationPath(userId);
    const systemMessages = path.filter(m => m.role === 'system');

    // Only the non-empty system node should contribute
    expect(systemMessages).toHaveLength(1);
    expect(systemMessages[0].content).toBe('Active rule');
  });

  it('should include imageUrls in the path', () => {
    const sysId = useStore.getState().addMessage(null, 'system', 'Analyze');
    const userId = useStore.getState().addMessage(sysId, 'user', 'Check this');
    useStore.getState().addMessageImages(userId, ['data:image/png;base64,AAAA']);

    const path = useStore.getState().getConversationPath(userId);
    const userMsg = path.find(m => m.role === 'user');

    expect(userMsg?.imageUrls).toHaveLength(1);
    expect(userMsg?.imageUrls![0]).toBe('data:image/png;base64,AAAA');
  });
});

describe('aiSlice - mergeNodes', () => {
  let useStore: UseBoundStore<StoreApi<AppState>>;

  beforeEach(() => {
    useStore = createTestStore();
    useStore.getState().createTab('Test');
    // Suppress fetch calls in merge (it tries to call /api/chat)
    globalThis.fetch = async () => new Response('Mocked', { status: 200 });
  });

  it('should create a merged node connected to all selected nodes', () => {
    const node1 = useStore.getState().addMessage(null, 'user', 'Point A');
    const node2 = useStore.getState().addMessage(null, 'user', 'Point B');

    const mergedId = useStore.getState().mergeNodes([node1, node2]);
    const tab = useStore.getState().tabs[0];

    // Should have 3 nodes: 2 originals + 1 merged
    expect(tab.nodes).toHaveLength(3);

    // Merged node should exist and have system role
    const mergedNode = tab.nodes.find(n => n.id === mergedId);
    expect(mergedNode).toBeDefined();
    expect(mergedNode!.data.role).toBe('system');

    // Should have edges from both original nodes to merged node
    const mergeEdges = tab.edges.filter(e => e.target === mergedId);
    expect(mergeEdges).toHaveLength(2);
    expect(mergeEdges.map(e => e.source).sort()).toEqual([node1, node2].sort());
  });

  it('should position merged node below the selected nodes', () => {
    const node1 = useStore.getState().addMessage(null, 'user', 'A');
    const node2 = useStore.getState().addMessage(null, 'user', 'B');

    const mergedId = useStore.getState().mergeNodes([node1, node2]);
    const tab = useStore.getState().tabs[0];

    const mergedNode = tab.nodes.find(n => n.id === mergedId)!;
    const maxOriginalY = Math.max(
      ...tab.nodes.filter(n => n.id !== mergedId).map(n => n.position.y)
    );

    expect(mergedNode.position.y).toBeGreaterThan(maxOriginalY);
  });

  it('should return the id even when no nodes match', () => {
    const mergedId = useStore.getState().mergeNodes(['nonexistent-1', 'nonexistent-2']);
    expect(mergedId).toBeDefined();
    expect(typeof mergedId).toBe('string');
  });
});
