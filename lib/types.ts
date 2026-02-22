export type MessageRole = 'user' | 'assistant' | 'system';

export interface MessageNodeData extends Record<string, unknown> {
  id: string;
  role: MessageRole;
  content: string;
  imageUrls?: string[];
  model?: string; // Optional indicator for which model was used
  timestamp: number;
  onBranch?: (id: string, branchContent: string) => void;
  onEdit?: (id: string, newContent: string) => void;
  onDelete?: (id: string) => void;
}
