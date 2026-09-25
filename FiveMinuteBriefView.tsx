/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DocumentAnalysis, ReadingLevel, ClauseItem } from '../types/legal';
import { EvidenceBadge } from './EvidenceBadge';
import { CategoryBadge } from './CategoryBadge';
import {
  FileText,
  Clock,
  AlertTriangle,
  ArrowRight,
  Bookmark,
  Calendar,
  DollarSign,
  Users,
  CheckSquare,
  HelpCircle,
  Share2,
  Printer
} from 'lucide-react';

interface Props {
  document: DocumentAnalysis;
  readingLevel: ReadingLevel;
  onNavigateToWorkspace: (clauseId?: string) => void;
  onGoToActions: () => void;
  onOpenExportModal: () => void;
}

export const FiveMinuteBriefView: React.FC<Props> = ({
  document,
  readingLevel,
  onNavigateToWorkspace,
  onGoToActions,
  onOpenExportModal
}) => {
  const { fiveMinuteBrief, metadata, clauses, actions, lawyerQuestions } = document;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Brief Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400 mb-1">
            <Clock size={14} />
            <span>5-MINUTE LEGAL BRIEF</span>
            <span aria-hidden="true">·</span>
            <span>EXECUTIVE OVERVIEW</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 font-serif">
            {metadata.title || document.fileName}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenExportModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded transition-colors cursor-pointer"
          >
            <Printer size={14} />
            <span>Export Brief</span>
          </button>
          <button
            onClick={() => onNavigateToWorkspace()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            <span>Open Workspace</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 1. DOCUMENT OVERVIEW CARD */}
      <section aria-labelledby="overview-heading" className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-xs">
        <h2 id="overview-heading" className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4 flex items-center gap-2">
          <FileText size={15} />
          <span>Document Overview</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg border border-neutral-200/60 dark:border-neutral-800">
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 block mb-0.5">
              Document Type
            </span>
            <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {metadata.documentType || 'Legal Agreement'}
            </span>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg border border-neutral-200/60 dark:border-neutral-800">
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 block mb-0.5">
              Identified Parties
            </span>
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {metadata.parties && metadata.parties.length > 0
                ? metadata.parties.join(' & ')
                : 'Parties not specified'}
            </span>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg border border-neutral-200/60 dark:border-neutral-800">
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 block mb-0.5">
              Effective Date & Term
            </span>
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {metadata.effectiveDate || 'Not stated'} · {metadata.termOrDuration || 'Standard term'}
            </span>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg border border-neutral-200/60 dark:border-neutral-800">
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 block mb-0.5">
              Financial Summary
            </span>
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2">
              {metadata.financialSummary || 'Standard consideration'}
            </span>
          </div>
        </div>

        {metadata.terminationSummary && (
          <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg border border-neutral-200/60 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300">
            <strong className="text-neutral-900 dark:text-neutral-100">Termination Mechanism:</strong>{' '}
            {metadata.terminationSummary}
          </div>
        )}
      </section>

      {/* 2. PAY ATTENTION TO (Prioritized Clauses) */}
      <section aria-labelledby="pay-attention-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="pay-attention-heading" className="text-lg font-bold text-neutral-900 dark:text-neutral-100 font-serif">
              Pay Attention To
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Key obligations, financial exposure, termination limits, and potential concerns requiring careful review.
            </p>
          </div>
          <span className="text-xs font-mono text-neutral-500">
            {fiveMinuteBrief.payAttentionTo?.length || 0} critical terms
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {(fiveMinuteBrief.payAttentionTo || clauses.slice(0, 5)).map((item: ClauseItem, idx: number) => {
            const meaning = readingLevel === 'simple' ? item.meaningSimple : item.meaningStandard;

            return (
              <div
                key={item.id || idx}
                onClick={() => onNavigateToWorkspace(item.id)}
                className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all cursor-pointer group shadow-xs"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <CategoryBadge category={item.category} size="sm" />
                    {item.sourceLocation && (
                      <span className="text-xs text-neutral-500 font-mono">
                        {item.sourceLocation}
                      </span>
                    )}
                  </div>
                  <EvidenceBadge level={item.evidenceLevel} />
                </div>

                <div className="mb-2 pl-3 border-l-2 border-neutral-200 dark:border-neutral-700 font-mono text-xs text-neutral-600 dark:text-neutral-400 italic">
                  "{item.originalText}"
                </div>

                <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                  {meaning}
                </div>

                {item.whyItMatters && (
                  <div className="text-xs text-neutral-600 dark:text-neutral-400">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      Why it matters:
                    </span>{' '}
                    {item.whyItMatters}
                  </div>
                )}

                {item.unclearOrMissing && (
                  <div className="mt-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
                    <strong>What is unclear:</strong> {item.unclearOrMissing}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. READ THESE SECTIONS FIRST (Prioritized Navigation Links) */}
      <section aria-labelledby="read-first-heading" className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-xs">
        <div className="mb-4">
          <h2 id="read-first-heading" className="text-base font-bold text-neutral-900 dark:text-neutral-100 font-serif">
            Read These Sections First
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Prioritized navigation order based on deadlines, obligations, financial consequences, and ambiguity.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {fiveMinuteBrief.readTheseSectionsFirst && fiveMinuteBrief.readTheseSectionsFirst.length > 0 ? (
            fiveMinuteBrief.readTheseSectionsFirst.map((sec, idx) => (
              <div
                key={idx}
                onClick={() => onNavigateToWorkspace()}
                className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg border border-neutral-200/60 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-mono text-neutral-500 mb-1">
                  <span>Priority #{sec.priorityRank || idx + 1}</span>
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                    {sec.sectionNumber}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-700 dark:group-hover:text-neutral-300">
                  {sec.sectionTitle}
                </h4>
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  {sec.reasonToReadFirst}
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-xs text-neutral-500">
              Sections prioritized according to termination terms and financial conditions.
            </div>
          )}
        </div>
      </section>

      {/* 4. ACTIONS & LAWYER QUESTIONS TEASERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Action Checklist Snippet */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckSquare size={16} className="text-neutral-700 dark:text-neutral-300" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                Action Checklist ({actions.length})
              </h3>
            </div>
            <button
              onClick={onGoToActions}
              className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
            >
              View all
            </button>
          </div>
          <div className="space-y-2">
            {actions.slice(0, 3).map((act) => (
              <div
                key={act.id}
                className="text-xs p-2 bg-neutral-50 dark:bg-neutral-800/60 rounded flex items-start gap-2"
              >
                <div className="w-3.5 h-3.5 rounded border border-neutral-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {act.action}
                  </div>
                  {act.deadline && (
                    <div className="text-[11px] text-neutral-500">
                      Deadline: {act.deadline}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lawyer Prep Questions Snippet */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HelpCircle size={16} className="text-neutral-700 dark:text-neutral-300" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                Questions for a Lawyer ({lawyerQuestions.length})
              </h3>
            </div>
            <button
              onClick={onGoToActions}
              className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
            >
              View all
            </button>
          </div>
          <div className="space-y-2">
            {lawyerQuestions.slice(0, 3).map((lq) => (
              <div
                key={lq.id}
                className="text-xs p-2 bg-neutral-50 dark:bg-neutral-800/60 rounded"
              >
                <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {lq.question}
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5">
                  Topic: {lq.topic}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
