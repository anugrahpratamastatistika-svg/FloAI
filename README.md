# FloAI

FloAI is a sleek, modern, AI-powered conversational assistant built with a full-stack Express + Vite + React architecture powered by the Google Gemini API (`@google/genai`) and Firebase. It provides an intuitive, responsive dark interface for seamless multimodal interactions, including text chat, image analysis, and voice input/output.

---

## Features

- **Guest Mode:** Start chatting immediately without requiring initial user sign-in.
- **Google Sign-In:** Authenticate seamlessly via Firebase Google Sign-In for persistent cross-device account management.
- **Gemini AI Chat:** High-performance conversational AI powered by Gemini (`gemini-3.6-flash`).
- **Chat History:** Create, manage, search, and delete saved conversation flows.
- **Image Upload & Image Understanding:** Multimodal vision analysis capable of describing, analyzing, and answering questions about uploaded images.
- **Voice Input:** Speech-to-text recording support directly inside the prompt field.
- **Voice Output:** Natural AI voice synthesis (`gemini-3.1-flash-tts-preview`) to hear assistant responses aloud.
- **Firebase Authentication:** Secure user identity management supporting Guest access and Google OAuth.
- **Cloud Firestore:** Robust data persistence with UID-isolated collections enforcing private user access.
- **Responsive Dark Interface:** Elegant charcoal dark theme optimized for desktop and mobile viewports.

---

## Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide React, Motion
- **Backend Server:** Express.js, TypeScript, ESBuild, TSX
- **AI SDK:** `@google/genai` (Google Gen AI SDK)
- **Database & Auth:** Firebase (Authentication & Cloud Firestore)
- **Build Tools:** Vite, TypeScript

---

## Architecture

```
User
  ↓
FloAI (React + Express Server Proxy)
  ↓
Gemini API (@google/genai)
  ↓
Firebase Authentication / Firestore
```

- All Gemini API calls pass through server-side Express endpoints (`/api/chat`, `/api/tts`), ensuring API keys are kept safe.
- Cloud Firestore securely stores authenticated users' profiles, conversation metadata, and message histories.
- Strict Firestore security rules enforce strict data isolation so users can only read and write their own records.

---

## Installation

Follow these steps to set up and run FloAI locally:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/flo-ai.git
   cd flo-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create the required environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Add API credentials through environment variables:**
   Edit `.env` and configure your `GEMINI_API_KEY` obtained from Google AI Studio.

5. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## Environment Variables

The project uses the following environment variables:

- `GEMINI_API_KEY`: Server-side secret key for Google Gemini API.
- `AI_CHAT_MODEL`: Primary Gemini model for conversational chat (e.g., `gemini-3.6-flash`).
- `AI_TTS_MODEL`: Gemini model used for voice text-to-speech generation (e.g., `gemini-3.1-flash-tts-preview`).
- `PORT`: Network port for the Express server (default: `3000`).

*Note: Never include real API keys or secret values in public files or `.env.example`.*

---

## Security

- **Server-Side API Keys:** `GEMINI_API_KEY` is restricted strictly to backend execution and is never exposed to the client bundle.
- **Ignored Secrets:** Secret environment files (`.env`, `.env.local`), private keys (`*.pem`, `*.key`), and service account credentials are explicitly listed in `.gitignore`.
- **Firestore Security Rules:** Access rules strictly enforce authentication (`request.auth != null`) and ownership checks (`request.auth.uid == userId` or `resource.data.userId == request.auth.uid`). Users can only read, create, update, or delete their own private data.

---

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for details.

