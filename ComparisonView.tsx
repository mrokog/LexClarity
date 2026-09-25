/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ComparisonResult, DifferenceItem } from '../types/legal';
import { compareDocumentsApi } from '../services/api';
import { SAMPLE_DOCUMENTS } from '../data/sampleDocuments';
import { EvidenceBadge } from './EvidenceBadge';
import {
  GitCompare,
  ArrowRight,
  Plus,
  Minus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  FileText,
  Loader2,
  Scale
} from 'lucide-react';

interface Props {
  initialDocA?: string;
  initialDocB?: string;
}

export const ComparisonView: React.FC<Props> = ({ initialDocA, initialDocB }) => {
  const [docAName, setDocAName] = useState('Standard Lease (Draft A)');
  const [docBName, setDocBName] = useState('Revised Lease (Draft B)');
  const [docAText, setDocAText] = useState(
    initialDocA || SAMPLE_DOCUMENTS[0].content
  );
  const [docBText, setDocBText] = useState(
    initialDocB || SAMPLE_DOCUMENTS[1].content
  );

  const [isLoading, setIsLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const handleRunComparison = async () => {
    if (!docAText.trim() || !docBText.trim()) {
      setErrorMessage('Both Document A and Document B text are required for comparison.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await compareDocumentsApi(docAText, docBText, docAName, docBName);
      setComparisonResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSampleComparison = () => {
    setDocAName(SAMPLE_DOCUMENTS[0].title);
    setDocBName(SAMPLE_DOCUMENTS[1].title);
    setDocAText(SAMPLE_DOCUMENTS[0].content);
    setDocBText(SAMPLE_DOCUMENTS[1].content);
    setComparisonResult(null);
  };

  const getStatusBadge = (status: DifferenceItem['status']) => {
    switch (status) {
      case 'modified':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <RefreshCw size={10} />
            <span>MODIFIED</span>
          </span>
        );
      case 'added':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Plus size={10} />
            <span>ADDED IN B</span>
          </span>
        );
      case 'removed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
            <Minus size={10} />
            <span>REMOVED IN B</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
            <span>UNCHANGED</span>
          </span>
        );
    }
  };

  const filteredDifferences = comparisonResult?.differences.filter((diff) => {
    if (categoryFilter === 'All') return true;
    return diff.category === categoryFilter;
  }) || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-1">
            <GitCompare size={14} />
            <span>DOCUMENT COMPARISON</span>
            <span aria-hidden="true">·</span>
            <span>OBJECTIVE MATERIAL DIFF</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 font-serif">
            Compare Two Legal Documents
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Inspect material differences in obligations, fees, termination conditions, and liability without biased or outcome-driven rankings.
          </p>
        </div>

        <button
          onClick={handleLoadSampleComparison}
          className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 underline decoration-dotted self-start sm:self-auto cursor-pointer"
        >
          Reset to Lease A vs Lease B Sample
        </button>
      </div>

      {/* Input / Document Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document A Input */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <FileText size={14} />
              <span>Document A (Baseline)</span>
            </label>
            <span className="text-[11px] font-mono text-neutral-400">
              {docAText.length} chars
            </span>
          </div>
          <input
            type="text"
            value={docAName}
            onChange={(e) => setDocAName(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded font-semibold text-neutral-900 dark:text-neutral-100"
            placeholder="Document A Name"
          />
          <textarea
            rows={7}
            value={docAText}
            onChange={(e) => setDocAText(e.target.value)}
            className="w-full text-xs font-mono p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded leading-relaxed"
            placeholder="Paste text for Document A..."
          />
        </div>

        {/* Document B Input */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <FileText size={14} />
              <span>Document B (Comparison)</span>
            </label>
            <span className="text-[11px] font-mono text-neutral-400">
              {docBText.length} chars
            </span>
          </div>
          <input
            type="text"
            value={docBName}
            onChange={(e) => setDocBName(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded font-semibold text-neutral-900 dark:text-neutral-100"
            placeholder="Document B Name"
          />
          <textarea
            rows={7}
            value={docBText}
            onChange={(e) => setDocBText(e.target.value)}
            className="w-full text-xs font-mono p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded leading-relaxed"
            placeholder="Paste text for Document B..."
          />
        </div>
      </div>

      {/* Action Button */}
      <div className="text-center">
        <button
          onClick={handleRunComparison}
          disabled={isLoading || !docAText.trim() || !docBText.trim()}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Extracting and Comparing Terms...</span>
            </>
          ) : (
            <>
              <GitCompare size={16} />
              <span>Analyze Material Differences</span>
            </>
          )}
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded border border-red-200 dark:border-red-900">
          {errorMessage}
        </div>
      )}

      {/* COMPARISON RESULTS SECTION */}
      {comparisonResult && (
        <div className="space-y-6 pt-4">
          {/* Executive Comparison Summary Card */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 font-serif">
                Material Differences Overview
              </h2>
              <span className="text-xs font-mono text-neutral-500">
                {comparisonResult.differences.length} changes detected
              </span>
            </div>

            <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {comparisonResult.summary}
            </p>

            {comparisonResult.keyTakeaways && comparisonResult.keyTakeaways.length > 0 && (
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Key Material Highlights:
                </span>
                <ul className="space-y-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                  {comparisonResult.keyTakeaways.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-neutral-400" aria-hidden="true">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Neutrality & Evidence Reminder */}
          <div className="p-3 bg-neutral-100/70 dark:bg-neutral-800/50 rounded text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
            <Scale size={16} className="text-neutral-500 shrink-0" />
            <span>
              <strong>Neutrality Standard:</strong> LexClarity highlights objective operational differences (notice days, financial caps, renewal terms) without declaring either document legally "better" or "worse".
            </span>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-neutral-400 mr-1">Category:</span>
            {['All', 'Termination', 'Financial', 'Auto-Renewal', 'Obligation', 'Liability'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Side-by-Side Detailed Differences List */}
          <div className="space-y-4">
            {filteredDifferences.map((item, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xs space-y-3"
              >
                {/* Header: Topic, Status, Category, Evidence */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                      {item.topic}
                    </span>
                    {getStatusBadge(item.status)}
                    <span className="text-xs text-neutral-500 font-mono">
                      {item.category}
                    </span>
                  </div>
                  <EvidenceBadge level={item.evidenceLevel} />
                </div>

                {/* Side-by-side Clause Text Diff */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded border border-neutral-200/60 dark:border-neutral-800">
                    <div className="font-semibold text-neutral-500 dark:text-neutral-400 mb-1 flex items-center justify-between">
                      <span>{docAName}</span>
                      {item.sourceDocA && <span className="font-mono text-[10px]">{item.sourceDocA}</span>}
                    </div>
                    <div className="font-mono text-neutral-800 dark:text-neutral-200">
                      {item.docAText || '(Not present in Document A)'}
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded border border-neutral-200/60 dark:border-neutral-800">
                    <div className="font-semibold text-neutral-500 dark:text-neutral-400 mb-1 flex items-center justify-between">
                      <span>{docBName}</span>
                      {item.sourceDocB && <span className="font-mono text-[10px]">{item.sourceDocB}</span>}
                    </div>
                    <div className="font-mono text-neutral-800 dark:text-neutral-200">
                      {item.docBText || '(Not present in Document B)'}
                    </div>
                  </div>
                </div>

                {/* Plain-Language Material Difference Explanation */}
                <div className="text-xs bg-neutral-100/80 dark:bg-neutral-800/80 p-3 rounded">
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100 mb-0.5">
                    Plain-Language Difference:
                  </div>
                  <p className="text-neutral-700 dark:text-neutral-300">
                    {item.plainLanguageDifference}
                  </p>
                  {item.whyItMatters && (
                    <div className="mt-1.5 text-neutral-500 dark:text-neutral-400">
                      <strong>Why it may matter:</strong> {item.whyItMatters}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
