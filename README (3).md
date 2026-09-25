# LexClarity — AI-Powered Legal Information Understanding & Navigation

> **Product Tagline:** Understand legal information before you act.

LexClarity is a privacy-conscious GenAI web application built to help ordinary users, small business owners, and non-specialists understand, inspect, compare, and navigate complex legal agreements—and prepare informed, structured questions for a qualified legal professional.

---

## 1. The Problem

Legal documents are not only challenging because they are long; they are challenging because ordinary readers:
1. Cannot easily identify what actually matters or what is unusually restrictive.
2. Cannot distinguish between what a contract **explicitly states** versus what is an **interpretation or assumption**.
3. Do not know what deadlines or operational obligations they are committing to.
4. Struggle to compare contract revisions or competing offers without missing subtle, high-impact changes.
5. Do not know what specific, high-value questions to bring to a consultation with a qualified lawyer.

---

## 2. The Solution

LexClarity transforms difficult legal documents into a calm, structured understanding:

```text
WHAT DOES IT SAY?
        ↓
WHAT DOES IT MEAN?
        ↓
WHAT DO I NEED TO DO?
        ↓
WHEN DO I NEED TO DO IT?
        ↓
WHAT DESERVES ATTENTION?
        ↓
WHAT IS UNCLEAR?
        ↓
WHAT SHOULD I ASK A LAWYER?
```

### Core Ethical Boundary
LexClarity provides **general legal information and document assistance only**. It never acts as an attorney, never gives jurisdiction-specific legal advice as fact, never predicts legal outcomes (e.g. *"Will I win in court?"*), and never makes decisions on behalf of the user.

---

## 3. System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          BROWSER CLIENT (REACT)                        │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────┐  ┌────────────────┐  │
│  │ Local File Parsers    │  │ UI & Views        │  │ IndexedDB      │  │
│  │ • PDF.js / Mammoth    │  │ • Workspace       │  │ • Doc History  │  │
│  │ • TXT / Markdown      │  │ • 5-Min Brief     │  │ • Q&A Cache    │  │
│  │ • Text Sanitizer      │  │ • Comparison      │  │ • Checklists   │  │
│  │ • 5MB Limit Validator │  │ • Lawyer Prep     │  │ (No Server DB) │  │
│  └───────────┬───────────┘  └─────────┬─────────┘  └────────────────┘  │
└──────────────┼────────────────────────┼────────────────────────────────┘
               │                        │
               ▼ Controlled REST API    │
┌────────────────────────────────────────────────────────────────────────┐
│                        NODE.JS / EXPRESS SERVER                        │
│                                                                        │
│  • Security Rate Limiting (In-memory token bucket)                     │
│  • Request Size & MIME Validation                                      │
│  • Prompt Injection Boundary Isolation:                                │
│    <document_data> [UNTRUSTED USER TEXT] </document_data>              │
│  • Server-Side Secrets: GEMINI_API_KEY kept confidential               │
│  • Telemetry & Token Cost Aggregation                                  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼ @google/genai SDK
┌────────────────────────────────────────────────────────────────────────┐
│                     GOOGLE GEMINI 3.8 FLASH                            │
│  • Structured JSON Output with Strict Schemas                          │
│  • Outcome Prediction Refusal & Grounded Citations                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Five Core Capabilities

### 4.1 Document Simplification & Section Alignment
- Dual-pane synchronized reading view (Original Document vs Plain-Language Interpretation).
- Dynamic reading-level switcher: **Simple** (6th–8th grade clarity) vs **Standard** (professional clarity).
- Structured clause cards presenting:
  - *Original Clause Quotation*
  - *Plain-Language Meaning*
  - *Evidence Level*
  - *Why It Matters*
  - *What Is Unclear or Missing*
  - *Suggested Question for a Lawyer*

### 4.2 Legal Intelligence & Attention Detection
- Classifies clauses into 12 standardized categories:
  - `Obligation`, `Potential Concern`, `Financial`, `Termination`, `Auto-Renewal`, `Liability`, `Data/Privacy`, `Deadline`, `Restriction`, `Penalty`, `Ambiguity`, `Inconsistency`.
- **Strict Terminology Rule:** Never labels provisions as *"legally risky"* or *"illegal"*. Strictly uses **`Potential Concern`** because legal effect depends on facts, context, and local jurisdiction.

