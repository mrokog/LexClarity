/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EvidenceLevel } from '../types/legal';

interface Props {
  level: EvidenceLevel;
  className?: string;
  showTooltip?: boolean;
}

export const EvidenceBadge: React.FC<Props> = ({ level, className = '', showTooltip = true }) => {
  const configs: Record<EvidenceLevel, { label: string; icon: string; bg: string; text: string; border: string; desc: string }> = {
    explicit: {
      label: 'EXPLICIT',
      icon: '✓',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-800 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800/60',
      desc: 'Directly and verbatim stated in the document text.'
    },
    inferred: {
      label: 'INFERRED',
      icon: '~',
      bg: 'bg-sky-50 dark:bg-sky-950/40',
      text: 'text-sky-800 dark:text-sky-300',
      border: 'border-sky-200 dark:border-sky-800/60',
      desc: 'Reasonable plain-language interpretation derived from document context.'
    },
    unclear: {
      label: 'UNCLEAR',
      icon: '?',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800/60',
      desc: 'The document does not provide sufficient information or is ambiguous.'
    }
  };

  const current = configs[level] || configs.inferred;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium tracking-wide uppercase border font-mono ${current.bg} ${current.text} ${current.border} ${className}`}
      title={showTooltip ? current.desc : undefined}
      aria-label={`Evidence level: ${current.label} (${current.desc})`}
    >
      <span className="font-bold" aria-hidden="true">{current.icon}</span>
      <span>{current.label}</span>
    </span>
  );
};
