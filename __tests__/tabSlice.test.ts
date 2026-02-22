import { describe, it, expect, beforeEach } from 'vitest';
import { createTestStore } from './helpers/createTestStore';
import type { StoreApi, UseBoundStore } from 'zustand';
import type { AppState } from '@/store/types';

describe('tabSlice', () => {
  let useStore: UseBoundStore<StoreApi<AppState>>;

  beforeEach(() => {
    useStore = createTestStore();
  });

  it('should start with no tabs', () => {
    const state = useStore.getState();
    expect(state.tabs).toHaveLength(0);
    expect(state.activeTabId).toBe('');
  });

  it('should create a tab and set it as active', () => {
    const id = useStore.getState().createTab('Test Chat');
    const state = useStore.getState();

    expect(state.tabs).toHaveLength(1);
    expect(state.tabs[0].name).toBe('Test Chat');
    expect(state.tabs[0].id).toBe(id);
    expect(state.activeTabId).toBe(id);
    expect(state.tabs[0].nodes).toHaveLength(0);
    expect(state.tabs[0].edges).toHaveLength(0);
  });

  it('should create a tab with default name', () => {
    useStore.getState().createTab();
    expect(useStore.getState().tabs[0].name).toBe('New Chat');
  });

  it('should switch between tabs', () => {
    const id1 = useStore.getState().createTab('Tab 1');
    const id2 = useStore.getState().createTab('Tab 2');

    expect(useStore.getState().activeTabId).toBe(id2);

    useStore.getState().switchTab(id1);
    expect(useStore.getState().activeTabId).toBe(id1);
  });

  it('should rename a tab', () => {
    const id = useStore.getState().createTab('Old Name');

    useStore.getState().renameTab(id, 'New Name');
    expect(useStore.getState().tabs[0].name).toBe('New Name');
  });

  it('should delete a tab and switch to the last remaining tab', () => {
    const id1 = useStore.getState().createTab('Tab 1');
    const id2 = useStore.getState().createTab('Tab 2');

    useStore.getState().switchTab(id1);
    useStore.getState().deleteTab(id1);

    const state = useStore.getState();
    expect(state.tabs).toHaveLength(1);
    expect(state.tabs[0].id).toBe(id2);
    expect(state.activeTabId).toBe(id2);
  });

  it('should create a fallback tab when deleting the last tab', () => {
    const id = useStore.getState().createTab('Only Tab');

    useStore.getState().deleteTab(id);

    const state = useStore.getState();
    expect(state.tabs).toHaveLength(1);
    expect(state.tabs[0].id).not.toBe(id);
    expect(state.activeTabId).toBe(state.tabs[0].id);
  });

  it('should import a tab with nodes and edges', () => {
    const nodes = [
      { id: 'n1', position: { x: 0, y: 0 }, type: 'messageNode' as const, data: { id: 'n1', role: 'user' as const, content: 'Hello', timestamp: Date.now() } },
    ];
    const edges = [{ id: 'e1', source: 'n1', target: 'n2' }];

    const id = useStore.getState().importTab('Imported', nodes, edges);
    const state = useStore.getState();

    expect(state.tabs).toHaveLength(1);
    expect(state.tabs[0].name).toBe('Imported');
    expect(state.tabs[0].nodes).toHaveLength(1);
    expect(state.tabs[0].edges).toHaveLength(1);
    expect(state.activeTabId).toBe(id);
  });
});
