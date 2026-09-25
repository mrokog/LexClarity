# LexClarity — Autonomous Improvement Log

This log documents the iterative implementation, diagnosis, testing, and refinement cycles executed during the build of LexClarity.

---

## Iteration 1 — Architecture & Security Isolation

- **Action:** Designed server-side Express architecture with `@google/genai` TypeScript SDK and Vite middleware.
- **Diagnosis:** Prompt injection vectors exist if raw user-supplied documents are concatenated directly into LLM prompts.
- **Improvement:**
  - Implemented `<document_data>` XML containment protocol.
  - Formulated `SYSTEM_ROLE_BASE` with strict non-lawyer rules and mandatory "Potential Concern" nomenclature.
  - Implemented 5MB payload ceiling and in-memory rate limiting.
- **Verification:** Unit tests confirmed isolation of malicious payloads in `tests/adversarial/promptInjection.test.ts`.

---

## Iteration 2 — Evidence System & Ethical Boundaries

- **Action:** Created 3-tier Evidence System (`✓ EXPLICIT`, `~ INFERRED`, `? UNCLEAR`).
- **Diagnosis:** LLMs tend to present reasonable inferences as definitive facts, or speculate on ambiguous notice mechanisms (e.g. whether email qualifies as written notice).
- **Improvement:**
  - Added dedicated `evidenceLevel` and `unclearOrMissing` fields to the JSON schema.
  - Added explicit refusal handler for legal outcome predictions ("Will I win this case?", "Is this definitely legal?").
  - Grounded Document Q&A strictly to return citations (`{ section, quote }`) or state: *"I couldn't find enough information in the provided document to answer that reliably."*
- **Verification:** Tested with outcome questions and confirmed refusal response without hallucinations.

---

## Iteration 3 — Privacy & Client-Side Persistence

- **Action:** Integrated IndexedDB for zero-server storage architecture.
- **Diagnosis:** Sending document content to a server database violates the MVP privacy requirement.
- **Improvement:**
  - Built `src/storage/indexedDb.ts` with stores for `documents`, `actions`, and `qaCache`.
  - Added local storage fallback if IndexedDB is blocked in sandboxed environments.
  - Added document hash generation (`computeDocumentHash`) to cache repeated Q&A queries locally without sending redundant LLM requests.
- **Verification:** Confirmed document analyses and checklist completions persist across browser page reloads.

---

## Iteration 4 — Document Comparison & Neutrality Standard

- **Action:** Implemented Document Comparison screen (`ComparisonView.tsx`).
- **Diagnosis:** A simple text diff fails to explain practical legal impact, while biased AI models might claim one contract is "better" or "worse".
- **Improvement:**
  - Built prompt that extracts material differences (Termination Notice, Early Exit Fee, Auto-Renewal, Landlord Entry) with practical plain-language explanations.
  - Enforced neutrality rule: strictly prohibited claiming that one contract is legally superior or inferior.
- **Verification:** Tested Standard Lease A (90-day notice, ₹50,000 penalty) vs Revised Lease B (30-day notice, ₹20,000 penalty). Model neutrally explained the 60-day difference and financial impact.

---

## Iteration 5 — Accessibility & UX Polish

- **Action:** Applied the Universal Frontend Design Constitution and SaaS design guidelines.
- **Diagnosis:** Static metadata wrapped in pill badges looks like generic AI slop; color-only status indicators fail WCAG AA.
- **Improvement:**
  - Eliminated pill badges for static metadata; used unboxed clean text with typographic separators (`·`).
  - Added explicit text + icon combos for all clause categories (e.g. `AlertTriangle` + "Potential Concern").
  - Added font size zoom controls (`A-` / `A+`) and dark mode with persistent user preference.
  - Implemented 5-step transparent processing view rather than generic loading spinners.
  - Created "Export Lawyer Brief" feature enabling clean markdown and printouts for attorney consultations.
- **Verification:** All 11 Vitest unit/integration tests pass. Clean TypeScript compilation with zero errors.
