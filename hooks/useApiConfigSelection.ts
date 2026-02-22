'use client';

import { useState, useEffect } from 'react';
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

  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');

  useEffect(() => {
    if (apiConfigs.length > 0) {
      const savedConfigIdx = apiConfigs.findIndex(c => c.id === lastSelectedConfigId);
      if (savedConfigIdx !== -1) {
        setSelectedConfigId(lastSelectedConfigId!);
        const configModels = apiConfigs[savedConfigIdx].models;
        if (lastSelectedModel && configModels.includes(lastSelectedModel)) {
          setSelectedModel(lastSelectedModel);
        } else {
          setSelectedModel(configModels[0] || '');
        }
      } else if (!selectedConfigId) {
        setSelectedConfigId(apiConfigs[0].id);
        setSelectedModel(apiConfigs[0].models[0] || '');
      }
    } else {
      setSelectedConfigId('');
      setSelectedModel('');
    }
  }, [apiConfigs, selectedConfigId, lastSelectedConfigId, lastSelectedModel]);

  const handleConfigChange = (configId: string) => {
    setSelectedConfigId(configId);
    const conf = apiConfigs.find(c => c.id === configId);
    if (conf && conf.models.length > 0) {
      const firstModel = conf.models[0];
      setSelectedModel(firstModel);
      setLastConfigSelection(configId, firstModel);
    } else {
      setLastConfigSelection(configId, '');
    }
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    if (selectedConfigId) {
      setLastConfigSelection(selectedConfigId, model);
    }
  };

  const modelOptions = selectedConfigId
    ? apiConfigs.find(c => c.id === selectedConfigId)?.models.map(m => ({ label: m, value: m })) || []
    : [];

  const configOptions = apiConfigs.map(c => ({ label: c.name, value: c.id }));

  return {
    selectedConfigId,
    selectedModel,
    configOptions,
    modelOptions,
    handleConfigChange,
    handleModelChange,
  };
}
