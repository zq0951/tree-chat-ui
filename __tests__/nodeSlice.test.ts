import { describe, it, expect, beforeEach } from 'vitest';
import { createTestStore } from './helpers/createTestStore';
import type { StoreApi, UseBoundStore } from 'zustand';
import type { AppState } from '@/store/types';

describe('nodeSlice', () => {
  let useStore: UseBoundStore<StoreApi<AppState>>;

  beforeEach(() => {
    useStore = createTestStore();
    // Always start with one active tab
    useStore.getState().createTab('Test');
  });

  describe('addMessage', () => {
    it('should add a root node (no parent)', () => {
      const id = useStore.getState().addMessage(null, 'system', 'Hello');
      const tab = useStore.getState().tabs[0];

      expect(tab.nodes).toHaveLength(1);
      expect(tab.nodes[0].id).toBe(id);
      expect(tab.nodes[0].data.role).toBe('system');
      expect(tab.nodes[0].data.content).toBe('Hello');
      expect(tab.nodes[0].data.timestamp).toBeGreaterThan(0);
      expect(tab.edges).toHaveLength(0); // Root has no edges
    });

    it('should add a child node with edge to parent', () => {
      const parentId = useStore.getState().addMessage(null, 'system', 'System prompt');
      const childId = useStore.getState().addMessage(parentId, 'user', 'User question');
      const tab = useStore.getState().tabs[0];

      expect(tab.nodes).toHaveLength(2);
      expect(tab.edges).toHaveLength(1);
      expect(tab.edges[0].source).toBe(parentId);
      expect(tab.edges[0].target).toBe(childId);
    });

    it('should store model and configId metadata', () => {
      const id = useStore.getState().addMessage(null, 'assistant', 'Response', 'gemini-pro', 'config-1');
      const node = useStore.getState().tabs[0].nodes.find(n => n.id === id)!;

      expect(node.data.model).toBe('gemini-pro');
      expect(node.data.configId).toBe('config-1');
    });

    it('should position siblings horizontally offset from each other', () => {
      const parentId = useStore.getState().addMessage(null, 'system', 'Root');
      useStore.getState().addMessage(parentId, 'user', 'Branch 1');
      useStore.getState().addMessage(parentId, 'user', 'Branch 2');

      const tab = useStore.getState().tabs[0];
      const branch1 = tab.nodes[1];
      const branch2 = tab.nodes[2];

      // Second child should be horizontally offset from first
      expect(branch2.position.x).toBeGreaterThan(branch1.position.x);
    });
  });

  describe('updateMessageNode', () => {
    it('should update the content of a node', () => {
      const id = useStore.getState().addMessage(null, 'user', 'original');

      useStore.getState().updateMessageNode(id, 'updated content');
      expect(useStore.getState().tabs[0].nodes[0].data.content).toBe('updated content');
    });
  });

  describe('updateMessageError', () => {
    it('should set an error on a node', () => {
      const id = useStore.getState().addMessage(null, 'assistant', '');

      useStore.getState().updateMessageError(id, 'API key invalid');
      expect(useStore.getState().tabs[0].nodes[0].data.error).toBe('API key invalid');
    });

    it('should clear an error on a node', () => {
      const id = useStore.getState().addMessage(null, 'assistant', '');

      useStore.getState().updateMessageError(id, 'some error');
      useStore.getState().updateMessageError(id, undefined);
      expect(useStore.getState().tabs[0].nodes[0].data.error).toBeUndefined();
    });
  });

  describe('addMessageImages / removeMessageImage', () => {
    it('should add images to a node', () => {
      const id = useStore.getState().addMessage(null, 'user', 'check this');

      useStore.getState().addMessageImages(id, ['data:image/png;base64,AAA', 'data:image/png;base64,BBB']);
      const imgs = useStore.getState().tabs[0].nodes[0].data.imageUrls;

      expect(imgs).toHaveLength(2);
      expect(imgs![0]).toBe('data:image/png;base64,AAA');
    });

    it('should append images to existing ones', () => {
      const id = useStore.getState().addMessage(null, 'user', '');
      useStore.getState().addMessageImages(id, ['img1']);
      useStore.getState().addMessageImages(id, ['img2', 'img3']);

      expect(useStore.getState().tabs[0].nodes[0].data.imageUrls).toHaveLength(3);
    });

    it('should remove an image by index', () => {
      const id = useStore.getState().addMessage(null, 'user', '');
      useStore.getState().addMessageImages(id, ['a', 'b', 'c']);

      useStore.getState().removeMessageImage(id, 1); // Remove 'b'
      const imgs = useStore.getState().tabs[0].nodes[0].data.imageUrls;

      expect(imgs).toEqual(['a', 'c']);
    });
  });

  describe('deleteMessageNode', () => {
    it('should delete a node and its connected edges', () => {
      const parentId = useStore.getState().addMessage(null, 'system', 'Root');
      const childId = useStore.getState().addMessage(parentId, 'user', 'Child');

      useStore.getState().deleteMessageNode(childId);
      const tab = useStore.getState().tabs[0];

      expect(tab.nodes).toHaveLength(1);
      expect(tab.nodes[0].id).toBe(parentId);
      expect(tab.edges).toHaveLength(0);
    });
  });

  describe('deleteNodes (batch)', () => {
    it('should delete multiple nodes and their edges', () => {
      const root = useStore.getState().addMessage(null, 'system', 'Root');
      const child1 = useStore.getState().addMessage(root, 'user', 'Child 1');
      const child2 = useStore.getState().addMessage(root, 'user', 'Child 2');

      useStore.getState().deleteNodes([child1, child2]);
      const tab = useStore.getState().tabs[0];

      expect(tab.nodes).toHaveLength(1);
      expect(tab.nodes[0].id).toBe(root);
      expect(tab.edges).toHaveLength(0);
    });
  });
});
