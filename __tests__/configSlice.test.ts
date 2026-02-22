import { describe, it, expect, beforeEach } from 'vitest';
import { createTestStore } from './helpers/createTestStore';
import type { StoreApi, UseBoundStore } from 'zustand';
import type { AppState } from '@/store/types';

describe('configSlice', () => {
  let useStore: UseBoundStore<StoreApi<AppState>>;

  beforeEach(() => {
    useStore = createTestStore();
  });

  it('should start with empty config list', () => {
    expect(useStore.getState().apiConfigs).toHaveLength(0);
    expect(useStore.getState().lastSelectedConfigId).toBeUndefined();
    expect(useStore.getState().lastSelectedModel).toBeUndefined();
  });

  it('should add an API config and return its id', () => {
    const id = useStore.getState().addApiConfig({
      name: 'My Gemini',
      provider: 'google',
      apiKey: 'test-key-123',
      models: ['gemini-pro', 'gemini-flash'],
    });

    const configs = useStore.getState().apiConfigs;
    expect(configs).toHaveLength(1);
    expect(configs[0].id).toBe(id);
    expect(configs[0].name).toBe('My Gemini');
    expect(configs[0].provider).toBe('google');
    expect(configs[0].apiKey).toBe('test-key-123');
    expect(configs[0].models).toEqual(['gemini-pro', 'gemini-flash']);
  });

  it('should update an existing API config', () => {
    const id = useStore.getState().addApiConfig({
      name: 'Old Name',
      provider: 'google',
      apiKey: 'old-key',
      models: ['model-a'],
    });

    useStore.getState().updateApiConfig(id, {
      name: 'New Name',
      provider: 'openai',
      apiKey: 'new-key',
      baseUrl: 'https://api.example.com',
      models: ['gpt-4', 'gpt-3.5'],
    });

    const config = useStore.getState().apiConfigs[0];
    expect(config.id).toBe(id); // ID should be preserved
    expect(config.name).toBe('New Name');
    expect(config.provider).toBe('openai');
    expect(config.apiKey).toBe('new-key');
    expect(config.baseUrl).toBe('https://api.example.com');
    expect(config.models).toEqual(['gpt-4', 'gpt-3.5']);
  });

  it('should delete an API config', () => {
    const id1 = useStore.getState().addApiConfig({
      name: 'Config 1', provider: 'google', apiKey: 'k1', models: [],
    });
    useStore.getState().addApiConfig({
      name: 'Config 2', provider: 'openai', apiKey: 'k2', models: [],
    });

    useStore.getState().deleteApiConfig(id1);

    const configs = useStore.getState().apiConfigs;
    expect(configs).toHaveLength(1);
    expect(configs[0].name).toBe('Config 2');
  });

  it('should remember last selected config and model', () => {
    useStore.getState().setLastConfigSelection('cfg-abc', 'gemini-flash');

    expect(useStore.getState().lastSelectedConfigId).toBe('cfg-abc');
    expect(useStore.getState().lastSelectedModel).toBe('gemini-flash');
  });
});
