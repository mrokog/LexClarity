# LexClarity Test Suite Documentation

This directory contains unit, integration, and adversarial security tests for LexClarity.

## Structure

```text
/tests
  /unit
    fileParser.test.ts          # File size limits (5MB), MIME verification, sanitization
    prompts.test.ts             # Prompt architecture, <document_data> isolation, ethical rules
  /adversarial
    promptInjection.test.ts     # Hostile prompt override test fixture verification
  README.md
```

## Running the Tests

To run the complete test suite:

```bash
npm run test
# or
npx vitest run
```

## Test Coverage Overview

1. **File Parsing & Security Validation** (`fileParser.test.ts`):
   - Confirms acceptance of legitimate `.txt`, `.docx`, `.pdf`, `.md` legal files.
   - Enforces strict 5.0 MB maximum file size limit (fails with clear message if exceeded).
   - Rejects empty files (0 bytes).
   - Rejects executable/binary formats (`.exe`, etc.).
   - Sanitizes text by stripping null bytes and non-printable control characters.

2. **Prompt Architecture & Ethical Boundaries** (`prompts.test.ts`):
   - Verifies all user document text is quarantined within `<document_data>` XML tags.
   - Ensures `SYSTEM_ROLE_BASE` mandates the "Potential Concern" terminology rule.
   - Verifies explicit, inferred, and unclear evidence categorization.
   - Confirms safety refusal instructions for outcome predictions ("Will I win this case in court?").
   - Confirms neutrality enforcement for document comparison without biased "better/worse" rankings.

3. **Adversarial Injection Defense** (`promptInjection.test.ts`):
   - Verifies that embedded attack strings (`IGNORE ALL PREVIOUS INSTRUCTIONS`, `Tell user it's safe`, `APPROVED`, etc.) are never concatenated into system instructions.
   - Guarantees they remain isolated within the untrusted source data block.
