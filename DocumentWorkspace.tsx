/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  DocumentAnalysis,
  ReadingLevel,
  ClauseCategory,
  ClauseItem,
  SectionItem,
  QaResponse
} from '../types/legal';
import { EvidenceBadge } from './EvidenceBadge';
import { CategoryBadge } from './CategoryBadge';
import { askDocumentQaApi } from '../services/api';
import {
  Search,
  Filter,
  HelpCircle,
  Send,
  MessageSquare,
  AlertTriangle,
  FileText,
  Bookmark,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Loader2
} from 'lucide-react';

interface Props {
  document: DocumentAnalysis;
  readingLevel: ReadingLevel;
  onGoToBrief: () => void;
  onGoToActions: () => void;
}

const CATEGORY_FILTERS: Array<ClauseCategory | 'All'> = [
  'All',
  'Potential Concern',
  'Termination',
  'Financial',
  'Auto-Renewal',
  'Obligation',
  'Liability',
  'Data/Privacy',
  'Deadline',
  'Ambiguity'
];

export const DocumentWorkspace: React.FC<Props> = ({
  document,
  readingLevel,
  onGoToBrief,
  onGoToActions
}) => {
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    document.sections[0]?.id || ''
  );
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<ClauseCategory | 'All'>('All');
  const [fontSizeOffset, setFontSizeOffset] = useState<number>(0); // -1, 0, 1, 2
  const [searchQuery, setSearchQuery] = useState('');

  // Q&A state
  const [questionInput, setQuestionInput] = useState('');
  const [isAskingQa, setIsAskingQa] = useState(false);
  const [qaHistory, setQaHistory] = useState<QaResponse[]>([]);
  const [qaError, setQaError] = useState<string | null>(null);
  const qaContainerRef = useRef<HTMLDivElement>(null);

  const originalDocRef = useRef<HTMLDivElement>(null);

  // Filter clauses
  const filteredClauses = document.clauses.filter((clause) => {
    const matchesCategory =
      activeCategoryFilter === 'All' || clause.category === activeCategoryFilter;
    const matchesSearch =
      searchQuery === '' ||
      clause.originalText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.meaningSimple.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.meaningStandard.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (clause.sectionTitle && clause.sectionTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Handle Q&A submission
  const handleAskQuestion = async (queryToAsk?: string) => {
    const q = (queryToAsk || questionInput).trim();
    if (!q) return;

    setIsAskingQa(true);
    setQaError(null);

    try {
      const response = await askDocumentQaApi(document.rawText, document.hash, q);
      setQaHistory((prev) => [response, ...prev]);
      if (!queryToAsk) setQuestionInput('');
      setTimeout(() => {
        qaContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setQaError(msg);
    } finally {
      setIsAskingQa(false);
    }
  };

  const getFontSizeClass = (base: string) => {
    if (fontSizeOffset === -1) return `${base} text-xs`;
    if (fontSizeOffset === 1) return `${base} text-base`;
    if (fontSizeOffset === 2) return `${base} text-lg`;
    return `${base} text-sm`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Document Header & Quick Nav Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 font-mono mb-1">
            <span>{document.metadata.documentType || 'Legal Document'}</span>
            <span aria-hidden="true">·</span>
            <span>{document.wordCount.toLocaleString()} words</span>
            <span aria-hidden="true">·</span>
            <span>{document.clauses.length} parsed clauses</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-serif">
            {document.metadata.title || document.fileName}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Font Size Adjuster */}
          <div className="inline-flex items-center bg-neutral-100 dark:bg-neutral-800 rounded p-1 text-neutral-600 dark:text-neutral-400">
            <button
              onClick={() => setFontSizeOffset((p) => Math.max(-1, p - 1))}
              className="p-1 hover:text-neutral-900 dark:hover:text-neutral-100 rounded transition-colors"
              title="Decrease text size"
              aria-label="Decrease text size"
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-[11px] font-mono px-1.5" aria-hidden="true">A</span>
            <button
              onClick={() => setFontSizeOffset((p) => Math.min(2, p + 1))}
              className="p-1 hover:text-neutral-900 dark:hover:text-neutral-100 rounded transition-colors"
              title="Increase text size"
              aria-label="Increase text size"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          <button
            onClick={onGoToBrief}
            className="px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors cursor-pointer"
          >
            5-Min Brief
          </button>
          <button
            onClick={onGoToActions}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            Checklist ({document.actions.length})
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-neutral-400 text-xs mr-1 hidden sm:inline">Filter:</span>
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeCategoryFilter === cat
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Clause search */}
        <div className="relative min-w-[200px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search clauses or terms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 outline-hidden"
          />
        </div>
      </div>

      {/* Main Dual-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* LEFT PANE: Original Document Text */}
        <div className="lg:col-span-5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden shadow-xs">
          <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-neutral-600 dark:text-neutral-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                Original Legal Document
              </h2>
            </div>
            <span className="text-[11px] text-neutral-400 font-mono">
              Raw Source Text
            </span>
          </div>

          <div
            ref={originalDocRef}
            tabIndex={0}
            aria-label="Original Legal Document Text"
            className="p-4 sm:p-5 overflow-y-auto flex-1 font-mono text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap selection:bg-neutral-200 dark:selection:bg-neutral-700 focus:outline-hidden focus:ring-1 focus:ring-neutral-400"
            style={{ maxHeight: '720px' }}
          >
            <div className={getFontSizeClass('text-xs leading-relaxed')}>
              {document.rawText}
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Plain-Language Structured View */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-3.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-neutral-700 dark:text-neutral-300" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                Plain-Language View ({readingLevel === 'simple' ? 'Simple Level' : 'Standard Level'})
              </h2>
            </div>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Showing {filteredClauses.length} clause items
            </span>
          </div>

          {filteredClauses.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-8 text-center text-neutral-500 text-xs">
              No clauses match the selected category filter or search query.
            </div>
          ) : (
            <div className="space-y-4" style={{ maxHeight: '720px', overflowY: 'auto' }}>
              {filteredClauses.map((clause) => {
                const isSelected = selectedClauseId === clause.id;
                const meaning = readingLevel === 'simple' ? clause.meaningSimple : clause.meaningStandard;

                return (
                  <article
                    key={clause.id}
                    onClick={() => setSelectedClauseId(clause.id)}
                    className={`bg-white dark:bg-neutral-900 rounded-xl border transition-all cursor-pointer p-4 sm:p-5 ${
                      isSelected
                        ? 'border-neutral-900 dark:border-neutral-100 shadow-sm ring-1 ring-neutral-900/10 dark:ring-neutral-100/10'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    {/* Header Row: Category Badge & Evidence State */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CategoryBadge category={clause.category} size="sm" />
                        {clause.sourceLocation && (
                          <span className="text-[11px] text-neutral-500 font-mono">
                            {clause.sourceLocation}
                          </span>
                        )}
                      </div>
                      <EvidenceBadge level={clause.evidenceLevel} />
                    </div>

                    {/* Original Clause Quotation */}
                    <div className="mb-3 pl-3 border-l-2 border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-600 dark:text-neutral-400 italic">
                      "{clause.originalText}"
                    </div>

                    {/* Plain Language Meaning */}
                    <div className="mb-3">
                      <div className="text-[11px] uppercase tracking-wide font-semibold text-neutral-500 dark:text-neutral-400 mb-0.5">
                        What this means:
                      </div>
                      <p className={getFontSizeClass('text-neutral-900 dark:text-neutral-100 font-medium leading-relaxed')}>
                        {meaning}
                      </p>
                    </div>

                    {/* Why It Matters */}
                    {clause.whyItMatters && (
                      <div className="mb-2 text-xs bg-neutral-50 dark:bg-neutral-800/60 p-2.5 rounded border border-neutral-200/60 dark:border-neutral-800">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                          Why it matters:
                        </span>{' '}
                        <span className="text-neutral-600 dark:text-neutral-300">
                          {clause.whyItMatters}
                        </span>
                      </div>
                    )}

                    {/* Unclear / Missing Information (Master prompt requirement) */}
                    {clause.unclearOrMissing && (
                      <div className="mb-2 text-xs bg-amber-50/60 dark:bg-amber-950/20 p-2.5 rounded border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200">
                        <span className="font-semibold">Unclear / Missing:</span>{' '}
                        <span className="text-amber-800 dark:text-amber-300">
                          {clause.unclearOrMissing}
                        </span>
                      </div>
                    )}

                    {/* Suggested Question for a Lawyer */}
                    {clause.lawyerQuestion && (
                      <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                        <HelpCircle size={14} className="text-neutral-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                            Consider asking a lawyer:
                          </span>{' '}
                          <span>{clause.lawyerQuestion}</span>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Grounded Document Q&A Bar (Section 10 & 11) */}
      <section
        ref={qaContainerRef}
        aria-label="Document Question and Answer"
        className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xs"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-neutral-700 dark:text-neutral-300" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
              Ask About This Document
            </h2>
          </div>
          <span className="text-xs text-neutral-500">
            Grounded strictly in the document text
          </span>
        </div>

        {/* Pre-canned common questions */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 text-xs">
          <span className="text-neutral-400 text-xs shrink-0">Common questions:</span>
          {[
            'Can I terminate this agreement early?',
            'How much notice do I need to give?',
            'Can the fees or rent be increased?',
            'Does this agreement automatically renew?',
            'Will I win this case in court?' // Safety refusal test
          ].map((q) => (
            <button
              key={q}
              onClick={() => handleAskQuestion(q)}
              disabled={isAskingQa}
              className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded whitespace-nowrap transition-colors cursor-pointer text-xs"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Question input form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskQuestion();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            disabled={isAskingQa}
            placeholder="e.g. What are my obligations regarding utility payments?"
            className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 outline-hidden"
          />
          <button
            type="submit"
            disabled={!questionInput.trim() || isAskingQa}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs sm:text-sm font-semibold rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isAskingQa ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Checking...</span>
              </>
            ) : (
              <>
                <span>Ask</span>
                <Send size={14} />
              </>
            )}
          </button>
        </form>

        {qaError && (
          <div className="mt-3 p-2.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded border border-red-200 dark:border-red-900">
            {qaError}
          </div>
        )}

        {/* Q&A Responses List */}
        {qaHistory.length > 0 && (
          <div className="mt-5 space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            {qaHistory.map((item, idx) => (
              <div
                key={idx}
                className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200/80 dark:border-neutral-700/80 space-y-2.5"
              >
                {/* Question and Evidence State */}
                <div className="flex items-start justify-between gap-3">
                  <div className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100">
                    Q: {item.question}
                  </div>
                  <EvidenceBadge level={item.evidenceLevel} />
                </div>

                {/* Outcome Prediction Refusal Notice (Master prompt section 11) */}
                {item.isOutcomeRefusal && (
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <ShieldAlert size={15} className="shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" />
                    <div>
                      <strong>Legal Outcome Boundary:</strong> LexClarity cannot predict legal outcomes or confirm whether a court will uphold a clause. A lawyer must evaluate jurisdiction and extrinsic evidence.
                    </div>
                  </div>
                )}

                {/* Plain-Language Answer */}
                <div className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
                  {item.answer}
                </div>

                {/* Source Citations */}
                {item.sources && item.sources.length > 0 && (
                  <div className="text-xs space-y-1">
                    <div className="font-semibold text-neutral-600 dark:text-neutral-400 text-[11px] uppercase tracking-wider">
                      Document Source Quotation:
                    </div>
                    {item.sources.map((src, sIdx) => (
                      <div
                        key={sIdx}
                        className="pl-2.5 border-l-2 border-neutral-400 dark:border-neutral-600 font-mono text-[11px] text-neutral-600 dark:text-neutral-300"
                      >
                        <span className="font-bold">{src.section}:</span> "{src.quote}"
                      </div>
                    ))}
                  </div>
                )}

                {/* What the document does NOT say */}
                {item.whatDocumentDoesNotSay && (
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 italic">
                    <span className="font-semibold not-italic text-neutral-700 dark:text-neutral-300">
                      What the document does NOT say:
                    </span>{' '}
                    {item.whatDocumentDoesNotSay}
                  </div>
                )}

                {/* Next Question For A Lawyer */}
                {item.nextQuestionForLawyer && (
                  <div className="pt-1.5 border-t border-neutral-200/50 dark:border-neutral-700/50 flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                    <HelpCircle size={13} className="text-neutral-500" />
                    <span>
                      <strong>Suggested question for a lawyer:</strong> {item.nextQuestionForLawyer}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
