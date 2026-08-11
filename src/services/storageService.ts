import { Chat, Message } from '../types';

const LEGACY_CHATS_KEY = 'floai_chats_v1';
const LEGACY_MESSAGES_KEY_PREFIX = 'floai_messages_v1_';

function getChatsKey(userId: string = 'guest'): string {
  return `floai_chats_v1_${userId}`;
}

function getMessagesKeyPrefix(userId: string = 'guest'): string {
  return `floai_messages_v1_${userId}_`;
}

/**
 * Migration helper to ensure legacy guest storage key is seamlessly moved
 */
function migrateLegacyIfNeeded(userId: string): void {
  try {
    const key = getChatsKey(userId);
    if (!localStorage.getItem(key) && localStorage.getItem(LEGACY_CHATS_KEY)) {
      const legacyData = localStorage.getItem(LEGACY_CHATS_KEY);
      if (legacyData) {
        localStorage.setItem(key, legacyData);
      }
    }
  } catch (_) {}
}

/**
 * Safely saves data to localStorage, catching QuotaExceededError and cleaning up base64 image data if necessary.
 */
function safeSetItem(key: string, value: string, userId: string = 'guest'): void {
  try {
    localStorage.setItem(key, value);
  } catch (e: any) {
    console.warn('LocalStorage quota exceeded. Trimming base64 attachments from cached messages...');
    try {
      const prefix = getMessagesKeyPrefix(userId);
      // Clear large base64 payload strings from older stored messages
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith(prefix) || k.startsWith(LEGACY_MESSAGES_KEY_PREFIX))) {
          const raw = localStorage.getItem(k);
          if (raw && (raw.includes('data:image') || raw.length > 500000)) {
            try {
              const parsed: Message[] = JSON.parse(raw);
              const cleansed = parsed.map((m) => {
                const copy = { ...m };
                if (copy.attachment && copy.attachment.data && copy.attachment.data.length > 2000) {
                  copy.attachment = {
                    ...copy.attachment,
                    data: '[Attachment Data Saved]',
                  };
                }
                return copy;
              });
              localStorage.setItem(k, JSON.stringify(cleansed));
            } catch (_) {}
          }
        }
      }
      // Retry setItem
      localStorage.setItem(key, value);
    } catch (err) {
      console.error('Critical storage quota issue:', err);
    }
  }
}

export const storageService = {
  /**
   * Retrieves all chat metadata sorted by updated_at descending
   */
  getChats(userId: string = 'guest'): Chat[] {
    try {
      migrateLegacyIfNeeded(userId);
      const data = localStorage.getItem(getChatsKey(userId));
      if (!data) return [];
      const chats: Chat[] = JSON.parse(data);
      return chats.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (e) {
      console.error('Failed to read chats from storage', e);
      return [];
    }
  },

  /**
   * Retrieves a single chat metadata by ID
   */
  getChat(chatId: string, userId: string = 'guest'): Chat | null {
    const chats = this.getChats(userId);
    return chats.find((c) => c.id === chatId) || null;
  },

  /**
   * Creates a new chat entry
   */
  createChat(title: string = 'New Flow', userId: string = 'guest'): Chat {
    const chats = this.getChats(userId);
    const newChat: Chat = {
      id: 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastMessageSnippet: '',
    };
    chats.unshift(newChat);
    safeSetItem(getChatsKey(userId), JSON.stringify(chats), userId);
    return newChat;
  },

  /**
   * Updates chat metadata (title, lastMessageSnippet, updatedAt)
   */
  updateChat(chatId: string, updates: Partial<Omit<Chat, 'id' | 'createdAt'>>, userId: string = 'guest'): Chat | null {
    const chats = this.getChats(userId);
    const index = chats.findIndex((c) => c.id === chatId);
    if (index === -1) return null;

    chats[index] = {
      ...chats[index],
      ...updates,
      updatedAt: Date.now(),
    };
    safeSetItem(getChatsKey(userId), JSON.stringify(chats), userId);
    return chats[index];
  },

  /**
   * Deletes a single chat and its messages
   */
  deleteChat(chatId: string, userId: string = 'guest'): boolean {
    const chats = this.getChats(userId).filter((c) => c.id !== chatId);
    safeSetItem(getChatsKey(userId), JSON.stringify(chats), userId);
    localStorage.removeItem(getMessagesKeyPrefix(userId) + chatId);
    return true;
  },

  /**
   * Deletes all chats and messages
   */
  deleteAllChats(userId: string = 'guest'): boolean {
    const chats = this.getChats(userId);
    for (const chat of chats) {
      localStorage.removeItem(getMessagesKeyPrefix(userId) + chat.id);
    }
    localStorage.removeItem(getChatsKey(userId));
    return true;
  },

  /**
   * Retrieves all messages for a specific chat
   */
  getMessages(chatId: string, userId: string = 'guest'): Message[] {
    try {
      const data = localStorage.getItem(getMessagesKeyPrefix(userId) + chatId);
      if (!data) return [];
      const messages: Message[] = JSON.parse(data);
      return messages.sort((a, b) => a.createdAt - b.createdAt);
    } catch (e) {
      console.error('Failed to read messages for chat ' + chatId, e);
      return [];
    }
  },

  /**
   * Appends or updates a message in a chat
   */
  createMessage(
    message: Omit<Message, 'id' | 'createdAt'> & { id?: string },
    userId: string = 'guest'
  ): Message {
    const messages = this.getMessages(message.chatId, userId);
    const newMessage: Message = {
      ...message,
      id: message.id || 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      createdAt: Date.now(),
    };

    const existingIndex = messages.findIndex((m) => m.id === newMessage.id);
    if (existingIndex >= 0) {
      messages[existingIndex] = newMessage;
    } else {
      messages.push(newMessage);
    }

    safeSetItem(getMessagesKeyPrefix(userId) + message.chatId, JSON.stringify(messages), userId);

    // Automatically update the parent chat snippet and timestamp
    const snippet = newMessage.content.slice(0, 60) + (newMessage.content.length > 60 ? '...' : '');
    this.updateChat(message.chatId, { lastMessageSnippet: snippet }, userId);

    return newMessage;
  },

  /**
   * Deletes messages from a chat (or all messages if no messageId passed)
   */
  deleteMessages(chatId: string, messageId?: string, userId: string = 'guest'): boolean {
    if (!messageId) {
      localStorage.removeItem(getMessagesKeyPrefix(userId) + chatId);
      return true;
    }
    const messages = this.getMessages(chatId, userId).filter((m) => m.id !== messageId);
    safeSetItem(getMessagesKeyPrefix(userId) + chatId, JSON.stringify(messages), userId);
    return true;
  },

  /**
   * Search across chat titles and message content
   */
  searchChats(query: string, userId: string = 'guest'): { chat: Chat; matchingMessages: Message[] }[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const chats = this.getChats(userId);
    const results: { chat: Chat; matchingMessages: Message[] }[] = [];

    for (const chat of chats) {
      const messages = this.getMessages(chat.id, userId);
      const titleMatch = chat.title.toLowerCase().includes(q);
      const matchingMsgs = messages.filter((m) => m.content.toLowerCase().includes(q));

      if (titleMatch || matchingMsgs.length > 0) {
        results.push({
          chat,
          matchingMessages: matchingMsgs,
        });
      }
    }

    return results;
  },
};

