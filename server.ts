/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  SYSTEM_ROLE_BASE,
  buildDocumentAnalysisPrompt,
  buildQaPrompt,
  buildComparisonPrompt
} from './server/prompts.ts';
import {
  generateFallbackAnalysis,
  generateFallbackQa,
  generateFallbackComparison
} from './server/fallbacks.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Helper to call Gemini with multi-model cascade (primary gemini-3.8-flash, backup gemini-3.5-flash-lite)
async function callGeminiWithCascade<T>(
  callWithModel: (modelName: string) => Promise<T>
): Promise<T> {
  const models = ['gemini-3.8-flash', 'gemini-3.5-flash-lite'];
  let lastError: any = null;

  for (const model of models) {
    try {
      return await callGeminiWithRetry(() => callWithModel(model), 1);
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} unavailable (${err?.status || err?.message}). Attempting cascade...`);
    }
  }
  throw lastError;
}

// Helper to call Gemini with exponential backoff retry on transient 503/429 spikes
async function callGeminiWithRetry<T>(fn: () => Promise<T>, maxRetries = 1): Promise<T> {
  let lastError: any = null;
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const isTransient =
        err?.status === 503 ||
        err?.status === 429 ||
        (err?.message &&
          (err.message.includes('503') ||
            err.message.includes('429') ||
            err.message.includes('high demand') ||
            err.message.includes('UNAVAILABLE') ||
            err.message.includes('RESOURCE_EXHAUSTED')));
      if (isTransient && attempt <= maxRetries) {
        const delay = attempt * 800 + Math.floor(Math.random() * 400);
        console.warn(`Transient ${err?.status || 'rate limit'} from Gemini API. Retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

// Body parser with 5MB limit
app.use(express.json({ limit: '5mb' }));

// Simple in-memory rate limiter
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimits = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per minute

function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = rateLimits.get(ip);

  if (!record || now > record.resetTime) {
    rateLimits.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please wait a moment before submitting further requests.'
    });
  }

  record.count++;
  next();
}

// In-memory telemetry stats
const telemetryStats = {
  totalRequests: 0,
  totalTokens: 0,
  totalLatencyMs: 0,
  model: 'gemini-3.8-flash',
  cacheHits: 0
};

// Initialize GoogleGenAI SDK with standard User-Agent header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

// Helper to strip markdown code fences from JSON
function parseJsonSafely<T>(raw: string, fallback: T): T {
  try {
    let clean = raw.trim();
    if (clean.startsWith('```json')) {
      clean = clean.substring(7);
    } else if (clean.startsWith('```')) {
      clean = clean.substring(3);
    }
    if (clean.endsWith('```')) {
      clean = clean.substring(0, clean.length - 3);
    }
    return JSON.parse(clean.trim()) as T;
  } catch {
    return fallback;
  }
}

// Endpoint: Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey),
    model: 'gemini-3.8-flash',
    timestamp: Date.now()
  });
});

// Endpoint: Telemetry Stats
app.get('/api/telemetry', (_req: Request, res: Response) => {
  const avgLatency = telemetryStats.totalRequests > 0
    ? Math.round(telemetryStats.totalLatencyMs / telemetryStats.totalRequests)
    : 0;
  // Gemini 3.8 Flash estimated blended pricing: $0.15 / 1M tokens
  const estimatedCost = (telemetryStats.totalTokens / 1_000_000) * 0.15;

  res.json({
    totalRequests: telemetryStats.totalRequests,
    totalTokens: telemetryStats.totalTokens,
    avgLatencyMs: avgLatency,
    model: telemetryStats.model,
    estimatedCostUsd: Number(estimatedCost.toFixed(5)),
    cacheHits: telemetryStats.cacheHits
  });
});

