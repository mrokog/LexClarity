/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface Props {
  variant?: 'banner' | 'compact';
}

export const LegalDisclaimerBanner: React.FC<Props> = ({ variant = 'banner' }) => {
  const [expanded, setExpanded] = useState(false);

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 py-1 px-3 bg-neutral-100/70 dark:bg-neutral-900/50 rounded border border-neutral-200/60 dark:border-neutral-800">
        <ShieldCheck size={14} className="text-neutral-500 shrink-0" aria-hidden="true" />
        <span>
          <strong>General Legal Information:</strong> LexClarity does not provide legal advice or replace a qualified attorney.
        </span>
      </div>
    );
  }

  return (
    <aside
      aria-label="Legal Information Notice"
      className="bg-neutral-100/90 dark:bg-neutral-900/90 border-b border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs py-2 px-4 sm:px-6 transition-all"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={16} className="text-neutral-600 dark:text-neutral-400 shrink-0" aria-hidden="true" />
          <p className="leading-tight">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              General Legal Information & Document Assistance Only.
            </span>{' '}
            LexClarity helps you understand documents and prepare questions. It is not a law firm, does not provide legal advice, and cannot predict legal outcomes.
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 underline decoration-dotted transition-colors self-start sm:self-auto cursor-pointer"
          aria-expanded={expanded}
        >
          <span>{expanded ? 'Less info' : 'Important boundaries'}</span>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {expanded && (
        <div className="max-w-7xl mx-auto mt-2.5 pt-2.5 border-t border-neutral-200/60 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-start gap-1.5">
            <AlertCircle size={14} className="text-neutral-500 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              <strong>Not Legal Advice:</strong> Material is for general educational and organizational assistance. Applicable law depends heavily on local jurisdiction and specific facts.
            </span>
          </div>
          <div className="flex items-start gap-1.5">
            <AlertCircle size={14} className="text-neutral-500 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              <strong>No Lawyer-Client Relationship:</strong> Interacting with this software does not create an attorney-client relationship. Always consult a qualified lawyer before making legal decisions.
            </span>
          </div>
          <div className="flex items-start gap-1.5">
            <AlertCircle size={14} className="text-neutral-500 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              <strong>Privacy Conscious:</strong> Documents remain stored locally in your browser's IndexedDB. No server database is used for persistent document storage.
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
