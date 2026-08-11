import { Settings } from '../types';

export const APP_INFO = {
  name: 'FloAI',
  tagline: 'Your AI. Your Flow.',
  description: 'Chat, create, explore, and solve with FloAI.',
  version: '1.0.0',
};

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  systemPrompt:
    'You are FloAI, an advanced, highly capable, empathetic AI assistant created to help users flow through writing, coding, analysis, and problem-solving.',
  voiceName: 'Kore',
  autoScroll: true,
  autoPlayVoice: false,
  chatModel: 'gemini-3.6-flash',
  ttsModel: 'gemini-3.1-flash-tts-preview',
};

export const VOICE_OPTIONS = [
  { id: 'Kore', name: 'Kore (Balanced & Warm)', gender: 'Female' },
  { id: 'Zephyr', name: 'Zephyr (Bright & Friendly)', gender: 'Female' },
  { id: 'Puck', name: 'Puck (Lively & Natural)', gender: 'Male' },
  { id: 'Fenrir', name: 'Fenrir (Deep & Resonant)', gender: 'Male' },
  { id: 'Charon', name: 'Charon (Calm & Authoritative)', gender: 'Male' },
];

export const WELCOME_SUGGESTIONS = [
  {
    icon: 'Sparkles',
    title: 'Explain something difficult',
    description: 'Quantum computing or general relativity in simple metaphors',
    prompt: 'Can you explain quantum computing and entanglement using simple everyday metaphors?',
  },
  {
    icon: 'Code',
    title: 'Help me code',
    description: 'Write a React hook for infinite scroll or debounced search',
    prompt: 'Write a clean, production-ready React custom hook for debounced API search with TypeScript.',
  },
  {
    icon: 'Image',
    title: 'Analyze an image',
    description: 'Upload a diagram, photo, graph, or document for instant AI breakdown',
    prompt: 'I will upload an image. Please inspect it carefully and break down its key elements and details.',
  },
  {
    icon: 'BookOpen',
    title: 'Help me study',
    description: 'Generate practice quiz questions for data structures or history',
    prompt: 'Create a 5-question interactive multiple-choice study quiz on core Data Structures & Algorithms.',
  },
  {
    icon: 'Lightbulb',
    title: 'Brainstorm an idea',
    description: 'Ideas for a full-stack startup or creative writing hook',
    prompt: 'Brainstorm 5 innovative product ideas combining real-time audio AI and productivity workflows.',
  },
];