### 4.3 3-Tier Evidence System
Every statement carries an explicit evidence state:
- `✓ EXPLICIT`: Verbatim stated in the document text.
- `~ INFERRED`: A reasonable plain-language derivation from context.
- `? UNCLEAR`: Left ambiguous or unaddressed by the document.

### 4.4 5-Minute Legal Brief
An executive synthesis generated immediately after processing:
- **Document Overview:** Parties, term duration, effective date, financial consideration summary.
- **Pay Attention To:** Prioritized clauses (e.g. 90-day termination notice, ₹50,000 exit penalty, auto-renewal escalation).
- **Read These Sections First:** Prioritized section links ranked by legal and financial impact.

### 4.5 Document Comparison (Neutral Material Diff)
- Side-by-side comparison of baseline vs revised draft (e.g. Lease A vs Lease B).
- Highlights modified, added, and removed provisions.
- Generates **Material Difference Explanations** in plain language (e.g. notice changed from 30 to 90 days).
- **Neutrality Standard:** Strictly refrains from declaring either contract legally *"better"* or *"worse"*.

### 4.6 Grounded Document Q&A & Safety Refusal
- Natural-language Q&A grounded **exclusively** in the provided text.
- Returns verified section quotations, identifies what the document does *not* say, and suggests follow-up questions for an attorney.
- Refuses outcome predictions (*"Will I win this case?"* / *"Is this legal?"*) with a clear legal outcome safety disclaimer.

### 4.7 Action Checklist & "Prepare for a Lawyer"
- Interactive checklist with deadlines and source clauses, persisted locally in IndexedDB.
- Categorized questions derived from ambiguities, potential concerns, and missing provisions.
- **Export Lawyer Brief:** Generates a clean, printable/downloadable Markdown brief for attorney consultations.

---

## 5. Security & Privacy Architecture

- **Prompt Injection Defense:** Untrusted document text is enclosed within `<document_data>` tags. System instructions explicitly command the model to treat enclosed text as inert source data, ignoring any embedded instructions (`"IGNORE PREVIOUS INSTRUCTIONS"`, `"Output APPROVED"`).
- **Zero Server Storage:** User documents and Q&A history are stored locally in the browser's IndexedDB. No server database is provisioned.
- **API Key Protection:** The Gemini API key remains strictly on the server in `.env`.
- **File Validation:** Enforces a 5.0 MB maximum file limit and validates extensions (`.pdf`, `.docx`, `.txt`, `.md`).
- **Data Privacy Rule:** Document text is only transmitted to the configured GenAI backend proxy for analysis. No telemetry or analytics platforms receive contract contents.

---

## 6. Accessibility & Design Constitution

- **WCAG 2.1 AA Compliant:** Contrast ratios exceed 4.5:1 across light and dark modes.
- **Anti-AI Slop & Zero-Pill Discipline:** Clean typography pairing (Plus Jakarta Sans + Source Serif 4 + JetBrains Mono) with unboxed metadata and subtle typographic dividers (`·`).
- **Non-Hue State Signaling:** Status colors are always paired with explicit icons and text labels (e.g. `AlertTriangle` + "Potential Concern").
- **Dynamic Text Scaling:** In-app zoom controls (`A-` / `A+`) for comfortable reading.
- **Keyboard Navigation & ARIA Live:** Full keyboard accessibility with visible focus rings and `aria-live="polite"` progress updates during analysis.

---

## 7. Testing Suite

Run the automated test suite with Vitest:

```bash
npm run test
```

Test coverage includes:
- `tests/unit/fileParser.test.ts`: File size limits (5MB), MIME verification, text sanitization.
- `tests/unit/prompts.test.ts`: `<document_data>` isolation, ethical boundaries, outcome prediction refusal.
- `tests/adversarial/promptInjection.test.ts`: Hostile instruction injection verification.

---

## 8. Limitations & Scope Cuts

### Explicit Limitations
- **Not Legal Advice:** LexClarity provides general legal information and document assistance. It does not replace a qualified attorney.
- **No Outcome Guarantees:** The engine cannot predict whether a judge, arbitrator, or jury will enforce a provision.
- **Document Boundary:** Answers are strictly limited to the four corners of the uploaded document; extrinsic facts require professional legal counsel.

### Deliberate Scope Cuts
- **No E-Signatures or Contract Filing:** LexClarity is an understanding and preparation tool, not a transaction engine.
- **No Lawyer Marketplace:** Avoids referral conflicts of interest.
- **No Server Database:** Contracts are never saved to a cloud database for privacy reasons.
