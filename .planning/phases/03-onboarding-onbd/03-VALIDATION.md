# Validation Strategy: Phase 3

## Dimension 8: Validation Mechanisms

**Metrics / Triggers:**
- Ensure `/dashboard` access is actively rejected via Middleware when `onboardingCompleted` is false.
- Ensure Zod rejects missing legal names when the DAC7 form is submitted.

**Post-Execution Validation:**
- Validate via manual test account creation.
- Check Prisma Studio to ensure DAC7 fields are populated correctly mapping to `legalEntityType`.
