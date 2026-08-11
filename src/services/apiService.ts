import { Message } from '../types';

async function safeParseJsonResponse(response: Response, fallbackErrorMsg: string) {
  const text = await response.text();
  if (!text) {
    if (!response.ok) throw new Error(`${fallbackErrorMsg} (${response.status})`);
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    if (text.trim().startsWith('<')) {
      throw new Error(`Server returned HTML instead of JSON (${response.status}). Check API route configuration.`);
    }
    throw new Error(`${fallbackErrorMsg} (${response.status})`);
  }
}

export const apiService = {
  async checkHealth() {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) return { status: 'error', hasApiKey: false };
      return await res.json();
    } catch {
      return { status: 'offline', hasApiKey: false };
    }
  },

  async sendChatMessage(
    messages: Message[],
    systemInstruction?: string,
    onChunk?: (chunkText: string) => void
  ): Promise<string> {
    const formattedMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
      attachments: m.attachment ? [m.attachment] : undefined,
    }));

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: formattedMessages,
        systemInstruction,
        stream: Boolean(onChunk),
      }),
    });

    if (!response.ok) {
      const errData = await safeParseJsonResponse(response, 'Failed to communicate with FloAI');
      throw new Error(errData.error || `HTTP error ${response.status}`);
    }

    if (onChunk && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.text) {
              fullText += parsed.text;
              onChunk(fullText);
            }
          } catch (e) {
            // ignore partial JSON parses
          }
        }
      }
      return fullText;
    } else {
      const data = await safeParseJsonResponse(response, 'Failed to read chat response');
      return data.text || '';
    }
  },

  async generateTTS(text: string, voiceName: string = 'Kore'): Promise<{ audio: string; mimeType: string }> {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceName }),
    });

    const data = await safeParseJsonResponse(response, 'Voice synthesis service error');

    if (!response.ok) {
      throw new Error(data.error || `Voice synthesis failed (${response.status})`);
    }

    return data;
  },
};

