import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../../types';
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  Bot,
  User as UserIcon,
  AlertCircle,
} from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  userName?: string;
  userPhotoUrl?: string | null;
  onPlayTTS?: (messageId: string, text: string) => void;
  isPlayingTTS?: boolean;
  isLoadingTTS?: boolean;
  onStopTTS?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  userName = 'You',
  userPhotoUrl,
  onPlayTTS,
  isPlayingTTS = false,
  isLoadingTTS = false,
  onStopTTS,
}) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);

  const isUser = message.role === 'user';

  const handleCopyText = () => {
    navigator.clipboard.writeText(message.content);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  return (
    <div
      className={`py-5 px-4 sm:px-6 transition-colors ${
        isUser ? 'bg-transparent' : 'bg-[#111111]/40 border-y border-[#1E1E1E]/50'
      }`}
    >
      <div className="max-w-4xl mx-auto flex space-x-4">
        {/* Avatar */}
        <div className="flex-shrink-0 mt-0.5">
          {isUser ? (
            userPhotoUrl ? (
              <img
                src={userPhotoUrl}
                alt={userName}
                className="w-8 h-8 rounded-full border border-[#2A2A2A] object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#1E1E1E] border border-[#2A2A2A] flex items-center justify-center text-[#F5F5F5] font-medium text-xs">
                <UserIcon className="w-4 h-4 text-[#A3A3A3]" />
              </div>
            )
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-b from-[#2A2A2A] to-[#171717] border border-[#3A3A3A] flex items-center justify-center text-[#F5F5F5] shadow-sm">
              <Bot className="w-4 h-4 text-[#F5F5F5]" />
            </div>
          )}
        </div>

        {/* Message Content Container */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header Name & Timestamp */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A3A3A3]">
              {isUser ? userName : 'FloAI'}
            </span>
            <span className="text-[11px] text-[#737373]">
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* User Image Attachment */}
          {message.attachment && (
            <div className="mb-3 max-w-sm rounded-xl overflow-hidden border border-[#2A2A2A] bg-[#171717]">
              <img
                src={message.attachment.data.startsWith('data:') ? message.attachment.data : `data:${message.attachment.mimeType};base64,${message.attachment.data}`}
                alt={message.attachment.name || 'Attachment'}
                className="w-full max-h-72 object-contain bg-[#0A0A0A]"
              />
              <div className="p-2 text-xs text-[#A3A3A3] truncate border-t border-[#2A2A2A]">
                {message.attachment.name}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {message.error && (
            <div className="p-3 rounded-xl bg-red-950/30 border border-red-900/50 text-red-200 text-xs flex items-center justify-between my-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{message.error}</span>
              </div>
            </div>
          )}

          {/* Main Message Text Body */}
          {isUser ? (
            <div className="text-sm text-[#F5F5F5] whitespace-pre-wrap leading-relaxed">
              {message.content}
            </div>
          ) : (
            <div className="text-sm text-[#F5F5F5] leading-relaxed markdown-body">
              {message.isStreaming && !message.content ? (
                <div className="flex items-center space-x-2 py-2 text-[#A3A3A3]">
                  <div className="w-2 h-2 rounded-full bg-[#A3A3A3] animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-[#A3A3A3] animate-pulse delay-150"></div>
                  <div className="w-2 h-2 rounded-full bg-[#A3A3A3] animate-pulse delay-300"></div>
                  <span className="text-xs text-[#737373] ml-2 font-mono">FloAI is generating...</span>
                </div>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeString = String(children).replace(/\n$/, '');

                      if (!inline) {
                        return (
                          <div className="my-4 rounded-xl border border-[#2A2A2A] bg-[#171717] overflow-hidden text-xs">
                            <div className="flex items-center justify-between px-4 py-2 bg-[#1E1E1E] border-b border-[#2A2A2A] text-[#A3A3A3]">
                              <span className="font-mono text-[11px] uppercase tracking-wider">
                                {match ? match[1] : 'code'}
                              </span>
                              <button
                                onClick={() => handleCopyCode(codeString, Math.random())}
                                className="flex items-center space-x-1 hover:text-[#F5F5F5] transition-colors cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy code</span>
                              </button>
                            </div>
                            <div className="p-4 overflow-x-auto font-mono text-[#F5F5F5] leading-relaxed">
                              <code>{children}</code>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <code
                          className="px-1.5 py-0.5 rounded bg-[#1E1E1E] border border-[#2A2A2A] font-mono text-xs text-[#F5F5F5]"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    table({ children }) {
                      return (
                        <div className="overflow-x-auto my-4 rounded-lg border border-[#2A2A2A]">
                          <table className="w-full text-left text-xs border-collapse">
                            {children}
                          </table>
                        </div>
                      );
                    },
                    th({ children }) {
                      return (
                        <th className="bg-[#1E1E1E] p-2.5 font-semibold border-b border-[#2A2A2A] text-[#F5F5F5]">
                          {children}
                        </th>
                      );
                    },
                    td({ children }) {
                      return (
                        <td className="p-2.5 border-b border-[#2A2A2A]/50 text-[#A3A3A3]">
                          {children}
                        </td>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          )}

          {/* Action Bar (Copy Text, Voice Output TTS) */}
          {!isUser && message.content && !message.isStreaming && (
            <div className="flex items-center space-x-3 pt-2 text-[#737373]">
              <button
                onClick={handleCopyText}
                className="flex items-center space-x-1 hover:text-[#F5F5F5] text-xs transition-colors cursor-pointer"
                title="Copy message"
              >
                {copiedMessage ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-green-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {/* Voice Output TTS Speaker Button */}
              {onPlayTTS && (
                <button
                  onClick={() => {
                    if (isPlayingTTS) {
                      onStopTTS?.();
                    } else {
                      onPlayTTS(message.id, message.content);
                    }
                  }}
                  disabled={isLoadingTTS}
                  className={`flex items-center space-x-1.5 text-xs transition-colors cursor-pointer ${
                    isPlayingTTS
                      ? 'text-[#F5F5F5] font-medium'
                      : 'hover:text-[#F5F5F5]'
                  }`}
                  title="Read aloud with FloAI Voice"
                >
                  {isLoadingTTS ? (
                    <div className="w-3.5 h-3.5 border-2 border-t-transparent border-[#F5F5F5] rounded-full animate-spin" />
                  ) : isPlayingTTS ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span className="text-amber-400 font-mono">Stop Voice</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Listen</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
