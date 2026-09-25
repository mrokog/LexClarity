/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mammoth from 'mammoth';

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedName?: string;
}

export function validateLegalFile(file: File): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum allowed limit of 5.0 MB.`
    };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty (0 bytes).' };
  }

  const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.md', '.rtf'];
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported file format "${ext}". Supported formats: PDF, DOCX, TXT, MD.`
    };
  }

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  return { valid: true, sanitizedName };
}

export async function computeDocumentHash(text: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  } catch {
    // Fallback hash
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }
}

export function sanitizeExtractedText(raw: string): string {
  // Strip null bytes and non-printable control characters (except newline, tab, carriage return)
  let clean = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  // Normalize consecutive blank lines to at most two
  clean = clean.replace(/\n{3,}/g, '\n\n');
  return clean.trim();
}

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

  if (ext === '.txt' || ext === '.md' || ext === '.rtf') {
    const text = await file.text();
    return sanitizeExtractedText(text);
  }

  if (ext === '.docx') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return sanitizeExtractedText(result.value);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to extract text from DOCX file: ${message}`);
    }
  }

  if (ext === '.pdf') {
    // Try browser-side PDF text extraction or server fallback
    try {
      // Dynamic import to prevent SSR/bundle issues
      const pdfjs = await import('pdfjs-dist');
      // If GlobalWorkerOptions is present, set worker
      if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
      }

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
      const doc = await loadingTask.promise;
      let fullText = '';

      for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
        const page = await doc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageStrings = textContent.items
          // @ts-expect-error item has str property
          .map((item: { str?: string }) => item.str || '')
          .join(' ');
        fullText += `\n[--- Page ${pageNum} ---]\n` + pageStrings + '\n';
      }

      if (fullText.trim().length > 0) {
        return sanitizeExtractedText(fullText);
      }
    } catch {
      // If pdf.js client extraction fails, try reading as raw text / binary stream
    }

    // Secondary fallback: read buffer as text representation
    const text = await file.text();
    const cleaned = sanitizeExtractedText(text);
    if (cleaned.length > 50) {
      return cleaned;
    }

    throw new Error('PDF text could not be extracted directly in the browser. Please copy and paste the document text into the editor.');
  }

  return await file.text();
}
