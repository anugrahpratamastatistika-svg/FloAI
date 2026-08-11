import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Search as SearchIcon, MessageSquare, ArrowRight } from 'lucide-react';
import { Chat, Message } from '../../types';
import { storageService } from '../../services/storageService';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectChat,
}) => {
  const [query, setQuery] = useState('');

  const results = query.trim() ? storageService.searchChats(query) : [];

  const handleSelect = (chatId: string) => {
    onSelectChat(chatId);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Search Flows">
      <div className="space-y-4">
        {/* Search Input Field */}
        <div className="relative">
          <SearchIcon className="absolute left-3.5 top-3 w-4 h-4 text-[#A3A3A3]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversation titles or message text..."
            className="w-full bg-[#171717] border border-[#2A2A2A] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F5F5F5] placeholder-[#737373] focus:outline-none focus:border-[#555555]"
            autoFocus
          />
        </div>

        {/* Search Results List */}
        <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
          {query.trim() && results.length === 0 && (
            <div className="py-8 text-center text-sm text-[#737373]">
              No conversations found matching "{query}"
            </div>
          )}

          {!query.trim() && (
            <div className="py-8 text-center text-xs text-[#737373]">
              Type a word or phrase to search your conversation history
            </div>
          )}

          {results.map(({ chat, matchingMessages }) => (
            <div
              key={chat.id}
              onClick={() => handleSelect(chat.id)}
              className="p-3.5 bg-[#171717] hover:bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl cursor-pointer transition-colors group"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-[#A3A3A3]" />
                  <span className="text-sm font-semibold text-[#F5F5F5] group-hover:text-white">
                    {chat.title}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#737373] group-hover:text-[#F5F5F5] transition-colors" />
              </div>

              {matchingMessages.length > 0 ? (
                <div className="mt-2 space-y-1 pl-6">
                  {matchingMessages.slice(0, 2).map((m) => (
                    <p key={m.id} className="text-xs text-[#A3A3A3] line-clamp-1 italic">
                      "{m.content}"
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#737373] pl-6 line-clamp-1">
                  {chat.lastMessageSnippet || 'No messages'}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
