/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  FileCheck,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  GitCompare,
  Sparkles,
  CheckCircle2,
  FileCode
} from 'lucide-react';
import { SAMPLE_DOCUMENTS, SampleDoc } from '../data/sampleDocuments';
import { validateLegalFile, extractTextFromFile } from '../parsers/fileParser';

interface Props {
  onDocumentReady: (text: string, fileName: string, fileSize: number) => void;
  onGoToComparison: () => void;
  onGoToSecurityTest: () => void;
}

export const LandingUpload: React.FC<Props> = ({
  onDocumentReady,
  onGoToComparison,
  onGoToSecurityTest
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [pasteDocTitle, setPasteDocTitle] = useState('Pasted Legal Document');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setErrorMessage(null);
    const validation = validateLegalFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file.');
      return;
    }

    try {
      setIsReadingFile(true);
      const text = await extractTextFromFile(file);
      if (!text || text.trim().length === 0) {
        throw new Error('Extracted document text was empty.');
      }
      onDocumentReady(text, validation.sanitizedName || file.name, file.size);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Failed to process document: ${msg}`);
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!pastedText.trim() || pastedText.trim().length < 40) {
      setErrorMessage('Please paste at least one legal clause or agreement section (minimum 40 characters).');
      return;
    }
    const byteSize = new Blob([pastedText]).size;
    onDocumentReady(pastedText.trim(), pasteDocTitle || 'Pasted Legal Agreement', byteSize);
  };

  const handleLoadSample = (sample: SampleDoc) => {
    const byteSize = new Blob([sample.content]).size;
    onDocumentReady(sample.content, `${sample.title}.txt`, byteSize);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero Headline and Value Proposition */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-serif leading-tight">
          Understand legal information before you act.
        </h1>
        <p className="mt-3 text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
          LexClarity inspects complex contracts, flags potential concerns, distinguishes explicit facts from AI inferences, and helps you prepare informed questions for a qualified lawyer.
        </p>
      </div>

      {/* Primary Workspace Card */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden mb-10">
        {/* Mode Selector Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/50 px-4 pt-2">
          <button
            onClick={() => setActiveMode('upload')}
            className={`pb-2.5 px-4 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              activeMode === 'upload'
                ? 'text-neutral-950 dark:text-neutral-50 border-b-2 border-neutral-900 dark:border-neutral-100 font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            Upload Document (PDF, DOCX, TXT)
          </button>
          <button
            onClick={() => setActiveMode('paste')}
            className={`pb-2.5 px-4 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              activeMode === 'paste'
                ? 'text-neutral-950 dark:text-neutral-50 border-b-2 border-neutral-900 dark:border-neutral-100 font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            Paste Agreement Text
          </button>
        </div>

        {/* Upload Mode */}
        {activeMode === 'upload' ? (
          <div className="p-6 sm:p-10">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 sm:p-12 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-800/50'
                  : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-500 dark:hover:border-neutral-600 bg-neutral-50/40 dark:bg-neutral-900/40'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept=".pdf,.docx,.doc,.txt,.md,.rtf"
                className="hidden"
              />
              <div className="mx-auto w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 mb-4">
                <UploadCloud size={24} aria-hidden="true" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Drop your legal document here, or browse
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                Supports PDF, DOCX, TXT, or MD • Maximum 5.0 MB
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100/80 dark:bg-neutral-800/80 px-3 py-1 rounded">
                <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <span>Privacy First: Document is parsed locally and kept in your browser's IndexedDB</span>
              </div>

              {isReadingFile && (
                <div className="mt-4 text-xs font-medium text-neutral-600 dark:text-neutral-300 animate-pulse">
                  Extracting and sanitizing document content...
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Paste Mode */
          <form onSubmit={handlePasteSubmit} className="p-6 sm:p-8">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="paste-title"
                  className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1"
                >
                  Document Title or Label
                </label>
                <input
                  id="paste-title"
                  type="text"
                  value={pasteDocTitle}
                  onChange={(e) => setPasteDocTitle(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 outline-hidden"
                  placeholder="e.g. Commercial Lease Agreement"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="paste-text"
                    className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400"
                  >
                    Paste Legal Text or Clauses
                  </label>
                  <span className="text-xs text-neutral-400 tabular-nums">
                    {pastedText.length} characters
                  </span>
                </div>
                <textarea
                  id="paste-text"
                  rows={9}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="w-full text-xs sm:text-sm font-mono p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 outline-hidden leading-relaxed"
                  placeholder="Paste the full contract or specific clauses you need to inspect..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPastedText('')}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 cursor-pointer"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={!pastedText.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <span>Analyze Document</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Error notification banner */}
        {errorMessage && (
          <div className="mx-6 mb-6 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded flex items-start gap-2.5 text-xs text-red-800 dark:text-red-300">
            <AlertCircle size={16} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}
      </div>

      {/* Fast 1-Click Samples & Alternative Workflows */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold tracking-wide text-neutral-900 dark:text-neutral-100 uppercase">
              Or Try A Curated Sample Agreement
            </h2>
            <span className="text-xs text-neutral-500">1-click instant test</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SAMPLE_DOCUMENTS.slice(0, 3).map((sample) => (
              <div
                key={sample.id}
                onClick={() => handleLoadSample(sample)}
                className="p-3.5 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                      {sample.category}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      {sample.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors">
                    {sample.title}
                  </h4>
                  <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                    {sample.description}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-medium text-neutral-900 dark:text-neutral-100">
                  <span>Load Sample</span>
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}

            {/* Adversarial Test Card */}
            <div
              onClick={() => handleLoadSample(SAMPLE_DOCUMENTS[3])}
              className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg border border-amber-200/80 dark:border-amber-800/40 hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                    Security & Safety
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                    Injection Test
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Adversarial Prompt Injection Fixture
                </h4>
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  Contains "IGNORE PREVIOUS INSTRUCTIONS" attack. Tests that LexClarity treats content purely as untrusted data.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-amber-200/40 dark:border-amber-900/40 flex items-center justify-between text-xs font-semibold text-amber-900 dark:text-amber-200">
                <span>Test Injection Defense</span>
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Capabilities Spotlight */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-neutral-900 dark:text-neutral-100 uppercase mb-3">
            Alternative Modes
          </h2>

          <div
            onClick={onGoToComparison}
            className="p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-semibold text-sm mb-1">
              <GitCompare size={16} className="text-neutral-700 dark:text-neutral-300" />
              <span>Compare Two Documents</span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Side-by-side comparison of revisions or competing offers. Highlights material changes without biased rankings.
            </p>
          </div>

          <div
            onClick={onGoToSecurityTest}
            className="p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-semibold text-sm mb-1">
              <ShieldCheck size={16} className="text-neutral-700 dark:text-neutral-300" />
              <span>Inspect Security Architecture</span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Review how &lt;document_data&gt; boundary isolation, server-side secrets, and evidence grading guarantee safety.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
