/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { validateLegalFile, sanitizeExtractedText, MAX_FILE_SIZE_BYTES } from '../../src/parsers/fileParser';

describe('Legal File Validation & Parsing', () => {
  it('accepts valid text and docx files within size limits', () => {
    const file = new File(['Contract content here'], 'lease_agreement.txt', {
      type: 'text/plain'
    });
    const result = validateLegalFile(file);
    expect(result.valid).toBe(true);
    expect(result.sanitizedName).toBe('lease_agreement.txt');
  });

  it('rejects files exceeding 5MB size limit', () => {
    const oversized = new Uint8Array(MAX_FILE_SIZE_BYTES + 1024);
    const file = new File([oversized], 'huge_contract.pdf', {
      type: 'application/pdf'
    });
    const result = validateLegalFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds the maximum allowed limit of 5.0 MB');
  });

  it('rejects empty files (0 bytes)', () => {
    const file = new File([], 'empty.txt', { type: 'text/plain' });
    const result = validateLegalFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('File is empty');
  });

  it('rejects unsupported executable or archive extensions', () => {
    const file = new File(['malicious'], 'script.exe', { type: 'application/x-msdownload' });
    const result = validateLegalFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Unsupported file format');
  });

  it('sanitizes text by stripping null bytes and excess empty lines', () => {
    const raw = 'Section 1\x00\x08\x0C\n\n\n\nSection 2';
    const cleaned = sanitizeExtractedText(raw);
    expect(cleaned).not.toContain('\x00');
    expect(cleaned).not.toContain('\n\n\n\n');
    expect(cleaned).toBe('Section 1\n\nSection 2');
  });
});
