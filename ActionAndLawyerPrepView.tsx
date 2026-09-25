/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  DocumentAnalysis,
  ActionItem,
  LawyerQuestionItem
} from '../types/legal';
import { saveActionsToDb, getActionsFromDb } from '../storage/indexedDb';
import { CategoryBadge } from './CategoryBadge';
import { EvidenceBadge } from './EvidenceBadge';
import {
  CheckSquare,
  Square,
  HelpCircle,
  Copy,
  Check,
  Printer,
  Plus,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
  Share2
} from 'lucide-react';

interface Props {
  document: DocumentAnalysis;
  onOpenExportModal: () => void;
}

export const ActionAndLawyerPrepView: React.FC<Props> = ({
  document,
  onOpenExportModal
}) => {
  const [actions, setActions] = useState<ActionItem[]>(document.actions || []);
  const [newActionText, setNewActionText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Load persisted action status from IndexedDB
  useEffect(() => {
    async function loadPersistedActions() {
      const persisted = await getActionsFromDb(document.id);
      if (persisted && persisted.length > 0) {
        setActions(persisted);
      }
    }
    loadPersistedActions();
  }, [document.id]);

  // Toggle action completion and persist
  const toggleAction = async (id: string) => {
    const updated = actions.map((a) =>
      a.id === id ? { ...a, isCompleted: !a.isCompleted } : a
    );
    setActions(updated);
    await saveActionsToDb(document.id, updated);
  };

  // Add custom action item
  const handleAddCustomAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionText.trim()) return;

    const newItem: ActionItem = {
      id: `custom-${Date.now()}`,
      action: newActionText.trim(),
      deadline: 'User specified',
      sourceClause: 'Manual Addition',
      category: 'Obligation',
      isCompleted: false
    };

    const updated = [newItem, ...actions];
    setActions(updated);
    setNewActionText('');
    await saveActionsToDb(document.id, updated);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAllQuestions = () => {
    const compiled = document.lawyerQuestions
      .map(
        (lq, idx) =>
          `${idx + 1}. [${lq.topic}] ${lq.question}\n   Reason: ${lq.reasonToAsk}\n   Context: "${lq.contextClause}"`
      )
      .join('\n\n');

    navigator.clipboard.writeText(
      `LexClarity — Questions to Discuss with Legal Counsel\nDocument: ${document.metadata.title}\n\n${compiled}`
    );
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const completedCount = actions.filter((a) => a.isCompleted).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-1">
            <CheckSquare size={14} />
            <span>ACTION CHECKLIST & LAWYER PREPARATION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 font-serif">
            Actions & Questions for Legal Counsel
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Track operational deadlines and take structured, well-grounded questions into your legal consultation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyAllQuestions}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded transition-colors cursor-pointer"
          >
            {copiedAll ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copiedAll ? 'Questions Copied' : 'Copy All Questions'}</span>
          </button>
          <button
            onClick={onOpenExportModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            <Printer size={14} />
            <span>Export Lawyer Brief</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* COLUMN 1: Your Action Items */}
        <section
          aria-labelledby="actions-column-heading"
          className="lg:col-span-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <CheckSquare size={18} className="text-neutral-700 dark:text-neutral-300" />
                <h2 id="actions-column-heading" className="text-base font-bold text-neutral-900 dark:text-neutral-100 font-serif">
                  Your Action Items
                </h2>
              </div>
              <span className="text-xs font-mono text-neutral-500">
                {completedCount} of {actions.length} completed
              </span>
            </div>

            {/* Progress bar */}
            {actions.length > 0 && (
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 mb-5 overflow-hidden">
                <div
                  className="bg-neutral-900 dark:bg-neutral-100 h-1.5 transition-all duration-300 rounded-full"
                  style={{ width: `${(completedCount / actions.length) * 100}%` }}
                />
              </div>
            )}

            {/* Action items list */}
            <div className="space-y-3">
              {actions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleAction(item.id)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    item.isCompleted
                      ? 'bg-neutral-50/60 dark:bg-neutral-900/40 border-neutral-200/50 dark:border-neutral-800/50 opacity-60'
                      : 'bg-white dark:bg-neutral-850 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <button
                    type="button"
                    aria-label={`Mark "${item.action}" as ${item.isCompleted ? 'incomplete' : 'complete'}`}
                    className="mt-0.5 text-neutral-600 dark:text-neutral-400 shrink-0"
                  >
                    {item.isCompleted ? (
                      <CheckSquare size={17} className="text-neutral-900 dark:text-neutral-100" />
                    ) : (
                      <Square size={17} />
                    )}
                  </button>

                  <div className="flex-1">
                    <p
                      className={`text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug ${
                        item.isCompleted ? 'line-through text-neutral-400 dark:text-neutral-500' : ''
                      }`}
                    >
                      {item.action}
                    </p>

                    <div className="mt-1 flex items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400">
                      {item.deadline && (
                        <span className="flex items-center gap-1 font-mono">
                          <Clock size={11} />
                          <span>{item.deadline}</span>
                        </span>
                      )}
                      {item.sourceClause && (
                        <span className="font-mono text-neutral-400">
                          {item.sourceClause}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Add Custom Action */}
          <form onSubmit={handleAddCustomAction} className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex gap-2">
            <input
              type="text"
              value={newActionText}
              onChange={(e) => setNewActionText(e.target.value)}
              placeholder="Add your own custom checklist item..."
              className="flex-1 text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded outline-hidden"
            />
            <button
              type="submit"
              disabled={!newActionText.trim()}
              className="px-3 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold rounded hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Plus size={14} />
            </button>
          </form>
        </section>

        {/* COLUMN 2: Questions to Discuss With a Lawyer */}
        <section
          aria-labelledby="lawyer-prep-column-heading"
          className="lg:col-span-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <HelpCircle size={18} className="text-neutral-700 dark:text-neutral-300" />
                <h2 id="lawyer-prep-column-heading" className="text-base font-bold text-neutral-900 dark:text-neutral-100 font-serif">
                  Questions to Discuss With a Lawyer
                </h2>
              </div>
              <span className="text-xs font-mono text-neutral-500">
                {document.lawyerQuestions.length} curated questions
              </span>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4">
              Derived from ambiguities, missing terms, and potential concerns identified in this document. Use these to maximize the value of your legal consultation.
            </p>

            <div className="space-y-4">
              {document.lawyerQuestions.map((qItem, idx) => (
                <div
                  key={qItem.id || idx}
                  className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                      Topic: {qItem.topic}
                    </span>
                    <button
                      onClick={() => copyToClipboard(qItem.question, qItem.id)}
                      className="text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors p-1"
                      title="Copy question"
                      aria-label="Copy question"
                    >
                      {copiedId === qItem.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
                    "{qItem.question}"
                  </p>

                  {qItem.reasonToAsk && (
                    <div className="text-xs text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-800 p-2 rounded border border-neutral-100 dark:border-neutral-700/60">
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                        Context / Reason:
                      </span>{' '}
                      {qItem.reasonToAsk}
                    </div>
                  )}

                  {qItem.contextClause && (
                    <div className="text-[11px] font-mono text-neutral-500 italic pl-2 border-l border-neutral-300 dark:border-neutral-700">
                      Source clause: "{qItem.contextClause}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500">
            <strong>Preparation Principle:</strong> LexClarity prepares you with factual inquiries rather than legal advice. Your lawyer provides the jurisdiction-specific legal counsel.
          </div>
        </section>
      </div>
    </div>
  );
};
