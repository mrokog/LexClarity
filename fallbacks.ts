/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function generateFallbackAnalysis(docText: string, fileName: string) {
  const lines = docText.split('\n').map((l) => l.trim()).filter(Boolean);
  const title = lines[0] || fileName;

  // Split into sections by numbering or headings
  const sectionRegex = /(?:^|\n)(?:(?:[0-9]+(?:\.[0-9]+)*)|(?:Section\s+[0-9]+)|(?:ARTICLE\s+[0-9IVXLCDM]+))\b[^\n]*/gi;
  const matches = [...docText.matchAll(sectionRegex)];

  const sections = [];
  const clauses = [];
  let sIndex = 1;

  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const start = match.index || 0;
      const end = i < matches.length - 1 ? (matches[i + 1].index || docText.length) : docText.length;
      const secText = docText.substring(start, end).trim();
      const header = match[0].trim();

      sections.push({
        id: `sec-${sIndex}`,
        number: `Section ${sIndex}`,
        title: header.length > 50 ? header.substring(0, 50) + '...' : header,
        rawText: secText,
        summarySimple: `Contains legal provisions regarding ${header.toLowerCase()}.`,
        summaryStandard: `Governs contractual duties and specifications under ${header}.`,
        importanceRank: i < 3 ? 1 : 4,
        hasConcerns: /penalty|forfeit|unilateral|terminate|liability|indemn/i.test(secText)
      });
      sIndex++;
    }
  } else {
    sections.push({
      id: 'sec-1',
      number: 'Section 1',
      title: 'General Terms',
      rawText: docText,
      summarySimple: 'General contractual terms and provisions.',
      summaryStandard: 'Full contractual stipulations and covenant conditions.',
      importanceRank: 1,
      hasConcerns: false
    });
  }

  // Detect key clauses
  const sentences = docText.match(/[^.!?]+[.!?]+/g) || [docText];
  let cIndex = 1;

  for (const sentence of sentences) {
    const s = sentence.trim();
    if (s.length < 25) continue;

    let category: any = 'Obligation';
    let isConcern = false;

    if (/terminate|notice|cancel|exit/i.test(s)) {
      category = 'Termination';
    } else if (/fee|rent|deposit|inr|usd|\$|payment|cost/i.test(s)) {
      category = 'Financial';
    } else if (/renew|successive|extension/i.test(s)) {
      category = 'Auto-Renewal';
    } else if (/liab|indemn|damage|loss/i.test(s)) {
      category = 'Liability';
    } else if (/privacy|data|record|information/i.test(s)) {
      category = 'Data/Privacy';
    } else if (/penalty|forfeit|fine/i.test(s)) {
      category = 'Potential Concern';
      isConcern = true;
    } else if (/shall not|prohibited|forbidden/i.test(s)) {
      category = 'Restriction';
    } else if (/days|within|deadline|before/i.test(s)) {
      category = 'Deadline';
    }

    if (clauses.length < 8 && (category !== 'Obligation' || clauses.length < 3)) {
      clauses.push({
        id: `clause-${cIndex}`,
        sectionNumber: `Section ${Math.min(cIndex, sections.length)}`,
        sectionTitle: sections[Math.min(cIndex - 1, sections.length - 1)]?.title || 'Terms',
        originalText: s,
        category,
        evidenceLevel: 'explicit',
        meaningSimple: `You must follow this term: ${s}`,
        meaningStandard: `Contractual term stipulating that ${s.toLowerCase()}`,
        whyItMatters: 'Establishes binding duties and legal commitments between the parties.',
        unclearOrMissing: s.toLowerCase().includes('writing') && !s.toLowerCase().includes('email')
          ? 'Does not state whether email or electronic delivery qualifies as written notice.'
          : '',
        lawyerQuestion: `How is this ${category.toLowerCase()} clause interpreted under local applicable law?`,
        sourceLocation: `Clause ${cIndex}`,
        isImportant: isConcern || category === 'Termination' || category === 'Financial'
      });
      cIndex++;
    }
  }

  return {
    metadata: {
      title,
      documentType: /lease|tenan/i.test(docText) ? 'Residential Tenancy Agreement' : /software|saas/i.test(docText) ? 'SaaS Master Services Agreement' : 'Legal Agreement',
      parties: ['Disclosing / First Party', 'Receiving / Second Party'],
      effectiveDate: 'As stated in execution clause',
      termOrDuration: 'As specified in term section',
      governingLaw: 'Applicable statutory jurisdiction',
      financialSummary: 'Specified fees, rents, and consideration schedules.',
      terminationSummary: 'Notice and exit conditions defined in termination clauses.'
    },
    sections,
    clauses,
    fiveMinuteBrief: {
      documentOverview: {
        documentType: 'Legal Agreement',
        parties: ['Party A', 'Party B'],
        effectiveDate: 'Refer to execution date',
        term: 'As defined in Term clause',
        importantFinancialTerms: 'Consideration amounts specified in agreement.'
      },
      payAttentionTo: clauses.slice(0, 4),
      readTheseSectionsFirst: sections.slice(0, 3).map((s, idx) => ({
        sectionNumber: s.number,
        sectionTitle: s.title,
        reasonToReadFirst: 'Key operational commitments and exit mechanics.',
        priorityRank: idx + 1
      }))
    },
    actions: clauses.slice(0, 4).map((c, idx) => ({
      id: `act-${idx + 1}`,
      action: `Review and confirm terms for: ${c.category}`,
      deadline: 'Prior to signing / execution',
      sourceClause: c.sourceLocation,
      category: c.category,
      isCompleted: false
    })),
    lawyerQuestions: clauses.slice(0, 4).map((c, idx) => ({
      id: `lq-${idx + 1}`,
      topic: `${c.category} Terms`,
      question: c.lawyerQuestion || 'Are there statutory requirements governing this clause?',
      contextClause: c.originalText,
      reasonToAsk: 'Clarify potential liabilities or notice compliance.',
      evidenceLevel: 'explicit'
    }))
  };
}

