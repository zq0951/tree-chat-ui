import { v4 as uuidv4 } from 'uuid';
import { ConfigSlice, SetState, GetState } from './types';

export const createConfigSlice = (_set: SetState, _: GetState): ConfigSlice => ({
  apiConfigs: [],
  lastSelectedConfigId: undefined,
  lastSelectedModel: undefined,

  setLastConfigSelection: (configId, model) =>
    _set({ lastSelectedConfigId: configId, lastSelectedModel: model }),

  addApiConfig: (config) => {
    const id = uuidv4();
    _set((state) => ({ apiConfigs: [...state.apiConfigs, { ...config, id }] }));
    return id;
  },

  updateApiConfig: (id, newConfig) => {
    _set((state) => ({
      apiConfigs: state.apiConfigs.map(c => c.id === id ? { ...newConfig, id } : c),
    }));
  },

  deleteApiConfig: (id) => {
    _set((state) => ({
      apiConfigs: state.apiConfigs.filter(c => c.id !== id),
    }));
  },
});
