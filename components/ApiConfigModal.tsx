'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@/store/useStore';
import { useToastStore } from '@/store/useToastStore';
import { X, Plus, Trash2, Key, Globe, LayoutList, Check, Server } from 'lucide-react';
import { ApiConfig, ApiProvider } from '@/lib/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_MODELS = {
  google: ['gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-1.5-pro'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet-20241022', 'deepseek-chat']
};

export default function ApiConfigModal({ isOpen, onClose }: Props) {
  const { apiConfigs, addApiConfig, updateApiConfig, deleteApiConfig } = useStore();
  const addToast = useToastStore(state => state.addToast);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Form State
  const [name, setName] = useState('');
  const [provider, setProvider] = useState<ApiProvider>('openai');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [modelsStr, setModelsStr] = useState('');
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  if (!isOpen || !mounted) return null;

  const handleAddNew = () => {
    setEditingId('new');
    setName('New Config');
    setProvider('openai');
    setApiKey('');
    setBaseUrl('');
    setModelsStr(DEFAULT_MODELS.openai.join(', '));
  };

  const handleEdit = (config: ApiConfig) => {
    setEditingId(config.id);
    setName(config.name);
    setProvider(config.provider);
    setApiKey(config.apiKey);
    setBaseUrl(config.baseUrl || '');
    setModelsStr(config.models.join(', '));
  };

  const handleSave = () => {
    if (!name.trim() || !apiKey.trim() || !modelsStr.trim()) {
      addToast({ type: 'warning', message: 'Name, API Key, and at least one Model are required.' });
      return;
    }

    const models = modelsStr.split(',').map(m => m.trim()).filter(Boolean);

    if (models.length === 0) {
      addToast({ type: 'warning', message: 'Please provide at least one valid model name.' });
      return;
    }

    const configData = {
      name: name.trim(),
      provider,
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim() || undefined,
      models
    };

    if (editingId === 'new') {
      addApiConfig(configData);
    } else if (editingId) {
      updateApiConfig(editingId, configData);
    }

    setEditingId(null);
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as ApiProvider;
    setProvider(newProvider);
    if (editingId === 'new') {
      setModelsStr(DEFAULT_MODELS[newProvider].join(', '));
    }
  };

  const handleFetchModels = async () => {
    if (!apiKey.trim()) {
      addToast({ type: 'warning', message: 'Please enter an API Key first to fetch models.' });
      return;
    }

    setIsFetchingModels(true);
    try {
      if (provider === 'google') {
        const fetchUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`;
        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        if (data && Array.isArray(data.models)) {
          // Google returns model names like 'models/gemini-1.5-pro'
          const fetchedModels = data.models
            .map((m: { name: string }) => m.name.replace('models/', ''))
            .filter(Boolean);
          if (fetchedModels.length > 0) {
            setModelsStr(fetchedModels.join(', '));
            addToast({ type: 'success', message: `Successfully fetched ${fetchedModels.length} models.` });
          } else {
            addToast({ type: 'warning', message: 'No models found in the response.' });
          }
        } else {
          throw new Error("Invalid response format: 'models' array missing.");
        }
      } else {
        // OpenAI Compatible
        let fetchUrl = baseUrl.trim() || 'https://api.openai.com/v1';
        if (!fetchUrl.endsWith('/models')) {
          fetchUrl = fetchUrl.replace(/\/$/, '') + '/models';
        }

        const response = await fetch(fetchUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        if (data && Array.isArray(data.data)) {
          const fetchedModels = data.data.map((m: { id: string }) => m.id).filter(Boolean);
          if (fetchedModels.length > 0) {
            setModelsStr(fetchedModels.join(', '));
            addToast({ type: 'success', message: `Successfully fetched ${fetchedModels.length} models.` });
          } else {
            addToast({ type: 'warning', message: 'No models found in the response.' });
          }
        } else {
          throw new Error("Invalid response format: 'data' array missing.");
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Failed to fetch models:", error);
      addToast({ type: 'error', message: `Failed to fetch models: ${error.message}` });
    } finally {
      setIsFetchingModels(true);
      setTimeout(() => setIsFetchingModels(false), 500);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-pointer"
      onMouseDown={onClose}
    >
      <div
        className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-zinc-200 cursor-default"
        onMouseDown={e => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">API Configurations</h2>
              <p className="text-xs text-zinc-500">Manage your BYOK settings and models</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scroller">

          {/* List of configs */}
          {!editingId && (
            <div className="flex flex-col gap-4">
              {apiConfigs.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                  No custom API configurations found.<br />Click &quot;Add Configuration&quot; to get started.
                </div>
              ) : (
                <div className="grid gap-3">
                  {apiConfigs.map(config => (
                    <div key={config.id} className="group relative flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:border-white/10 transition">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-zinc-200">{config.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase tracking-wider">{config.provider}</span>
                        </div>
                        <div className="text-xs text-zinc-500 max-w-[400px] truncate">
                          Models: {config.models.join(', ')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => handleEdit(config)} className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg">Edit</button>
                        <button onClick={() => deleteApiConfig(config.id)} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={handleAddNew} className="flex items-center justify-center gap-2 w-full py-3 border border-dashed border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition cursor-pointer font-medium">
                <Plus className="w-4 h-4" />
                Add Configuration
              </button>
            </div>
          )}

          {/* Edit/Create Form */}
          {editingId && (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-200">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                <h3 className="font-medium text-zinc-100">{editingId === 'new' ? 'New Configuration' : 'Edit Configuration'}</h3>
                <button onClick={() => setEditingId(null)} className="text-xs text-zinc-500 hover:text-zinc-300">Cancel</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Configuration Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. My OpenAI, DeepSeek Pro" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500/50" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Provider Type</label>
                  <select value={provider} onChange={handleProviderChange} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500/50 appearance-none">
                    <option value="openai">OpenAI Compatible (OpenAI, DeepSeek, Ollama, etc.)</option>
                    <option value="google">Google Gemini</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">API Key</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
                    <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-..." className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-500/50" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Base URL (Overrides default endpoint)</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
                    <input type="url" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder={provider === 'openai' ? 'e.g. https://api.deepseek.com/v1' : 'Optional override'} className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-500/50" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      Available Models
                      <span className="font-normal text-[10px] text-zinc-600">(Comma separated)</span>
                    </span>
                    <button
                      onClick={handleFetchModels}
                      disabled={isFetchingModels || !apiKey.trim()}
                      className="text-[10px] bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 disabled:opacity-50 px-2 py-0.5 rounded transition"
                    >
                      {isFetchingModels ? "Fetching..." : "Fetch Models"}
                    </button>
                  </label>
                  <div className="relative">
                    <LayoutList className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
                    <input type="text" value={modelsStr} onChange={e => setModelsStr(e.target.value)} placeholder="model-1, model-2" className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-500/50" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm rounded-lg bg-white/5 hover:bg-white/10 transition">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-2 shadow-lg shadow-indigo-500/20">
                  <Check className="w-4 h-4" /> Save Configuration
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}
