'use client';

import { useState, useMemo, useCallback } from 'react';
import { useStore } from '@/store/useStore';

/**
 * Custom hook for API config + model selection logic.
 * Shared between TreeChat (merge bar) and MessageNode (per-node generation).
 * Handles:
 * - Auto-select last used config/model on mount
 * - Fallback to first available config when history is invalid
 * - Persistence of selection to store
 */
export function useApiConfigSelection() {
  const apiConfigs = useStore(state => state.apiConfigs);
  const lastSelectedConfigId = useStore(state => state.lastSelectedConfigId);
  const lastSelectedModel = useStore(state => state.lastSelectedModel);
  const setLastConfigSelection = useStore(state => state.setLastConfigSelection);

  // Compute initial values from store state — no effect needed
  const initialState = useMemo(() => {
    if (apiConfigs.length === 0) return { configId: '', model: '' };

    const savedIdx = apiConfigs.findIndex(c => c.id === lastSelectedConfigId);
    if (savedIdx !== -1) {
      const models = apiConfigs[savedIdx].models;
      const model = lastSelectedModel && models.includes(lastSelectedModel)
        ? lastSelectedModel
        : (models[0] || '');
      return { configId: lastSelectedConfigId!, model };
    }

    return { configId: apiConfigs[0].id, model: apiConfigs[0].models[0] || '' };
  }, [apiConfigs, lastSelectedConfigId, lastSelectedModel]);

  const [selectedConfigId, setSelectedConfigId] = useState(initialState.configId);
  const [selectedModel, setSelectedModel] = useState(initialState.model);

  // Sync when apiConfigs change externally (e.g. config deleted)
  const actualConfigId = apiConfigs.find(c => c.id === selectedConfigId)
    ? selectedConfigId
    : (apiConfigs[0]?.id || '');

  const effectiveConfigId = actualConfigId || '';
  const effectiveModel = effectiveConfigId === selectedConfigId
    ? selectedModel
    : (apiConfigs.find(c => c.id === effectiveConfigId)?.models[0] || '');

  const handleConfigChange = useCallback((configId: string) => {
    setSelectedConfigId(configId);
    const conf = apiConfigs.find(c => c.id === configId);
    if (conf && conf.models.length > 0) {
      const firstModel = conf.models[0];
      setSelectedModel(firstModel);
      setLastConfigSelection(configId, firstModel);
    } else {
      setSelectedModel('');
      setLastConfigSelection(configId, '');
    }
  }, [apiConfigs, setLastConfigSelection]);

  const handleModelChange = useCallback((model: string) => {
    setSelectedModel(model);
    if (effectiveConfigId) {
      setLastConfigSelection(effectiveConfigId, model);
    }
  }, [effectiveConfigId, setLastConfigSelection]);

  const modelOptions = effectiveConfigId
    ? apiConfigs.find(c => c.id === effectiveConfigId)?.models.map(m => ({ label: m, value: m })) || []
    : [];

  const configOptions = apiConfigs.map(c => ({ label: c.name, value: c.id }));

  return {
    selectedConfigId: effectiveConfigId,
    selectedModel: effectiveModel,
    configOptions,
    modelOptions,
    handleConfigChange,
    handleModelChange,
  };
}
