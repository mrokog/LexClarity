/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DocumentAnalysis } from '../types/legal';
import { X, Printer, Copy, Check, Download, ShieldCheck } from 'lucide-react';

interface Props {
  document: DocumentAnalysis;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportBriefModal: React.FC<Props> = ({ document, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateMarkdownBrief = () => {
    const concerns = document.clauses.filter((c) => c.category === 'Potential Concern' || c.isImportant);

    return `# LEXCLARITY — LAWYER PREPARATION BRIEF
Document: ${document.metadata.title || document.fileName}
Generated: ${new Date().toLocaleDateString()}

NOTICE: This document was prepared with LexClarity for informational and organizational assistance. It does not constitute legal advice.

============================================================
1. DOCUMENT OVERVIEW
- Type: ${document.metadata.documentType || 'Not specified'}
- Parties: ${document.metadata.parties?.join(' & ') || 'Not specified'}
- Effective Date: ${document.metadata.effectiveDate || 'Not specified'}
- Term: ${document.metadata.termOrDuration || 'Not specified'}
- Financial Consideration: ${document.metadata.financialSummary || 'Standard consideration'}
- Termination Terms: ${document.metadata.terminationSummary || 'Standard termination terms'}

============================================================
2. IMPORTANT CLAUSES & POTENTIAL CONCERNS
${concerns
  .map(
    (c, idx) =>
      `[${idx + 1}] Category: ${c.category} (Evidence: ${c.evidenceLevel.toUpperCase()})
- Source: ${c.sourceLocation || 'Clause'}
- Text: "${c.originalText}"
- Plain Meaning: ${c.meaningStandard}
- Why it matters: ${c.whyItMatters}
${c.unclearOrMissing ? `- Missing / Unclear: ${c.unclearOrMissing}` : ''}`
  )
  .join('\n\n')}

============================================================
3. QUESTIONS TO DISCUSS WITH LEGAL COUNSEL
${document.lawyerQuestions
  .map(
    (lq, idx) =>
      `[Q${idx + 1}] ${lq.topic}
Question: "${lq.question}"
Reason: ${lq.reasonToAsk}
Context clause: "${lq.contextClause}"`
  )
  .join('\n\n')}

============================================================
4. OPERATIONAL ACTION ITEMS & DEADLINES
${document.actions
  .map(
    (a, idx) =>
      `[ ] ${a.action} (Deadline: ${a.deadline || 'Prior to execution'}) [Source: ${a.sourceClause}]`
  )
  .join('\n')}
`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMarkdownBrief());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = generateMarkdownBrief();
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `Lawyer_Brief_${document.metadata.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-neutral-700 dark:text-neutral-300" />
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 font-serif">
              Export Lawyer Consultation Brief
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded transition-colors cursor-pointer"
            aria-label="Close export modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Brief Preview */}
        <div className="p-6 overflow-y-auto font-mono text-xs text-neutral-800 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-950 flex-1 leading-relaxed whitespace-pre-wrap select-text border-y border-neutral-200/60 dark:border-neutral-800">
          {generateMarkdownBrief()}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-white dark:bg-neutral-900 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] text-neutral-500">
            Print or download this structured brief to review directly with your attorney.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded transition-colors cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>Download .md</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              <Printer size={14} />
              <span>Print Brief</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