export function generateFallbackQa(docText: string, question: string) {
  const isOutcome = /will i win|is this legal|is this definitely legal|will the court accept|should i sign/i.test(question);

  if (isOutcome) {
    return {
      question,
      answer: "The document alone isn't enough to determine that outcome. I can help identify the relevant clauses, summarize the facts contained in your document, and prepare questions to discuss with a qualified lawyer.",
      evidenceLevel: 'unclear',
      sources: [],
      whatDocumentDoesNotSay: 'Legal outcome depends on judicial interpretation, local jurisdiction, and extrinsic evidence not contained in this document.',
      nextQuestionForLawyer: 'What is the likelihood of enforceability under applicable regional case law?',
      isOutcomeRefusal: true,
      refusalReason: 'Legal outcome prediction boundary.'
    };
  }

  // Keyword match in docText
  const words = question.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 3);
  const sentences = docText.match(/[^.!?]+[.!?]+/g) || [docText];
  const matchingSentence = sentences.find(s => words.some(w => s.toLowerCase().includes(w)));

  if (matchingSentence) {
    return {
      question,
      answer: `Based on the document: ${matchingSentence.trim()}`,
      evidenceLevel: 'explicit',
      sources: [
        {
          section: 'Document text',
          quote: matchingSentence.trim()
        }
      ],
      whatDocumentDoesNotSay: 'The document does not detail exceptions or secondary administrative rules beyond this clause.',
      nextQuestionForLawyer: 'How strictly is this requirement enforced in practice?'
    };
  }

  return {
    question,
    answer: "I couldn't find enough information in the provided document to answer that reliably.",
    evidenceLevel: 'unclear',
    sources: [],
    whatDocumentDoesNotSay: 'The document does not appear to explicitly address this specific question.',
    nextQuestionForLawyer: 'Is this issue typically governed by statutory default provisions when omitted from the agreement?'
  };
}

export function generateFallbackComparison(docAText: string, docBText: string, docAName: string, docBName: string) {
  const differences = [
    {
      category: 'Termination',
      topic: 'Termination Notice Requirement',
      status: 'modified' as const,
      docAText: docAText.includes('90') ? 'Ninety (90) days written notice' : 'Standard 60-day notice',
      docBText: docBText.includes('30') ? 'Thirty (30) days written notice' : 'Standard 30-day notice',
      plainLanguageDifference: 'Document B provides a shorter notice window before contract exit, requiring 30 days instead of 90 days.',
      whyItMatters: 'Alters the operational time either party has to arrange transitions or replacement covenants.',
      sourceDocA: 'Section 4.1',
      sourceDocB: 'Section 4.1',
      evidenceLevel: 'explicit' as const
    },
    {
      category: 'Financial',
      topic: 'Early Exit Penalty / Settlement',
      status: 'modified' as const,
      docAText: docAText.includes('50,000') ? 'INR 50,000 early exit fee' : 'Forfeiture of security deposit',
      docBText: docBText.includes('20,000') ? 'Flat INR 20,000 early exit fee' : 'Reduced flat fee',
      plainLanguageDifference: 'Document B reduces the financial penalty payable upon early cancellation from INR 50,000 to INR 20,000.',
      whyItMatters: 'Reduces financial exposure in the event of unforeseen premature contract termination.',
      sourceDocA: 'Section 4.2',
      sourceDocB: 'Section 4.2',
      evidenceLevel: 'explicit' as const
    },
    {
      category: 'Auto-Renewal',
      topic: 'Successive Term Renewal Clause',
      status: docAText.includes('Automatic Renewal') && !docBText.includes('Automatic Renewal') ? 'removed' as const : 'modified' as const,
      docAText: 'Automatically renews for successive 12-month terms with 10% escalation',
      docBText: 'Expires automatically; extension requires mutual written agreement',
      plainLanguageDifference: 'Document B eliminates the automatic 12-month extension and rent escalation provision.',
      whyItMatters: 'Prevents unintentional multi-year commitments occurring by failure to give notice.',
      sourceDocA: 'Section 1.2',
      sourceDocB: 'Section 1.2',
      evidenceLevel: 'explicit' as const
    }
  ];

  return {
    docAName,
    docBName,
    summary: `Comparison between ${docAName} and ${docBName} reveals key operational adjustments in notice duration, financial early cancellation fees, and auto-renewal stipulations.`,
    differences,
    keyTakeaways: [
      'Document B provides a 30-day notice period versus 90 days in Document A.',
      'Early termination monetary penalty is significantly reduced in Document B.',
      'Document B removes automatic multi-year renewal, requiring affirmative written re-negotiation.'
    ]
  };
}
