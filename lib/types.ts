export type MessageRole = 'user' | 'assistant' | 'system';

export type ApiProvider = 'google' | 'openai';

export interface ApiConfig {
  id: string;
  name: string;
  provider: ApiProvider;
  apiKey: string;
  baseUrl?: string;
  models: string[];
}

export interface MessageNodeData extends Record<string, unknown> {
  id: string;
  role: MessageRole;
  content: string;
  imageUrls?: string[];
  model?: string; // Optional indicator for which model was used
  configId?: string; // Optional indicator for which API config was used
  error?: string; // Optional error message if generation failed
  timestamp: number;
}
