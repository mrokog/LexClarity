/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EvidenceLevel = 'explicit' | 'inferred' | 'unclear';

export type ClauseCategory =
  | 'Obligation'
  | 'Potential Concern'
  | 'Financial'
  | 'Termination'
  | 'Auto-Renewal'
  | 'Liability'
  | 'Data/Privacy'
  | 'Deadline'
  | 'Restriction'
  | 'Penalty'
  | 'Ambiguity'
  | 'Inconsistency';

export type ReadingLevel = 'simple' | 'standard';

export interface ClauseItem {
  id: string;
  sectionNumber?: string;
  sectionTitle?: string;
  originalText: string;
  category: ClauseCategory;
  evidenceLevel: EvidenceLevel;
  meaningSimple: string;
  meaningStandard: string;
  whyItMatters: string;
  unclearOrMissing?: string;
  lawyerQuestion?: string;
  obligationSubject?: string;
  deadline?: string;
  financialAmount?: string;
  sourceLocation: string;
  isImportant?: boolean;
}

export interface SectionItem {
  id: string;
  number: string;
  title: string;
  rawText: string;
  summarySimple: string;
  summaryStandard: string;
  importanceRank: number;
  clauses: ClauseItem[];
  hasConcerns: boolean;
}

export interface DocumentMetadata {
  title: string;
  documentType: string;
  parties: string[];
  effectiveDate?: string;
  termOrDuration?: string;
  governingLaw?: string;
  financialSummary?: string;
  terminationSummary?: string;
}

export interface PrioritizedSection {
  sectionNumber: string;
  sectionTitle: string;
  reasonToReadFirst: string;
  priorityRank: number;
}

export interface ActionItem {
  id: string;
  action: string;
  deadline?: string;
  sourceClause: string;
  category: ClauseCategory;
  isCompleted: boolean;
  notes?: string;
}

export interface LawyerQuestionItem {
  id: string;
  topic: string;
  question: string;
  contextClause: string;
  reasonToAsk: string;
  evidenceLevel: EvidenceLevel;
}

export interface FiveMinuteBrief {
  documentOverview: {
    documentType: string;
    parties: string[];
    effectiveDate: string;
    term: string;
    importantFinancialTerms: string;
  };
  payAttentionTo: ClauseItem[];
  readTheseSectionsFirst: PrioritizedSection[];
}

export interface DocumentAnalysis {
  id: string;
  fileName: string;
  fileSize: number;
  wordCount: number;
  hash: string;
  createdAt: number;
  metadata: DocumentMetadata;
  sections: SectionItem[];
  clauses: ClauseItem[];
  fiveMinuteBrief: FiveMinuteBrief;
  actions: ActionItem[];
  lawyerQuestions: LawyerQuestionItem[];
  rawText: string;
  tokensUsed?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    latencyMs: number;
  };
}

export interface QaSourceCitation {
  section: string;
  quote: string;
}

export interface QaResponse {
  question: string;
  answer: string;
  evidenceLevel: EvidenceLevel;
  sources: QaSourceCitation[];
  whatDocumentDoesNotSay?: string;
  nextQuestionForLawyer?: string;
  isOutcomeRefusal?: boolean;
  refusalReason?: string;
  tokensUsed?: {
    totalTokens: number;
    latencyMs: number;
  };
}

export interface DifferenceItem {
  category: string;
  topic: string;
  status: 'modified' | 'added' | 'removed' | 'unchanged';
  docAText: string;
  docBText: string;
  plainLanguageDifference: string;
  whyItMatters: string;
  sourceDocA?: string;
  sourceDocB?: string;
  evidenceLevel: EvidenceLevel;
}

export interface ComparisonResult {
  docAName: string;
  docBName: string;
  summary: string;
  differences: DifferenceItem[];
  keyTakeaways: string[];
  tokensUsed?: {
    totalTokens: number;
    latencyMs: number;
  };
}

export interface TelemetryStats {
  totalRequests: number;
  totalTokens: number;
  avgLatencyMs: number;
  model: string;
  estimatedCostUsd: number;
  cacheHits: number;
}
