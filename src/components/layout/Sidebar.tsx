import React, { useState } from 'react';
import { Chat } from '../../types';
import {
  Plus,
  Search,
  Settings as SettingsIcon,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  User as UserIcon,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { APP_INFO } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  onDeleteChat: (chatId: string) => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  onOpenSearch,
  onOpenSettings,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);

  const { user, signOutUser, signInWithGoogle } = useAuth();

  const handleStartRename = (e: React.MouseEvent, chat: Chat) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditTitleInput(chat.title);
  };

  const handleSaveRename = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (editTitleInput.trim()) {
      onRenameChat(chatId, editTitleInput.trim());
    }
    setEditingChatId(null);
  };

  const handleConfirmDelete = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    onDeleteChat(chatId);
    setDeletingChatId(null);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0D0D0D] border-r border-[#2A2A2A] text-[#F5F5F5] w-64 flex-shrink-0 select-none">
      {/* Header with FloAI Branding */}
      <div className="p-4 border-b border-[#1E1E1E] flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-[#2A2A2A] to-[#141414] border border-[#3A3A3A] flex items-center justify-center font-bold text-sm text-[#F5F5F5] shadow-md">
            F
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-[#F5F5F5]">
              {APP_INFO.name}
            </h2>
            <p className="text-[10px] font-medium text-[#737373] tracking-widest uppercase">
              {APP_INFO.tagline}
            </p>
          </div>
        </div>
      </div>

      {/* Action Controls: New Chat & Search */}
      <div className="p-3 space-y-2">
        <button
          onClick={() => {
            onNewChat();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full py-2.5 px-3.5 bg-[#171717] hover:bg-[#1E1E1E] border border-[#2A2A2A] hover:border-[#3A3A3A] rounded-xl text-xs font-semibold text-[#F5F5F5] flex items-center justify-between transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center space-x-2">
            <Plus className="w-4 h-4 text-[#F5F5F5] group-hover:scale-110 transition-transform" />
            <span>New Chat</span>
          </div>
          <span className="text-[10px] text-[#737373] font-mono">Ctrl+K</span>
        </button>

        <button
          onClick={() => {
            onOpenSearch();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full py-2 px-3.5 bg-transparent hover:bg-[#141414] text-[#A3A3A3] hover:text-[#F5F5F5] rounded-xl text-xs font-medium flex items-center space-x-2 transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4" />
          <span>Search Flows...</span>
        </button>
      </div>

      <div className="px-3 py-1">
        <div className="h-[1px] bg-[#1E1E1E] w-full" />
      </div>

      {/* Conversation History List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        <div className="px-3 py-1 text-[11px] font-semibold text-[#737373] uppercase tracking-wider">
          Conversations
        </div>

        {chats.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-[#737373]">
            No conversations yet
          </div>
        ) : (
          chats.map((chat) => {
            const isActive = activeChatId === chat.id;
            const isEditing = editingChatId === chat.id;
            const isDeleting = deletingChatId === chat.id;

            return (
              <div
                key={chat.id}
                onClick={() => {
                  onSelectChat(chat.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-[#1E1E1E] text-[#F5F5F5] border border-[#2A2A2A]'
                    : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#141414]'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-[#737373]" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitleInput}
                      onChange={(e) => setEditTitleInput(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-[#111111] border border-[#3A3A3A] text-xs text-[#F5F5F5] px-1.5 py-0.5 rounded focus:outline-none w-full"
                      autoFocus
                    />
                  ) : (
                    <span className="truncate">{chat.title}</span>
                  )}
                </div>

                {/* Inline Actions */}
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                  {isEditing ? (
                    <button
                      onClick={(e) => handleSaveRename(e, chat.id)}
                      className="p-1 hover:text-green-400 text-[#A3A3A3]"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  ) : isDeleting ? (
                    <div className="flex items-center space-x-1 bg-red-950/80 px-1.5 py-0.5 rounded border border-red-800">
                      <button
                        onClick={(e) => handleConfirmDelete(e, chat.id)}
                        className="text-[10px] font-bold text-red-300 hover:text-white"
                      >
                        Delete
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingChatId(null);
                        }}
                        className="text-[#A3A3A3] hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={(e) => handleStartRename(e, chat)}
                        className="p-1 hover:text-[#F5F5F5] text-[#737373]"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingChatId(chat.id);
                        }}
                        className="p-1 hover:text-red-400 text-[#737373]"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Settings & Account Bar */}
      <div className="p-3 border-t border-[#1E1E1E] space-y-2 bg-[#0A0A0A]">
        <button
          onClick={() => {
            onOpenSettings();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full py-2 px-3 hover:bg-[#171717] text-[#A3A3A3] hover:text-[#F5F5F5] rounded-xl text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <SettingsIcon className="w-4 h-4" />
            <span>Settings</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#737373]" />
        </button>

        {/* User Account / Guest Mode Profile */}
        <div className="pt-2 border-t border-[#1E1E1E]/60 flex items-center justify-between px-2">
          <div className="flex items-center space-x-2.5 min-w-0">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-7 h-7 rounded-full border border-[#2A2A2A]"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#1E1E1E] border border-[#2A2A2A] flex items-center justify-center text-[#F5F5F5]">
                <UserIcon className="w-3.5 h-3.5 text-[#A3A3A3]" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#F5F5F5] truncate">
                {user.displayName}
              </p>
              <p className="text-[10px] text-[#737373] truncate">
                {user.isGuest ? 'Guest Mode' : user.email}
              </p>
            </div>
          </div>

          {!user.isGuest ? (
            <button
              onClick={signOutUser}
              className="p-1.5 text-[#737373] hover:text-red-400 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="text-[10px] font-semibold text-[#A3A3A3] hover:text-[#F5F5F5] px-2 py-1 bg-[#171717] hover:bg-[#2A2A2A] border border-[#2A2A2A] rounded-lg transition-colors cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block h-full">{sidebarContent}</div>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-64 h-full animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
