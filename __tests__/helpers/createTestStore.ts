/**
 * Test utility: creates a raw (non-persisted) Zustand store for unit testing.
 * This avoids IndexedDB dependency while exercising exact same Slice logic.
 */
import { create } from 'zustand';
import { AppState } from '@/store/types';
import { createTabSlice } from '@/store/tabSlice';
import { createNodeSlice } from '@/store/nodeSlice';
import { createAiSlice } from '@/store/aiSlice';
import { createConfigSlice } from '@/store/configSlice';

export function createTestStore() {
  return create<AppState>()((set, get) => ({
    ...createTabSlice(set, get),
    ...createNodeSlice(set, get),
    ...createAiSlice(set, get),
    ...createConfigSlice(set, get),
  }));
}
