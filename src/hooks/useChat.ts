import { useState, useEffect, useCallback, useRef } from 'react';
import { Chat, Message, Attachment } from '../types';
import { storageService } from '../services/storageService';
import { apiService } from '../services/apiService';

export function useChat(userId: string = 'guest', systemPrompt?: string) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{ chat: Chat; matchingMessages: Message[] }[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load all chats for current userId
  const refreshChats = useCallback(() => {
    const list = storageService.getChats(userId);
    setChats(list);
    return list;
  }, [userId]);

  useEffect(() => {
    setActiveChatId(null);
    setMessages([]);
    refreshChats();
  }, [userId, refreshChats]);

  // Load messages when active chat or userId changes
  useEffect(() => {
    if (activeChatId) {
      const msgs = storageService.getMessages(activeChatId, userId);
      setMessages(msgs);
    } else {
      setMessages([]);
    }
  }, [activeChatId, userId]);

  // Execute search when searchQuery or userId changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const res = storageService.searchChats(searchQuery, userId);
      setSearchResults(res);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, userId]);

  // Create a new chat
  const createNewChat = useCallback((title: string = 'New Flow') => {
    const newChat = storageService.createChat(title, userId);
    refreshChats();
    setActiveChatId(newChat.id);
    return newChat;
  }, [refreshChats, userId]);

  // Select a chat
  const selectChat = useCallback((chatId: string) => {
    setActiveChatId(chatId);
  }, []);

  // Rename a chat
  const renameChat = useCallback((chatId: string, newTitle: string) => {
    storageService.updateChat(chatId, { title: newTitle }, userId);
    refreshChats();
  }, [refreshChats, userId]);

  // Delete a chat
  const deleteChat = useCallback((chatId: string) => {
    storageService.deleteChat(chatId, userId);
    const updatedChats = refreshChats();
    if (activeChatId === chatId) {
      if (updatedChats.length > 0) {
        setActiveChatId(updatedChats[0].id);
      } else {
        setActiveChatId(null);
      }
    }
  }, [activeChatId, refreshChats, userId]);

  // Delete all chats
  const deleteAllChats = useCallback(() => {
    storageService.deleteAllChats(userId);
    refreshChats();
    setActiveChatId(null);
    setMessages([]);
  }, [refreshChats, userId]);

  // Stop current AI response generation
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  }, []);

  // Send a message (Text, Image multimodal analysis, or Voice)
  const sendMessage = useCallback(
    async (
      content: string,
      attachment?: Attachment,
      messageType: 'text' | 'voice' = 'text'
    ) => {
      let targetChatId = activeChatId;

      // If no active chat, create one automatically
      if (!targetChatId) {
        const autoTitle = content.trim().slice(0, 30) || 'New Flow';
        const newChat = storageService.createChat(autoTitle, userId);
        targetChatId = newChat.id;
        setActiveChatId(targetChatId);
        refreshChats();
      }

      // Add user message to storage and state
      const userMsg = storageService.createMessage({
        chatId: targetChatId,
        role: 'user',
        content,
        attachment,
        messageType,
      }, userId);

      setMessages((prev) => [...prev, userMsg]);

      // Auto title chat if it's the first message and still titled 'New Flow'
      const currentChat = storageService.getChat(targetChatId, userId);
      if (currentChat && currentChat.title === 'New Flow') {
        const generatedTitle = content.trim().slice(0, 32) || 'FloAI Flow';
        storageService.updateChat(targetChatId, { title: generatedTitle }, userId);
        refreshChats();
      }

      setIsGenerating(true);

      // Standard Text or Multimodal AI Chat response with streaming
      const assistantPlaceholder = storageService.createMessage({
        chatId: targetChatId,
        role: 'assistant',
        content: '',
        messageType: 'text',
        isStreaming: true,
      }, userId);

      setMessages((prev) => [...prev, assistantPlaceholder]);

      try {
        // Fetch all current messages for context
        const allMessages = storageService.getMessages(targetChatId, userId);

        let accumulatedText = '';

        await apiService.sendChatMessage(
          allMessages.slice(0, -1), // omit placeholder
          systemPrompt,
          (chunkText) => {
            accumulatedText = chunkText;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantPlaceholder.id
                  ? { ...m, content: chunkText, isStreaming: true }
                  : m
              )
            );
          }
        );

        const updatedFinal: Message = {
          ...assistantPlaceholder,
          content: accumulatedText || 'No response returned.',
          isStreaming: false,
        };

        storageService.createMessage(updatedFinal, userId);
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantPlaceholder.id ? updatedFinal : m))
        );
      } catch (err: any) {
        console.error('Chat generation error:', err);
        const rawErr = err.message || '';
        const isModelErr = rawErr.includes('404') || rawErr.includes('not found') || rawErr.includes('unavailable');
        const userFacingContent = isModelErr
          ? 'The selected Gemini model is unavailable. FloAI is updating its model configuration.'
          : `I encountered an issue generating a response: ${rawErr || 'Service unavailable'}.`;

        const errorMsg: Message = {
          ...assistantPlaceholder,
          content: userFacingContent,
          error: err.message,
          isStreaming: false,
        };
        storageService.createMessage(errorMsg, userId);
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantPlaceholder.id ? errorMsg : m))
        );
      } finally {
        setIsGenerating(false);
        refreshChats();
      }
    },
    [activeChatId, refreshChats, systemPrompt, userId]
  );

  return {
    chats,
    activeChatId,
    messages,
    isGenerating,
    searchQuery,
    searchResults,
    setSearchQuery,
    createNewChat,
    selectChat,
    renameChat,
    deleteChat,
    deleteAllChats,
    sendMessage,
    stopGeneration,
  };
}
