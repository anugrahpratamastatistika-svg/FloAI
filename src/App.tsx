import React, { useState, useRef, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { WelcomeScreen } from './components/chat/WelcomeScreen';
import { ChatMessage } from './components/chat/ChatMessage';
import { ChatInput } from './components/chat/ChatInput';
import { SearchModal } from './components/search/SearchModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { useChat } from './hooks/useChat';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { DEFAULT_SETTINGS } from './config/constants';
import { Settings, Attachment } from './types';

function MainApp() {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('floai_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { user } = useAuth();

  const {
    chats,
    activeChatId,
    messages,
    isGenerating,
    createNewChat,
    selectChat,
    renameChat,
    deleteChat,
    deleteAllChats,
    sendMessage,
    stopGeneration,
  } = useChat(user?.uid || 'guest', settings.systemPrompt);

  const {
    activeMessageId,
    isPlaying: isPlayingTTS,
    isLoadingAudio: isLoadingTTS,
    playTTS,
    stopAudio,
  } = useAudioPlayer();

  const updateSettings = (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('floai_settings', JSON.stringify(updated));
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    if (settings.autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, settings.autoScroll]);

  // Global Keyboard Shortcuts (Ctrl+K for New Chat, Ctrl+F for Search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        createNewChat();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNewChat]);

  const activeChat = chats.find((c) => c.id === activeChatId);

  const handleSendMessage = (
    content: string,
    attachment?: Attachment,
    messageType?: 'text' | 'voice'
  ) => {
    sendMessage(content, attachment, messageType);
  };

  const handleSelectSuggestion = (prompt: string) => {
    sendMessage(prompt, undefined, 'text');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0A0A0A] text-[#F5F5F5] font-sans antialiased">
      {/* Left Sidebar */}
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={selectChat}
        onNewChat={createNewChat}
        onRenameChat={renameChat}
        onDeleteChat={deleteChat}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#0A0A0A]">
        {/* Top Header */}
        <Header
          chatTitle={activeChat?.title}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onNewChat={createNewChat}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Message Stream Viewport */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <WelcomeScreen onSelectSuggestion={handleSelectSuggestion} />
          ) : (
            <div className="py-4 space-y-1">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  userName={user.displayName || 'You'}
                  userPhotoUrl={user.photoURL}
                  onPlayTTS={(msgId, text) => playTTS(msgId, text, settings.voiceName)}
                  isPlayingTTS={isPlayingTTS && activeMessageId === message.id}
                  isLoadingTTS={isLoadingTTS && activeMessageId === message.id}
                  onStopTTS={stopAudio}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Input Area */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isGenerating={isGenerating}
          onStopGeneration={stopGeneration}
        />
      </div>

      {/* Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectChat={selectChat}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        onDeleteAllChats={deleteAllChats}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
