/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  SYSTEM_ROLE_BASE,
  buildDocumentAnalysisPrompt,
  buildQaPrompt,
  buildComparisonPrompt
} from '../../server/prompts';

describe('Prompt Construction & Security Boundaries', () => {
  it('enforces untrusted document isolation in <document_data> tags', () => {
    const doc = '1. Tenant shall pay rent.';
    const prompt = buildDocumentAnalysisPrompt(doc);

    expect(prompt).toContain('<document_data>');
    expect(prompt).toContain('</document_data>');
    expect(prompt).toContain(doc);
  });

  it('contains strict ethical and legal outcome safety rules in SYSTEM_ROLE_BASE', () => {
    expect(SYSTEM_ROLE_BASE).toContain('LexClarity provides general legal information');
    expect(SYSTEM_ROLE_BASE).toContain('You must NEVER present yourself as a lawyer');
    expect(SYSTEM_ROLE_BASE).toContain('You must NEVER predict legal outcomes');
    expect(SYSTEM_ROLE_BASE).toContain('Potential Concern');
    expect(SYSTEM_ROLE_BASE).toContain('explicit');
    expect(SYSTEM_ROLE_BASE).toContain('inferred');
    expect(SYSTEM_ROLE_BASE).toContain('unclear');
  });

  it('instructs QA prompt to refuse outcome prediction queries', () => {
    const qaPrompt = buildQaPrompt('Sample Contract', 'Will I win this case in court?');
    expect(qaPrompt).toContain('SAFETY & OUTCOME PREDICTION REFUSAL RULE');
    expect(qaPrompt).toContain('isOutcomeRefusal');
    expect(qaPrompt).toContain("The document alone isn't enough to determine that outcome");
  });

  it('instructs comparison prompt to remain neutral without declaring a contract better or worse', () => {
    const compPrompt = buildComparisonPrompt('Doc A', 'Doc B', 'Lease A', 'Lease B');
    expect(compPrompt).toContain('NEVER declare one document legally "better" or "worse"');
  });
});
