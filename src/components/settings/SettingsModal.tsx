import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { VOICE_OPTIONS, APP_INFO } from '../../config/constants';
import { Settings } from '../../types';
import {
  Sun,
  Moon,
  Monitor,
  User as UserIcon,
  Download,
  Trash2,
  Info,
  Sliders,
  Volume2,
  Database,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { storageService } from '../../services/storageService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdateSettings: (newSettings: Partial<Settings>) => void;
  onDeleteAllChats: () => void;
}

type TabType = 'appearance' | 'chat' | 'voice' | 'account' | 'data' | 'about';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onDeleteAllChats,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('appearance');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exportedSuccess, setExportedSuccess] = useState(false);

  const { theme, setTheme } = useTheme();
  const { user, signInWithGoogle, signOutUser, authError, clearAuthError } = useAuth();

  const handleExportData = () => {
    const chats = storageService.getChats();
    const exportObject: Record<string, any> = {};

    for (const c of chats) {
      exportObject[c.id] = {
        meta: c,
        messages: storageService.getMessages(c.id),
      };
    }

    const jsonStr = JSON.stringify(exportObject, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `floai_chats_backup_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportedSuccess(true);
    setTimeout(() => setExportedSuccess(false), 2000);
  };

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Moon },
    { id: 'chat', label: 'Chat', icon: Sliders },
    { id: 'voice', label: 'Voice', icon: Volume2 },
    { id: 'account', label: 'Account', icon: UserIcon },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" maxWidth="max-w-3xl">
      <div className="flex flex-col md:flex-row min-h-[380px] -m-6">
        {/* Navigation Tabs Sidebar */}
        <div className="w-full md:w-56 bg-[#171717] border-r border-[#2A2A2A] p-3 flex md:flex-col space-x-1 md:space-x-0 md:space-y-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#2A2A2A] text-[#F5F5F5]'
                    : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#1E1E1E]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panel */}
        <div className="flex-1 p-6 bg-[#111111] overflow-y-auto">
          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-[#F5F5F5] mb-1">
                  Theme Preference
                </h4>
                <p className="text-xs text-[#737373] mb-4">
                  FloAI is natively optimized for a dark charcoal experience.
                </p>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      setTheme('dark');
                      onUpdateSettings({ theme: 'dark' });
                    }}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all ${
                      theme === 'dark'
                        ? 'border-[#F5F5F5] bg-[#1E1E1E] text-[#F5F5F5]'
                        : 'border-[#2A2A2A] bg-[#171717] text-[#A3A3A3] hover:text-[#F5F5F5]'
                    }`}
                  >
                    <Moon className="w-5 h-5" />
                    <span className="text-xs font-medium">Dark (Primary)</span>
                  </button>

                  <button
                    onClick={() => {
                      setTheme('light');
                      onUpdateSettings({ theme: 'light' });
                    }}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all ${
                      theme === 'light'
                        ? 'border-[#F5F5F5] bg-[#1E1E1E] text-[#F5F5F5]'
                        : 'border-[#2A2A2A] bg-[#171717] text-[#A3A3A3] hover:text-[#F5F5F5]'
                    }`}
                  >
                    <Sun className="w-5 h-5" />
                    <span className="text-xs font-medium">Light</span>
                  </button>

                  <button
                    onClick={() => {
                      setTheme('system');
                      onUpdateSettings({ theme: 'system' });
                    }}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all ${
                      theme === 'system'
                        ? 'border-[#F5F5F5] bg-[#1E1E1E] text-[#F5F5F5]'
                        : 'border-[#2A2A2A] bg-[#171717] text-[#A3A3A3] hover:text-[#F5F5F5]'
                    }`}
                  >
                    <Monitor className="w-5 h-5" />
                    <span className="text-xs font-medium">System</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chat Settings Tab */}
          {activeTab === 'chat' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#F5F5F5] mb-1">
                  Custom System Instructions
                </label>
                <p className="text-xs text-[#737373] mb-3">
                  Define custom instructions or personality directives for FloAI.
                </p>
                <textarea
                  value={settings.systemPrompt}
                  onChange={(e) => onUpdateSettings({ systemPrompt: e.target.value })}
                  rows={4}
                  className="w-full bg-[#171717] border border-[#2A2A2A] rounded-xl p-3 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#2A2A2A]">
                <div>
                  <h5 className="text-xs font-semibold text-[#F5F5F5]">
                    Auto-scroll to latest response
                  </h5>
                  <p className="text-[11px] text-[#737373]">
                    Automatically scroll the view as FloAI streams responses
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoScroll}
                  onChange={(e) => onUpdateSettings({ autoScroll: e.target.checked })}
                  className="w-4 h-4 accent-white rounded border-[#2A2A2A] cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Voice Tab */}
          {activeTab === 'voice' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-[#F5F5F5] mb-1">
                  AI Voice Output Selection
                </h4>
                <p className="text-xs text-[#737373] mb-4">
                  Select the voice persona for FloAI audio playback responses.
                </p>

                <div className="space-y-2">
                  {VOICE_OPTIONS.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => onUpdateSettings({ voiceName: v.id as any })}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                        settings.voiceName === v.id
                          ? 'border-[#F5F5F5] bg-[#1E1E1E] text-[#F5F5F5]'
                          : 'border-[#2A2A2A] bg-[#171717] text-[#A3A3A3] hover:text-[#F5F5F5]'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-semibold text-[#F5F5F5]">{v.name}</p>
                        <p className="text-[11px] text-[#737373]">{v.gender} voice persona</p>
                      </div>
                      {settings.voiceName === v.id && (
                        <Check className="w-4 h-4 text-[#F5F5F5]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#171717] border border-[#2A2A2A]">
                <div className="flex items-center space-x-4 mb-4">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-12 h-12 rounded-full border border-[#2A2A2A]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#2A2A2A] flex items-center justify-center text-[#F5F5F5]">
                      <UserIcon className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-semibold text-[#F5F5F5]">
                      {user.displayName}
                    </h4>
                    <p className="text-xs text-[#737373]">
                      {user.isGuest ? 'Guest Session' : user.email}
                    </p>
                  </div>
                </div>

                {authError && (
                  <div className="p-3 mb-4 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-200 text-xs flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p>{authError}</p>
                      <button
                        onClick={clearAuthError}
                        className="text-[11px] underline mt-1 text-amber-300 cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {user.isGuest ? (
                  <button
                    onClick={signInWithGoogle}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#F5F5F5] hover:bg-white text-[#0A0A0A] font-semibold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                  >
                    <span>Continue with Google</span>
                  </button>
                ) : (
                  <button
                    onClick={signOutUser}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#2A2A2A] hover:bg-[#3A3A3A] text-red-400 font-semibold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                  >
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-[#F5F5F5] mb-1">
                  Export Conversation History
                </h4>
                <p className="text-xs text-[#737373] mb-3">
                  Download a JSON backup of all your local chats and messages.
                </p>
                <button
                  onClick={handleExportData}
                  className="px-4 py-2 bg-[#171717] hover:bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl text-xs font-semibold text-[#F5F5F5] flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  {exportedSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-green-400">Exported Backup!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Export Backup (.json)</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-4 border-t border-[#2A2A2A]">
                <h4 className="text-sm font-semibold text-red-400 mb-1">
                  Clear All History
                </h4>
                <p className="text-xs text-[#737373] mb-3">
                  Permanently remove all local conversations. This action cannot be undone.
                </p>

                {confirmDelete ? (
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        onDeleteAllChats();
                        setConfirmDelete(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-red-900/60 hover:bg-red-800 text-red-100 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Yes, Delete Everything
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="px-4 py-2 rounded-xl bg-[#2A2A2A] hover:bg-[#3A3A3A] text-[#A3A3A3] text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="px-4 py-2 bg-red-950/40 hover:bg-red-950/80 border border-red-900/50 text-red-400 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete All Chats</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#171717] border border-[#2A2A2A] rounded-xl">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#2A2A2A] flex items-center justify-center text-sm font-bold text-[#F5F5F5]">
                    F
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#F5F5F5]">
                      {APP_INFO.name} v{APP_INFO.version}
                    </h4>
                    <p className="text-xs text-[#A3A3A3]">{APP_INFO.tagline}</p>
                  </div>
                </div>
                <p className="text-xs text-[#737373] leading-relaxed mt-2">
                  {APP_INFO.description}
                </p>
              </div>

              <div className="p-4 bg-[#171717]/60 border border-[#2A2A2A] rounded-xl space-y-2 text-xs">
                <h5 className="font-semibold text-[#F5F5F5]">Storage Architecture</h5>
                <p className="text-[#A3A3A3] leading-relaxed">
                  FloAI uses an abstracted local storage repository layer (<code className="text-[#F5F5F5]">storageService</code>). This architecture is modular so future persistence providers (such as Google Sheets) can seamlessly replace local storage.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