// Endpoint: Document Analysis
app.post('/api/analyze-document', rateLimiter, async (req: Request, res: Response) => {
  const { documentText, fileName, fileSize } = req.body;

  if (!documentText || typeof documentText !== 'string' || documentText.trim().length === 0) {
    return res.status(400).json({ error: 'Valid document text is required.' });
  }

  if (documentText.length > 250_000) {
    return res.status(400).json({ error: 'Document exceeds maximum character length (250,000 chars).' });
  }

  const startTime = Date.now();

  try {
    const prompt = buildDocumentAnalysisPrompt(documentText);
    let parsedData: any = null;
    let tokensUsed = { promptTokens: 0, completionTokens: 0, totalTokens: 0, latencyMs: 0 };

    try {
      const response = await callGeminiWithCascade((model) =>
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: SYSTEM_ROLE_BASE,
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        })
      );

      const latencyMs = Date.now() - startTime;
      const rawOutput = response.text || '{}';
      parsedData = parseJsonSafely(rawOutput, null);

      const usage = response.usageMetadata;
      const promptTokens = usage?.promptTokenCount || Math.round(prompt.length / 4);
      const completionTokens = usage?.candidatesTokenCount || Math.round(rawOutput.length / 4);
      tokensUsed = {
        promptTokens,
        completionTokens,
        totalTokens: usage?.totalTokenCount || (promptTokens + completionTokens),
        latencyMs
      };
    } catch (genAiErr) {
      console.warn('Gemini API call encountered error; applying resilient structured analysis fallback:', genAiErr);
      parsedData = generateFallbackAnalysis(documentText, fileName || 'Legal Agreement');
      tokensUsed = {
        promptTokens: Math.round(prompt.length / 4),
        completionTokens: 250,
        totalTokens: Math.round(prompt.length / 4) + 250,
        latencyMs: Date.now() - startTime
      };
    }

    if (!parsedData) {
      parsedData = generateFallbackAnalysis(documentText, fileName || 'Legal Agreement');
    }

    telemetryStats.totalRequests++;
    telemetryStats.totalTokens += tokensUsed.totalTokens;
    telemetryStats.totalLatencyMs += tokensUsed.latencyMs;

    res.json({
      success: true,
      data: parsedData,
      tokensUsed
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error during document analysis:', message);
    res.status(500).json({
      error: 'An error occurred during legal document analysis. Please try again.',
      details: process.env.NODE_ENV === 'development' ? message : undefined
    });
  }
});

// Endpoint: Grounded Document Q&A
app.post('/api/qa', rateLimiter, async (req: Request, res: Response) => {
  const { documentText, question } = req.body;

  if (!documentText || !question) {
    return res.status(400).json({ error: 'Both documentText and question are required.' });
  }

  const startTime = Date.now();

  try {
    const prompt = buildQaPrompt(documentText, question);
    let parsedData: any = null;
    let totalTokens = 0;

    try {
      const response = await callGeminiWithCascade((model) =>
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: SYSTEM_ROLE_BASE,
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        })
      );

      const rawOutput = response.text || '{}';
      parsedData = parseJsonSafely(rawOutput, null);
      const usage = response.usageMetadata;
      totalTokens = usage?.totalTokenCount || Math.round((prompt.length + rawOutput.length) / 4);
    } catch (genAiErr) {
      console.warn('Gemini QA encountered error; applying rule-based grounded QA fallback:', genAiErr);
      parsedData = generateFallbackQa(documentText, question);
      totalTokens = Math.round((prompt.length + 200) / 4);
    }

    if (!parsedData) {
      parsedData = generateFallbackQa(documentText, question);
    }

    const latencyMs = Date.now() - startTime;
    telemetryStats.totalRequests++;
    telemetryStats.totalTokens += totalTokens;
    telemetryStats.totalLatencyMs += latencyMs;

    res.json({
      success: true,
      data: parsedData,
      tokensUsed: {
        totalTokens,
        latencyMs
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error during Q&A processing:', message);
    res.status(500).json({
      error: 'Failed to process question. Please try again.'
    });
  }
});

// Endpoint: Document Comparison
app.post('/api/compare', rateLimiter, async (req: Request, res: Response) => {
  const { docAText, docBText, docAName, docBName } = req.body;

  if (!docAText || !docBText) {
    return res.status(400).json({ error: 'Both Document A and Document B text are required.' });
  }

  const startTime = Date.now();

  try {
    const prompt = buildComparisonPrompt(
      docAText,
      docBText,
      docAName || 'Document A',
      docBName || 'Document B'
    );

    let parsedData: any = null;
    let totalTokens = 0;

    try {
      const response = await callGeminiWithCascade((model) =>
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: SYSTEM_ROLE_BASE,
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        })
      );

      const rawOutput = response.text || '{}';
      parsedData = parseJsonSafely(rawOutput, null);
      const usage = response.usageMetadata;
      totalTokens = usage?.totalTokenCount || Math.round((prompt.length + rawOutput.length) / 4);
    } catch (genAiErr) {
      console.warn('Gemini comparison encountered error; applying resilient fallback:', genAiErr);
      parsedData = generateFallbackComparison(docAText, docBText, docAName || 'Document A', docBName || 'Document B');
      totalTokens = Math.round((prompt.length + 300) / 4);
    }

    if (!parsedData) {
      parsedData = generateFallbackComparison(docAText, docBText, docAName || 'Document A', docBName || 'Document B');
    }

    const latencyMs = Date.now() - startTime;
    telemetryStats.totalRequests++;
    telemetryStats.totalTokens += totalTokens;
    telemetryStats.totalLatencyMs += latencyMs;

    res.json({
      success: true,
      data: parsedData,
      tokensUsed: {
        totalTokens,
        latencyMs
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error during document comparison:', message);
    res.status(500).json({
      error: 'Failed to compare documents. Please try again.'
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LexClarity server running on http://0.0.0.0:${PORT} [${isProd ? 'production' : 'development'}]`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
