import {
  DocumentAnalysis,
  QaResponse,
  ComparisonResult
} from '../types/legal';

export function clientFallbackAnalysis(documentText: string, fileName: string): DocumentAnalysis {
  const isResidential = /tenant|landlord|rent|premises|lease/i.test(documentText);
  const isEmployment = /employee|employer|salary|probation|work/i.test(documentText);
  const isNda = /confidential|proprietary|non-disclosure|recipient/i.test(documentText);

  let docType = 'Legal Agreement';
  if (isResidential) docType = 'Residential Lease Agreement';
  else if (isEmployment) docType = 'Employment Agreement';
  else if (isNda) docType = 'Non-Disclosure Agreement (NDA)';

  // Extract paragraphs as pseudo-sections
  const rawParagraphs = documentText
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 20);

  const sections = (rawParagraphs.length > 0 ? rawParagraphs.slice(0, 8) : [documentText.slice(0, 500)]).map((para, idx) => {
    const firstLine = para.split('\n')[0].replace(/^#+\s*/, '').trim();
    const title = firstLine.length < 60 ? firstLine : `Section ${idx + 1}`;
    const hasConcerns = /penalty|terminate|lock-in|indemnify|forfeit|auto-renew/i.test(para);

    return {
      id: `sec-${idx + 1}`,
      number: `Section ${idx + 1}`,
      title,
      rawText: para,
      summarySimple: `This section describes guidelines regarding ${title.toLowerCase()}. It sets expectations between both parties in straightforward terms.`,
      summaryStandard: `Governs formal operational procedures for ${title}. Both parties are bound by the stated requirements.`,
      importanceRank: idx === 0 ? 1 : idx + 1,
      hasConcerns
    };
  });

  const clauses = [
    {
      id: 'clause-1',
      sectionNumber: 'Section 1',
      sectionTitle: sections[0]?.title || 'Overview',
      originalText: documentText.slice(0, 180),
      category: 'Obligation' as const,
      evidenceLevel: 'explicit' as const,
      meaningSimple: 'Defines the starting baseline rules and mutual commitments outlined in the agreement.',
      meaningStandard: 'Identifies core recitals and the foundational relationship between the contracting entities.',
      actionableAdvice: 'Confirm that your official contact details and entity names match legal registration records.'
    }
  ];

  if (/notice|terminate|cancel/i.test(documentText)) {
    clauses.push({
      id: 'clause-2',
      sectionNumber: 'Termination Terms',
      sectionTitle: 'Exit & Notice',
      originalText: 'Provisions regarding written notice and exit procedures apply as stipulated.',
      category: 'Termination' as const,
      evidenceLevel: 'inferred' as const,
      meaningSimple: 'Explains how either party may end the agreement and what notice must be given in advance.',
      meaningStandard: 'Specifies termination conditions, required notice duration, and operational handoff requirements.',
      actionableAdvice: 'Document all critical notice milestones and ensure written delivery confirmation.'
    });
  }

  if (/penalty|forfeit|deposit|fee/i.test(documentText)) {
    clauses.push({
      id: 'clause-3',
      sectionNumber: 'Financial Terms',
      sectionTitle: 'Payments & Deposits',
      originalText: 'Financial commitments and potential deductions or fee adjustments.',
      category: 'Potential Concern' as const,
      evidenceLevel: 'inferred' as const,
      meaningSimple: 'Outlines charges, deposits, or potential deductions that could impact finances.',
      meaningStandard: 'Specifies fee obligations, deposit handling policies, and liability conditions for default.',
      actionableAdvice: 'Have legal counsel review whether deduction clauses comply with local statutory protections.'
    });
  }

  return {
    metadata: {
      title: fileName || 'Analyzed Legal Document',
      documentType: docType,
      parties: ['First Party', 'Second Party'],
      effectiveDate: 'Refer to document execution date',
      termOrDuration: 'Stipulated within agreement terms',
      governingLaw: 'Jurisdiction specified in agreement',
      financialSummary: 'Covers core recurring consideration, deposits, and fee structures.',
      terminationSummary: 'Outlines formal written notice requirements and dissolution steps.'
    },
    sections,
    clauses,
    fiveMinuteBrief: {
      executiveSummary: `This ${docType.toLowerCase()} establishes binding terms between the participating entities. It sets forth operational rules, payment obligations, dispute processes, and termination conditions.`,
      partiesAndDates: 'The document sets forth reciprocal obligations between signing parties upon effective execution.',
      coreFinancials: 'Specifies payment obligations, security deposit or compensation schedules, and financial terms.',
      termAndTermination: 'Contains provisions governing term duration, renewal mechanisms, and written notice periods.',
      payAttentionTo: [
        'Notice deadlines and requirements for terminating or amending terms.',
        'Deposit return policies, fee deductions, and financial adjustments.',
        'Dispute resolution and governing jurisdiction requirements.'
      ],
      readTheseSectionsFirst: sections.slice(0, 3).map((s, idx) => ({
        sectionNumber: s.number,
        sectionTitle: s.title,
        priority: (idx + 1) as 1 | 2 | 3,
        reason: 'Essential operational clause establishing key duties and boundaries.'
      }))
    },
    actionChecklist: [
      {
        id: 'act-1',
        title: 'Review termination and notice provisions',
        description: 'Check how many calendar days of written notice are required before exit.',
        isCompleted: false,
        sourceClause: 'Termination guidelines'
      },
      {
        id: 'act-2',
        title: 'Confirm payment terms and refund schedules',
        description: 'Verify due dates, acceptable payment methods, and deposit return timeframes.',
        isCompleted: false,
        sourceClause: 'Financial terms'
      }
    ],
    lawyerPrep: {
      ambiguities: [
        'Verify whether delivery by email is legally accepted for formal contractual notice.'
      ],
      missingTerms: [
        'Specific force majeure or unforeseen event procedures may need formal clarification.'
      ],
      potentialConcerns: [
        'Ensure fee or deposit forfeiture clauses adhere to local jurisdiction limits.'
      ],
      suggestedQuestions: [
        {
          id: 'q-1',
          category: 'Termination & Notice',
          question: 'Are the stated notice periods enforceable under local laws, and what delivery methods are legally recognized?',
          context: 'Notice clauses often require strict formal service.',
          priority: 'High'
        },
        {
          id: 'q-2',
          category: 'Financial Protection',
          question: 'Do the security deposit terms or fee deduction clauses comply with statutory consumer or tenant protections?',
          context: 'Unilateral deduction rights can be challenged if overly broad.',
          priority: 'Medium'
        }
      ]
    }
  };
}

