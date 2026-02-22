import { v4 as uuidv4 } from 'uuid';
import { Tab, TabSlice, SetState, GetState } from './types';

const defaultTab = (): Tab => ({
  id: uuidv4(),
  name: 'New Chat',
  nodes: [],
  edges: [],
});

export const createTabSlice = (_set: SetState, _: GetState): TabSlice => ({
  tabs: [],
  activeTabId: '',

  createTab: (name?: string) => {
    const newTab = defaultTab();
    if (name) newTab.name = name;
    _set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
    }));
    return newTab.id;
  },

  importTab: (name, nodes, edges) => {
    const newTab: Tab = { id: uuidv4(), name, nodes, edges };
    _set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
    }));
    return newTab.id;
  },

  switchTab: (id) => _set({ activeTabId: id }),

  deleteTab: (id) => {
    _set((state) => {
      const newTabs = state.tabs.filter(t => t.id !== id);
      if (newTabs.length === 0) {
        const fallback = defaultTab();
        return { tabs: [fallback], activeTabId: fallback.id };
      }
      return {
        tabs: newTabs,
        activeTabId: state.activeTabId === id ? newTabs[newTabs.length - 1].id : state.activeTabId,
      };
    });
  },

  renameTab: (id, name) => {
    _set((state) => ({
      tabs: state.tabs.map(t => t.id === id ? { ...t, name } : t),
    }));
  },
});
