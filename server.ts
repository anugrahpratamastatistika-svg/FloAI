import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;
const HOST = '0.0.0.0';

// Helper functions to guarantee modern, supported Gemini models are used at runtime
function getChatModel(): string {
  const envModel = process.env.AI_CHAT_MODEL;
  if (!envModel || envModel.includes('2.5') || envModel.includes('gemini-2.5')) {
    return 'gemini-3.6-flash';
  }
  return envModel;
}

function getTTSModel(): string {
  const envModel = process.env.AI_TTS_MODEL;
  if (!envModel || envModel.includes('2.5')) {
    return 'gemini-3.1-flash-tts-preview';
  }
  return envModel;
}

// Helper to parse GenAI SDK errors and check for quota / rate limits
function parseErrorDetails(err: any): { isQuota: boolean; message: string; retryDelaySeconds: number } {
  let errStr = '';
  if (typeof err === 'string') {
    errStr = err;
  } else if (err?.message) {
    errStr = err.message;
  } else {
    errStr = JSON.stringify(err || {});
  }

  let isQuota =
    err?.status === 429 ||
    err?.status === 'RESOURCE_EXHAUSTED' ||
    errStr.includes('429') ||
    errStr.includes('RESOURCE_EXHAUSTED') ||
    errStr.includes('quota') ||
    errStr.includes('exceeded your current quota');

  let cleanMsg = errStr;
  let retryDelaySeconds = 30;

  if (errStr.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(errStr);
      if (parsed?.error?.message) {
        cleanMsg = parsed.error.message;
      }
      if (parsed?.error?.status === 'RESOURCE_EXHAUSTED' || parsed?.error?.code === 429) {
        isQuota = true;
      }
      if (parsed?.error?.details) {
        for (const detail of parsed.error.details) {
          if (detail?.retryDelay) {
            const match = String(detail.retryDelay).match(/(\d+)s/);
            if (match) {
              retryDelaySeconds = parseInt(match[1], 10) || 30;
            }
          }
        }
      }
    } catch {
      // ignore JSON parse error
    }
  }

  if (isQuota) {
    cleanMsg = `Image generation rate limit reached. Please wait ${retryDelaySeconds} seconds before generating another image.`;
  }

  return { isQuota, message: cleanMsg, retryDelaySeconds };
}

/**
 * Helper to wrap 16-bit PCM raw audio in a 44-byte RIFF WAV header for browser HTML5 Audio playback.
 */
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const chunkSize = 36 + dataSize;

  header.write('RIFF', 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();

  // Increase payload limit to support base64 image uploads
  app.use(express.json({ limit: '25mb' }));

  // Health check route
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      models: {
        chat: getChatModel(),
        tts: getTTSModel(),
      },
    });
  });

  // Chat completion route with streaming and multimodal attachment support
  app.post('/api/chat', async (req, res) => {
    try {
      const ai = getAIClient();
      const { messages, systemInstruction, stream = true } = req.body;
      const chatModel = getChatModel();

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required' });
      }

      // Convert messages to Gemini API format
      const formattedContents = messages.map((msg: any) => {
        const parts: any[] = [];

        // If message has text
        if (msg.content) {
          parts.push({ text: msg.content });
        }

        // If message has attachments (e.g. images)
        if (msg.attachments && Array.isArray(msg.attachments)) {
          for (const att of msg.attachments) {
            if (att.data && att.mimeType) {
              // Extract base64 if it includes data URL prefix
              const cleanBase64 = att.data.includes(',')
                ? att.data.split(',')[1]
                : att.data;
              parts.push({
                inlineData: {
                  mimeType: att.mimeType,
                  data: cleanBase64,
                },
              });
            }
          }
        }

        return {
          role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
          parts,
        };
      });

      const config: any = {
        systemInstruction:
          systemInstruction ||
          'You are FloAI, an advanced, highly capable, and empathetic general-purpose AI assistant. Your motto is "Your AI. Your Flow." Provide clear, elegant, helpful, and accurate answers across coding, writing, mathematics, science, and creative tasks. Respond in the user\'s language.',
      };

      console.log(`[Chat] Sending request to model: ${chatModel}`);

      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const responseStream = await ai.models.generateContentStream({
          model: chatModel,
          contents: formattedContents,
          config,
        });

        for await (const chunk of responseStream) {
          const text = chunk.text || '';
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }

        res.write('data: [DONE]\n\n');
        return res.end();
      } else {
        const response = await ai.models.generateContent({
          model: chatModel,
          contents: formattedContents,
          config,
        });

        return res.json({ text: response.text });
      }
    } catch (error: any) {
      console.error('Error in /api/chat:', error);
      const isModelNotFound =
        error?.status === 404 ||
        error?.message?.includes('404') ||
        error?.message?.includes('not found') ||
        error?.message?.includes('no longer available');

      const errorMessage = isModelNotFound
        ? 'The selected Gemini model is unavailable. FloAI is updating its model configuration.'
        : error.message || 'Failed to generate response from FloAI backend';

      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
        return res.end();
      }
      return res.status(isModelNotFound ? 404 : 500).json({
        error: errorMessage,
      });
    }
  });

  // Text-to-Speech (AI Voice Output) endpoint
  app.post('/api/tts', async (req, res) => {
    try {
      const ai = getAIClient();
      const { text, voiceName = 'Kore' } = req.body;
      const ttsModel = getTTSModel();

      if (!text) {
        return res.status(400).json({ error: 'Text is required for TTS generation' });
      }

      const response = await ai.models.generateContent({
        model: ttsModel,
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const audioPart = response.candidates?.[0]?.content?.parts?.[0];
      const rawBase64Pcm = audioPart?.inlineData?.data;

      if (!rawBase64Pcm) {
        return res.status(500).json({ error: 'No audio data returned from TTS engine' });
      }

      // Convert raw 24kHz PCM to WAV with header for browser HTML5 audio playback
      const pcmBuffer = Buffer.from(rawBase64Pcm, 'base64');
      const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
      const base64Wav = wavBuffer.toString('base64');

      return res.json({
        audio: base64Wav,
        mimeType: 'audio/wav',
      });
    } catch (error: any) {
      console.error('Error in /api/tts:', error);
      return res.status(500).json({
        error: error.message || 'Failed to generate AI voice audio',
      });
    }
  });

  // Catch-all 404 for /api/* routes to prevent falling through to Vite SPA HTML
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.originalUrl} not found` });
  });

  // Global Express JSON error handler for API routes
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Express Global Error]', err);
    if (res.headersSent) {
      return next(err);
    }
    if (req.path.startsWith('/api/')) {
      return res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
      });
    }
    next(err);
  });

  // Vite middleware for dev or static serving for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`FloAI server running on http://${HOST}:${PORT}`);
  });
}

startServer();
