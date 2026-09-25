/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  DocumentAnalysis,
  ReadingLevel,
  ClauseItem,
  SectionItem,
  ActionItem,
  LawyerQuestionItem
} from './types/legal';
import {
  saveDocumentToDb,
  getAllDocumentsFromDb,
  getDocumentFromDb
} from './storage/indexedDb';
import { computeDocumentHash } from './parsers/fileParser';
import { analyzeDocumentApi } from './services/api';
import { SAMPLE_DOCUMENTS } from './data/sampleDocuments';
import { TopBar, NavTab } from './components/TopBar';
import { LegalDisclaimerBanner } from './components/LegalDisclaimerBanner';
import { LandingUpload } from './components/LandingUpload';
import { ProcessingView } from './components/ProcessingView';
import { DocumentWorkspace } from './components/DocumentWorkspace';
import { FiveMinuteBriefView } from './components/FiveMinuteBriefView';
import { ComparisonView } from './components/ComparisonView';
import { ActionAndLawyerPrepView } from './components/ActionAndLawyerPrepView';
import { AdversarialSecurityModal } from './components/AdversarialSecurityModal';
import { ExportBriefModal } from './components/ExportBriefModal';
import { DevTelemetryModal } from './components/DevTelemetryModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('workspace');
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>('simple');
  const [currentDoc, setCurrentDoc] = useState<DocumentAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMeta, setProcessingMeta] = useState({ fileName: '', fileSize: 0 });
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);

  // Dark Mode State with local storage and system preference
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('lexclarity_dark_mode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('lexclarity_dark_mode', String(darkMode));
  }, [darkMode]);

  // Load previous document from IndexedDB or preload standard lease on first visit
  useEffect(() => {
    async function initDoc() {
      try {
        const storedDocs = await getAllDocumentsFromDb();
        if (storedDocs.length > 0) {
          setCurrentDoc(storedDocs[0]);
        }
      } catch {
        // storage disabled or empty
      }
    }
    initDoc();
  }, []);

  const handleDocumentReady = async (text: string, fileName: string, fileSize: number) => {
    setIsProcessing(true);
    setProcessingMeta({ fileName, fileSize });
    setErrorNotice(null);

    try {
      const hash = await computeDocumentHash(text);
      const { data, tokensUsed } = await analyzeDocumentApi(text, fileName, fileSize);

      // Assemble verified DocumentAnalysis object with fallback safety
      const analysis: DocumentAnalysis = {
        id: `doc-${Date.now()}-${hash}`,
        fileName,
        fileSize,
        wordCount: text.trim().split(/\s+/).length,
        hash,
        createdAt: Date.now(),
        metadata: {
          title: data.metadata?.title || fileName,
          documentType: data.metadata?.documentType || 'Legal Agreement',
          parties: data.metadata?.parties || [],
          effectiveDate: data.metadata?.effectiveDate || 'Not specified',
          termOrDuration: data.metadata?.termOrDuration || 'Not specified',
          governingLaw: data.metadata?.governingLaw || 'Not specified',
          financialSummary: data.metadata?.financialSummary || 'Standard consideration terms',
          terminationSummary: data.metadata?.terminationSummary || 'Standard termination clauses'
        },
        sections: (data.sections || []).map((sec: any, sIdx: number) => ({
          id: sec.id || `sec-${sIdx + 1}`,
          number: sec.number || `Section ${sIdx + 1}`,
          title: sec.title || `Section ${sIdx + 1}`,
          rawText: sec.rawText || '',
          summarySimple: sec.summarySimple || '',
          summaryStandard: sec.summaryStandard || '',
          importanceRank: sec.importanceRank || 5,
          hasConcerns: Boolean(sec.hasConcerns),
          clauses: []
        })),
        clauses: (data.clauses || []).map((c: any, cIdx: number) => ({
          id: c.id || `clause-${cIdx + 1}`,
          sectionNumber: c.sectionNumber || '',
          sectionTitle: c.sectionTitle || '',
          originalText: c.originalText || '',
          category: c.category || 'Obligation',
          evidenceLevel: c.evidenceLevel || 'inferred',
          meaningSimple: c.meaningSimple || '',
          meaningStandard: c.meaningStandard || '',
          whyItMatters: c.whyItMatters || '',
          unclearOrMissing: c.unclearOrMissing || '',
          lawyerQuestion: c.lawyerQuestion || '',
          sourceLocation: c.sourceLocation || `Clause ${cIdx + 1}`,
          isImportant: Boolean(c.isImportant)
        })),
        fiveMinuteBrief: {
          documentOverview: {
            documentType: data.fiveMinuteBrief?.documentOverview?.documentType || data.metadata?.documentType || 'Agreement',
            parties: data.fiveMinuteBrief?.documentOverview?.parties || data.metadata?.parties || [],
            effectiveDate: data.fiveMinuteBrief?.documentOverview?.effectiveDate || data.metadata?.effectiveDate || 'Not specified',
            term: data.fiveMinuteBrief?.documentOverview?.term || data.metadata?.termOrDuration || 'Not specified',
            importantFinancialTerms: data.fiveMinuteBrief?.documentOverview?.importantFinancialTerms || data.metadata?.financialSummary || 'Standard fees'
          },
          payAttentionTo: data.fiveMinuteBrief?.payAttentionTo || [],
          readTheseSectionsFirst: data.fiveMinuteBrief?.readTheseSectionsFirst || []
        },
        actions: (data.actions || []).map((a: any, aIdx: number) => ({
          id: a.id || `act-${aIdx + 1}`,
          action: a.action || '',
          deadline: a.deadline || 'As required by agreement',
          sourceClause: a.sourceClause || '',
          category: a.category || 'Obligation',
          isCompleted: false
        })),
        lawyerQuestions: (data.lawyerQuestions || []).map((q: any, qIdx: number) => ({
          id: q.id || `lq-${qIdx + 1}`,
          topic: q.topic || 'General Clause Inquiry',
          question: q.question || '',
          contextClause: q.contextClause || '',
          reasonToAsk: q.reasonToAsk || '',
          evidenceLevel: q.evidenceLevel || 'inferred'
        })),
        rawText: text,
        tokensUsed
      };

      await saveDocumentToDb(analysis);
      setCurrentDoc(analysis);
      setActiveTab('brief'); // Directly lead to 5-Minute Brief screen after processing!
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorNotice(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadAdversarialSample = () => {
    const sample = SAMPLE_DOCUMENTS.find((d) => d.id === 'adversarial-security-fixture');
    if (sample) {
      const byteSize = new Blob([sample.content]).size;
      handleDocumentReady(sample.content, `${sample.title}.txt`, byteSize);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans transition-colors">
      {/* Top Bar with brand and controls */}
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        readingLevel={readingLevel}
        onReadingLevelChange={setReadingLevel}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        hasDocument={Boolean(currentDoc)}
        onOpenUpload={() => {
          setCurrentDoc(null);
          setActiveTab('workspace');
        }}
        onOpenTelemetry={() => setIsTelemetryOpen(true)}
      />

      {/* Prominent Legal Disclaimer Banner (Principle: General legal info only, never replaces lawyer) */}
      <LegalDisclaimerBanner variant="banner" />

      {/* Error notice toast if analysis fails */}
      {errorNotice && (
        <div className="max-w-5xl mx-auto w-full px-4 pt-4">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-800 dark:text-red-300 rounded flex items-center justify-between">
            <span>{errorNotice}</span>
            <button
              onClick={() => setErrorNotice(null)}
              className="text-red-500 hover:text-red-800 font-bold ml-3"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {isProcessing ? (
          <ProcessingView
            fileName={processingMeta.fileName}
            fileSize={processingMeta.fileSize}
          />
        ) : !currentDoc && activeTab !== 'compare' && activeTab !== 'security' ? (
          <LandingUpload
            onDocumentReady={handleDocumentReady}
            onGoToComparison={() => setActiveTab('compare')}
            onGoToSecurityTest={() => setActiveTab('security')}
          />
        ) : activeTab === 'workspace' && currentDoc ? (
          <DocumentWorkspace
            document={currentDoc}
            readingLevel={readingLevel}
            onGoToBrief={() => setActiveTab('brief')}
            onGoToActions={() => setActiveTab('actions')}
          />
        ) : activeTab === 'brief' && currentDoc ? (
          <FiveMinuteBriefView
            document={currentDoc}
            readingLevel={readingLevel}
            onNavigateToWorkspace={() => setActiveTab('workspace')}
            onGoToActions={() => setActiveTab('actions')}
            onOpenExportModal={() => setIsExportOpen(true)}
          />
        ) : activeTab === 'compare' ? (
          <ComparisonView
            initialDocA={currentDoc?.rawText || undefined}
          />
        ) : activeTab === 'actions' && currentDoc ? (
          <ActionAndLawyerPrepView
            document={currentDoc}
            onOpenExportModal={() => setIsExportOpen(true)}
          />
        ) : activeTab === 'security' ? (
          <AdversarialSecurityModal
            onLoadAdversarialSample={handleLoadAdversarialSample}
          />
        ) : (
          <LandingUpload
            onDocumentReady={handleDocumentReady}
            onGoToComparison={() => setActiveTab('compare')}
            onGoToSecurityTest={() => setActiveTab('security')}
          />
        )}
      </main>

      {/* Modals */}
      {currentDoc && (
        <ExportBriefModal
          document={currentDoc}
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
        />
      )}

      <DevTelemetryModal
        isOpen={isTelemetryOpen}
        onClose={() => setIsTelemetryOpen(false)}
      />

      {/* Quiet, accessible footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 py-6 px-4 text-center text-xs text-neutral-500 dark:text-neutral-400 bg-white/50 dark:bg-neutral-900/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            <strong>LexClarity</strong> · AI-Powered Legal Information Understanding & Navigation
          </p>
          <p className="text-[11px] text-neutral-400">
            Privacy-First Architecture · IndexedDB Browser Storage · Zero Server Database
          </p>
        </div>
      </footer>
    </div>
  );
}
