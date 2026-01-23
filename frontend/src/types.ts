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

// --- EZOIC TYPES ---
declare global {
  interface Window {
    ezstandalone: EzoicStandalone;
    ez_js_debugger?: number;
    ezRewardedAds?: EzoicRewardedAds;
  }
}

export interface EzoicStandalone {
  cmd: Function[];
  showAds: (...args: (number | any[])[]) => void;
  destroyPlaceholders: (...ids: number[]) => void;
  destroyAll: () => void;
  refreshAds: (...ids: number[]) => void;
  setEzoicAnchorAd: (show: boolean) => void;
  hasAnchorAdBeenClosed: () => boolean;
  config: (options: EzoicConfig) => void;
  initRewardedAds: (config?: any) => void;
  isEzoicUser: (percent?: number) => boolean;
  displayMore: () => void;
}

export interface EzoicConfig {
  limitCookies?: boolean;
  anchorAdPosition?: 'top' | 'bottom';
  anchorAdExpansion?: boolean;
  disableInterstitial?: boolean;
  vignetteDesktop?: boolean;
  vignetteMobile?: boolean;
  vignetteTablet?: boolean;
  [key: string]: any;
}

export interface EzoicRewardedAds {
  cmd: Function[];
  requestAndShow: (callback: (result: EzoicRewardResult) => void, config?: any) => void;
  requestWithOverlay: (callback: (result: EzoicRewardResult) => void, text?: any, config?: any) => void;
  contentLocker: (action: string | Function, config?: any) => void;
  ready?: boolean;
}

export interface EzoicRewardResult {
  status: boolean;
  reward: boolean;
  msg: string;
  adInfo?: {
    id: string;
    estimatedPayout: number;
  };
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