export function clientFallbackQa(documentText: string, question: string): QaResponse {
  const lowerQ = question.toLowerCase();

  // Safety Outcome refusal
  const isOutcomeQuestion =
    /will i win|is this illegal|can i sue|will court|am i guilty|is this void/i.test(lowerQ);

  if (isOutcomeQuestion) {
    return {
      question,
      answer: "The document alone isn't enough to determine that outcome. I can help identify the relevant clauses, summarize the facts contained in your document, and prepare questions to discuss with a qualified lawyer.",
      evidenceLevel: 'unclear',
      sources: [],
      whatDocumentDoesNotSay: 'Legal outcome determinations depend on local court precedents, factual discovery, and statutory defenses not contained within the document text.',
      nextQuestionForLawyer: 'What additional external evidence or jurisdiction-specific case law would determine the legal outcome in this matter?',
      isOutcomeRefusal: true,
      refusalReason: 'Safety Policy: Predictive outcome assessments require formal legal counsel.'
    };
  }

  // Search document for keywords
  const keywords = lowerQ
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(k => k.length > 3 && !['what', 'when', 'where', 'which', 'does', 'have', 'from', 'this'].includes(k));

  let matchedSnippet = '';
  for (const kw of keywords) {
    const idx = documentText.toLowerCase().indexOf(kw);
    if (idx !== -1) {
      const start = Math.max(0, idx - 40);
      const end = Math.min(documentText.length, idx + 180);
      matchedSnippet = documentText.substring(start, end).trim();
      break;
    }
  }

  if (matchedSnippet) {
    return {
      question,
      answer: `Based on the document terms, the relevant provision states: "...${matchedSnippet}..."`,
      evidenceLevel: 'explicit',
      sources: [{ section: 'Relevant Clause', quote: matchedSnippet }],
      whatDocumentDoesNotSay: 'The document does not detail supplementary exceptions beyond the text quoted above.',
      nextQuestionForLawyer: `How is this provision interpreted under applicable state or national statutes?`,
      isOutcomeRefusal: false
    };
  }

  return {
    question,
    answer: 'The provided document does not appear to explicitly address this inquiry in the text analyzed.',
    evidenceLevel: 'unclear',
    sources: [],
    whatDocumentDoesNotSay: 'This topic is not explicitly mentioned or clearly defined within the provided text.',
    nextQuestionForLawyer: 'Should an explicit addendum or clause be inserted to clarify this matter in writing?',
    isOutcomeRefusal: false
  };
}

export function clientFallbackComparison(
  docAText: string,
  docBText: string,
  docAName: string,
  docBName: string
): ComparisonResult {
  return {
    documentAName: docAName || 'Document A',
    documentBName: docBName || 'Document B',
    executiveSummary: `Comparison between ${docAName} (${docAText.length} characters) and ${docBName} (${docBText.length} characters). Both drafts share structural similarities while presenting distinct language differences.`,
    neutralityNote: 'This neutral comparison highlights material language differences without declaring either contract legally "better" or "worse". Legal suitability depends on your specific position and negotiating leverage.',
    addedProvisions: [
      {
        id: 'diff-add-1',
        title: 'Additional terms in Document B',
        documentBQuote: docBText.slice(0, 160),
        plainLanguageMeaning: 'Document B includes language not present in Document A, introducing specific procedural guidelines.',
        whoItBenefits: 'Party presenting the revised draft'
      }
    ],
    removedProvisions: [
      {
        id: 'diff-rem-1',
        title: 'Omitted baseline clause from Document A',
        documentAQuote: docAText.slice(0, 160),
        plainLanguageMeaning: 'This clause was present in Document A but has been removed or modified in Document B.',
        potentialImpact: 'Review whether any protective warranties or notice remedies were omitted.'
      }
    ],
    modifiedProvisions: [
      {
        id: 'diff-mod-1',
        title: 'Core Terminology Adjustment',
        documentAQuote: docAText.slice(0, 120),
        documentBQuote: docBText.slice(0, 120),
        plainLanguageDifference: 'Adjustments in phrasing between the two versions alter the operational scope or timeline.',
        negotiationInsight: 'Clarify the business intent behind the wording change with legal counsel.'
      }
    ],
    questionsForLawyer: [
      {
        id: 'cmp-q-1',
        provision: 'Modified Terms',
        question: 'Does the revised draft in Document B shift liability or procedural burden away from standard customary practice?'
      }
    ]
  };
}
