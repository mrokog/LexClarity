/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DocumentAnalysis,
  QaResponse,
  ComparisonResult,
  TelemetryStats
} from '../types/legal';
import { getCachedQa, saveCachedQa } from '../storage/indexedDb';
import {
  clientFallbackAnalysis,
  clientFallbackQa,
  clientFallbackComparison
} from './clientFallback';

export class ApiError extends Error {
  statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export async function analyzeDocumentApi(
  documentText: string,
  fileName: string,
  fileSize: number
): Promise<{ data: any; tokensUsed: any }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

  try {
    const res = await fetch('/api/analyze-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentText, fileName, fileSize }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new ApiError(
        errorJson.error || `Server responded with status ${res.status}`,
        res.status
      );
    }

    const payload = await res.json();
    return { data: payload.data, tokensUsed: payload.tokensUsed };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    console.warn('Backend API request failed; activating client-side offline/static fallback:', err);
    // On static hosts like GitHub Pages or offline mode, provide client-side analysis
    const fallbackData = clientFallbackAnalysis(documentText, fileName);
    return {
      data: fallbackData,
      tokensUsed: {
        promptTokens: Math.round(documentText.length / 4),
        completionTokens: 250,
        totalTokens: Math.round(documentText.length / 4) + 250,
        latencyMs: 150
      }
    };
  }
}

export async function askDocumentQaApi(
  documentText: string,
  docHash: string,
  question: string
): Promise<QaResponse> {
  const normalizedQuestion = question.trim().toLowerCase();

  // Check local IndexedDB cache first
  const cached = await getCachedQa(docHash, normalizedQuestion);
  if (cached) {
    return cached;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  try {
    const res = await fetch('/api/qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentText, question: question.trim() }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new ApiError(errorJson.error || `Server returned ${res.status}`, res.status);
    }

    const payload = await res.json();
    const result: QaResponse = {
      ...payload.data,
      tokensUsed: payload.tokensUsed
    };

    // Save to cache
    await saveCachedQa(docHash, normalizedQuestion, result);
    return result;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    console.warn('QA API request failed; activating client-side offline/static fallback:', err);
    const fallbackResult = clientFallbackQa(documentText, question);
    await saveCachedQa(docHash, normalizedQuestion, fallbackResult);
    return fallbackResult;
  }
}

export async function compareDocumentsApi(
  docAText: string,
  docBText: string,
  docAName: string,
  docBName: string
): Promise<ComparisonResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docAText, docBText, docAName, docBName }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new ApiError(errorJson.error || `Comparison failed with status ${res.status}`, res.status);
    }

    const payload = await res.json();
    return {
      ...payload.data,
      tokensUsed: payload.tokensUsed
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    console.warn('Comparison API failed; activating client-side offline/static fallback:', err);
    return clientFallbackComparison(docAText, docBText, docAName, docBName);
  }
}

export async function getTelemetryStatsApi(): Promise<TelemetryStats> {
  try {
    const res = await fetch('/api/telemetry');
    if (!res.ok) throw new Error('Failed to fetch telemetry');
    return await res.json();
  } catch {
    return {
      totalRequests: 0,
      totalTokens: 0,
      avgLatencyMs: 0,
      model: 'gemini-3.8-flash',
      estimatedCostUsd: 0,
      cacheHits: 0
    };
  }
}
