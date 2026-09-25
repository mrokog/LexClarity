/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Check, Loader2, Circle } from 'lucide-react';

interface Props {
  fileName: string;
  fileSize: number;
}

interface Step {
  id: string;
  label: string;
  description: string;
}

const STEPS: Step[] = [
  { id: 'extract', label: 'Extracting text', description: 'Reading text content, removing control bytes, normalizing clauses.' },
  { id: 'sections', label: 'Identifying sections', description: 'Detecting headers, numbering, defined terms, and structural hierarchy.' },
  { id: 'clauses', label: 'Understanding clauses', description: 'Translating legal syntax into plain-language meaning and evidence levels.' },
  { id: 'concerns', label: 'Finding important items', description: 'Isolating potential concerns, financial liabilities, and termination terms.' },
  { id: 'brief', label: 'Preparing your brief', description: 'Compiling 5-minute executive brief, action checklist, and lawyer questions.' }
];

export const ProcessingView: React.FC<Props> = ({ fileName, fileSize }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    // Progressively advance through transparent progress stages while AI completes analysis
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-xl mx-auto px-4 py-16 sm:py-24">
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-xs">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 mb-3">
            <Loader2 className="animate-spin" size={20} />
          </div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 font-serif">
            Analyzing Legal Document
          </h2>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
            {fileName} · {(fileSize / 1024).toFixed(1)} KB
          </p>
        </div>

        {/* Step-by-step transparent progress list */}
        <div className="space-y-4 max-w-md mx-auto" aria-live="polite">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const isUpcoming = idx > currentStepIndex;

            return (
              <div
                key={step.id}
                className={`flex items-start gap-3.5 transition-all duration-300 ${
                  isCurrent ? 'opacity-100 scale-[1.01]' : isCompleted ? 'opacity-90' : 'opacity-40'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                      <Check size={12} strokeWidth={2.5} />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-5 h-5 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center animate-pulse">
                      <Loader2 size={12} className="animate-spin" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-neutral-300 dark:border-neutral-700 text-neutral-400 flex items-center justify-center">
                      <Circle size={8} />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs sm:text-sm font-semibold ${
                        isCurrent
                          ? 'text-neutral-900 dark:text-neutral-100'
                          : isCompleted
                          ? 'text-neutral-700 dark:text-neutral-300'
                          : 'text-neutral-400'
                      }`}
                    >
                      {step.label}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] text-neutral-500 font-mono animate-pulse">
                        processing...
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-normal mt-0.5">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800 text-center">
          <p className="text-[11px] text-neutral-400">
            Enforcing strict evidence boundaries: isolating explicit terms from AI plain-language derivations.
          </p>
        </div>
      </div>
    </div>
  );
};
