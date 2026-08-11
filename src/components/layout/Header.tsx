import React from 'react';
import { Menu, Plus, Search, Settings as SettingsIcon } from 'lucide-react';
import { APP_INFO } from '../../config/constants';

interface HeaderProps {
  chatTitle?: string;
  onOpenMobileMenu: () => void;
  onNewChat: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  chatTitle,
  onOpenMobileMenu,
  onNewChat,
  onOpenSearch,
  onOpenSettings,
}) => {
  return (
    <header className="h-14 border-b border-[#1E1E1E] bg-[#0A0A0A]/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-20 text-[#F5F5F5]">
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#171717] rounded-xl transition-colors cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-[#1E1E1E] border border-[#2A2A2A] flex items-center justify-center font-bold text-xs text-[#F5F5F5]">
            F
          </div>
          <h1 className="text-sm font-semibold text-[#F5F5F5] truncate max-w-[200px] sm:max-w-xs">
            {chatTitle || APP_INFO.name}
          </h1>
        </div>
      </div>

      <div className="flex items-center space-x-1 sm:space-x-2">
        <button
          onClick={onOpenSearch}
          className="p-2 text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#171717] rounded-xl transition-colors cursor-pointer"
          title="Search conversation history"
        >
          <Search className="w-4 h-4" />
        </button>

        <button
          onClick={onNewChat}
          className="p-2 text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#171717] rounded-xl transition-colors cursor-pointer"
          title="New Chat"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#171717] rounded-xl transition-colors cursor-pointer"
          title="Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
