import React from 'react';
import { WELCOME_SUGGESTIONS, APP_INFO } from '../../config/constants';
import { Sparkles, Code, Image, Palette, BookOpen, Lightbulb } from 'lucide-react';

interface WelcomeScreenProps {
  onSelectSuggestion: (prompt: string) => void;
}

const iconMap: Record<string, React.ElementType> = {
  Sparkles,
  Code,
  Image,
  Palette,
  BookOpen,
  Lightbulb,
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectSuggestion }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 py-8 max-w-4xl mx-auto text-center">
      {/* FloAI Minimalist Logo Emblem */}
      <div className="mb-6 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-[#1E1E1E] to-[#111111] border border-[#2A2A2A] flex items-center justify-center shadow-lg mb-4">
          <span className="text-2xl font-bold tracking-tight text-[#F5F5F5]">F</span>
        </div>
        <h1 className="text-4xl font-bold text-[#F5F5F5] tracking-tight mb-2">
          {APP_INFO.name}
        </h1>
        <p className="text-sm font-medium text-[#A3A3A3] uppercase tracking-widest mb-3">
          {APP_INFO.tagline}
        </p>
        <p className="text-base text-[#737373] max-w-md">
          {APP_INFO.description}
        </p>
      </div>

      {/* Suggestion Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 w-full mt-6 text-left">
        {WELCOME_SUGGESTIONS.map((item, idx) => {
          const IconComp = iconMap[item.icon] || Sparkles;
          return (
            <button
              key={idx}
              onClick={() => onSelectSuggestion(item.prompt)}
              className="group p-4 bg-[#111111] hover:bg-[#1E1E1E] border border-[#2A2A2A] hover:border-[#3A3A3A] rounded-xl transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#555555]"
            >
              <div>
                <div className="flex items-center space-x-2 mb-2 text-[#A3A3A3] group-hover:text-[#F5F5F5] transition-colors">
                  <IconComp className="w-4 h-4 text-[#A3A3A3]" />
                  <span className="text-sm font-semibold text-[#F5F5F5]">
                    {item.title}
                  </span>
                </div>
                <p className="text-xs text-[#737373] line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>
              <div className="mt-3 text-[11px] text-[#A3A3A3] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                Click to start &rarr;
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
