export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  data: string; // Base64 representation
  url?: string;
}

export interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  messageType?: 'text' | 'voice';
  attachment?: Attachment;
  createdAt: number;
  isStreaming?: boolean;
  error?: string;
}

export interface Chat {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  lastMessageSnippet?: string;
}

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isGuest: boolean;
}

export interface Settings {
  theme: 'dark' | 'light' | 'system';
  systemPrompt: string;
  voiceName: 'Kore' | 'Zephyr' | 'Puck' | 'Fenrir' | 'Charon';
  autoScroll: boolean;
  autoPlayVoice: boolean;
  chatModel: string;
  ttsModel: string;
}
