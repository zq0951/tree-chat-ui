import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState } from './types';
import { customPersistStorage } from './persistence';
import { createTabSlice } from './tabSlice';
import { createNodeSlice } from './nodeSlice';
import { createAiSlice } from './aiSlice';
import { createConfigSlice } from './configSlice';

// Re-export types for backward compatibility
export type { AppNode, Tab, AppState } from './types';

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...createTabSlice(set, get),
      ...createNodeSlice(set, get),
      ...createAiSlice(set, get),
      ...createConfigSlice(set, get),
    }),
    {
      name: 'treechat-storage',
      storage: customPersistStorage,
    }
  )
);
