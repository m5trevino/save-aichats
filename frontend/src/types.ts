export interface Message {
  role: 'user' | 'model';
  text: string;
  isThought?: boolean;
  ascii_header?: string;
}

export interface Chunk {
  text?: string;
  role: 'user' | 'model';
  isThought?: boolean;
  parts?: { text: string; thought?: boolean }[];
}

export interface JsonData {
  chunkedPrompt?: {
    chunks?: Chunk[];
  };
}

export interface CommandArtifact {
  id: number;
  type: 'eof' | 'sed';
  filename: string;
  command: string;
  sourceMessageIndex: number;
}

export interface FileGroup {
  filename: string;
  commands: CommandArtifact[];
}

export interface Prompt {
  id: string;
  name: string;
  content: string;
}

export interface BatchItem {
  id: string;
  originalName: string;
  sanitizedName: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  messages?: Message[];
  error?: string;
}

export interface UnifiedArchive {
  metadata: {
    exportDate: string;
    personaUsed: string | null;
    totalFiles: number;
  };
  files: Record<string, Message[]>;
}
