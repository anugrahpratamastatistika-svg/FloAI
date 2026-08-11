import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Paperclip,
  Mic,
  MicOff,
  Square,
  X,
} from 'lucide-react';
import { Attachment } from '../../types';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

interface ChatInputProps {
  onSendMessage: (
    content: string,
    attachment?: Attachment,
    messageType?: 'text' | 'voice'
  ) => void;
  isGenerating: boolean;
  onStopGeneration: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isGenerating,
  onStopGeneration,
}) => {
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<Attachment | undefined>(undefined);
  const [dragOver, setDragOver] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    isListening,
    transcript,
    hasSupport: speechSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  // Update input text when speech recognition transcript updates
  useEffect(() => {
    if (transcript) {
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (isGenerating) {
      onStopGeneration();
      return;
    }

    const trimmed = input.trim();
    if (!trimmed && !attachment) return;

    onSendMessage(
      trimmed || 'Analyze image',
      attachment,
      'text'
    );

    setInput('');
    setAttachment(undefined);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAttachment({
        id: 'att_' + Date.now(),
        name: file.name,
        mimeType: file.type,
        data: base64,
      });
    };
    reader.readAsDataURL(file);

    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setAttachment({
          id: 'att_' + Date.now(),
          name: file.name,
          mimeType: file.type,
          data: base64,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 pt-1">
      {/* Container with drag and drop */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative bg-[#111111] border ${
          dragOver ? 'border-[#F5F5F5]' : 'border-[#2A2A2A]'
        } rounded-2xl shadow-xl transition-all duration-200 overflow-hidden`}
      >
        {/* Attachment preview bar */}
        {attachment && (
          <div className="p-3 bg-[#171717] border-b border-[#2A2A2A] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={attachment.data}
                alt={attachment.name}
                className="w-10 h-10 rounded-lg object-cover border border-[#2A2A2A]"
              />
              <div className="text-xs">
                <p className="text-[#F5F5F5] font-medium truncate max-w-xs">
                  {attachment.name}
                </p>
                <p className="text-[#737373]">Attached image to analyze</p>
              </div>
            </div>
            <button
              onClick={() => setAttachment(undefined)}
              className="p-1.5 text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#2A2A2A] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Text Area Input */}
        <div className="p-3 flex items-end space-x-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask FloAI anything or upload an image to analyze... (Shift + Enter for new line)"
            rows={1}
            className="flex-1 bg-transparent border-0 focus:ring-0 text-[#F5F5F5] placeholder-[#737373] text-sm resize-none max-h-44 py-2 px-2 focus:outline-none"
          />

          {/* Action Toolbar */}
          <div className="flex items-center space-x-1.5 pb-1">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
            />

            {/* Attach Image Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#1E1E1E] rounded-xl transition-colors cursor-pointer"
              title="Upload an image to analyze with FloAI"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Microphone Voice Input Button */}
            {speechSupported && (
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isListening
                    ? 'bg-red-950/60 text-red-400 border border-red-800 animate-pulse'
                    : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#1E1E1E]'
                }`}
                title={isListening ? 'Stop recording voice' : 'Record voice input'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            {/* Send / Stop Generation Button */}
            {isGenerating ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="p-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-[#F5F5F5] rounded-xl transition-colors cursor-pointer"
                title="Stop response generation"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() && !attachment}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  input.trim() || attachment
                    ? 'bg-[#F5F5F5] text-[#0A0A0A] hover:bg-white font-medium shadow'
                    : 'bg-[#1E1E1E] text-[#737373] cursor-not-allowed'
                }`}
                title="Send message to FloAI"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      <p className="text-[11px] text-[#737373] text-center mt-2 font-sans">
        FloAI can make mistakes. Verify important factual details.
      </p>
    </div>
  );
};
