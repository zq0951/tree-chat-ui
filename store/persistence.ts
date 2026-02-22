import { get, set as idbSet, del } from 'idb-keyval';
import { PersistStorage, StorageValue } from 'zustand/middleware';
import { AppState } from './types';

// ── Debounced Write Queue ────────────────────────────────────────

let writeTimeout: ReturnType<typeof setTimeout>;
let pendingWrite: { name: string; serialized: string } | null = null;

/** Flush pending writes immediately (e.g. before page unload) */
async function flushPendingWrite() {
  if (pendingWrite) {
    const { name, serialized } = pendingWrite;
    pendingWrite = null;
    if (writeTimeout) clearTimeout(writeTimeout);
    try {
      await idbSet(name, serialized);
    } catch (e) {
      console.error('Failed to flush state to IndexedDB', e);
    }
  }
}

// Register beforeunload handler to reduce data loss on page close
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushPendingWrite();
  });
}

// ── Custom Persist Storage ───────────────────────────────────────

export const customPersistStorage: PersistStorage<AppState> = {
  getItem: async (name: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const value = await get(name);
      if (!value) return null;
      if (typeof value === 'object') return value as StorageValue<AppState>;
      return JSON.parse(value);
    } catch (e) {
      console.error('Failed to parse state from IndexedDB', e);
      return null;
    }
  },

  setItem: async (name: string, value: StorageValue<AppState>) => {
    if (typeof window === 'undefined') return;
    if (writeTimeout) clearTimeout(writeTimeout);
    try {
      const serialized = JSON.stringify(value);
      pendingWrite = { name, serialized };
      writeTimeout = setTimeout(async () => {
        pendingWrite = null;
        try {
          await idbSet(name, serialized);
        } catch (e) {
          console.error('Failed to save state to IndexedDB', e);
        }
      }, 300);
    } catch (e) {
      console.error('Failed to serialize state for IndexedDB', e);
    }
  },

  removeItem: async (name: string) => {
    if (typeof window === 'undefined') return;
    if (writeTimeout) clearTimeout(writeTimeout);
    pendingWrite = null;
    try {
      await del(name);
    } catch (e) {
      console.error('Failed to remove state from IndexedDB', e);
    }
  },
};
