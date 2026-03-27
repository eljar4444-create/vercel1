---
wave: 1
depends_on: []
files_modified:
  - prisma/schema.prisma
  - src/middleware.ts
  - src/app/onboarding/page.tsx
  - src/app/onboarding/components/step-1-profile.tsx
  - src/app/onboarding/components/step-2-location.tsx
  - src/app/onboarding/components/step-3-tax.tsx
auto_advance: true
---

# Phase 3 Plan: Provider Onboarding Flow

<objective>
To legally onboard B2B beauty providers in Germany, we must construct a strict state-machine wizard that incrementally captures their standard details and explicit DAC7 compliance information (Legal Entity, Tax ID).
</objective>

<requirements>
ONBD-01, ONBD-02, ONBD-03, ONBD-04
</requirements>

<tasks>
<task>
<description>
Add DAC7 and Onboarding Schema Fields
</description>
<read_first>
- prisma/schema.prisma
</read_first>
<action>
Modify `prisma/schema.prisma`. 
Ensure `Profile` has:
- `onboardingStep Int @default(0)`
- `legalName String?`
- `legalEntityType String?` // "individual" or "company"
- `taxId String?`
- `vatId String?`
Run `npx prisma db push`.
</action>
<acceptance_criteria>
- Schema contains all DAC7 reporting fields.
- DB migrated successfully.
</acceptance_criteria>
</task>

<task>
<description>
Enforce Strict Middleware Onboarding Redirect
</description>
<read_first>
- src/middleware.ts
</read_first>
<action>
Update middleware to check if `token.onboardingCompleted === false`.
If a provider attempts to access `/dashboard/*` or `/admin/*`, redirect them back to `/onboarding?step=1`.
</action>
<acceptance_criteria>
- Un-onboarded providers cannot physically enter the dashboard.
</acceptance_criteria>
</task>

<task>
<description>
Build the Step 1 Profile Component
</description>
<read_first>
- src/app/onboarding/page.tsx
- src/app/onboarding/components/step-1-profile.tsx
</read_first>
<action>
Create `step-1-profile.tsx` utilizing `react-hook-form` and `zod`. Collect display name, bio, and phone number. Save progress via Server Action and increment `onboardingStep` to 1.
</action>
<acceptance_criteria>
- Component properly validates data and advances state.
</acceptance_criteria>
</task>

<task>
<description>
Build the Step 2 Location Component
</description>
<read_first>
- src/app/onboarding/components/step-2-location.tsx
</read_first>
<action>
Create `step-2-location.tsx`. Collect City, Address, and Zip. Save progress via Server Action and increment `onboardingStep` to 2.
</action>
<acceptance_criteria>
- Component captures location and advances step correctly.
</acceptance_criteria>
</task>

<task>
<description>
Build the Step 3 DAC7 Component & Completion
</description>
<read_first>
- src/app/onboarding/components/step-3-tax.tsx
</read_first>
<action>
Create `step-3-tax.tsx`. Ask if they are "company" or "individual". Collect `legalName` and `taxId`. On completion, run final Server Action: set `onboardingStep` to 3, `onboarding_completed` to true in Profile. 
</action>
<acceptance_criteria>
- Validates Steuernummer formats (conditionally).
- Properly finalizes onboarding and routes to dashboard.
</acceptance_criteria>
</task>

<task>
<description>
Orchestrate multi-step controller in page.tsx
</description>
<read_first>
- src/app/onboarding/page.tsx
</read_first>
<action>
Refactor the main page. Read DB state on load (`profile.onboardingStep`). Render `<Step1 />`, `<Step2 />`, or `<Step3 />` dynamically based on the step integer, preventing users from skipping ahead by manipulating URL variables.
</action>
<acceptance_criteria>
- True progressive state-machine implemented at the page level.
</acceptance_criteria>
</task>
</tasks>

<must_haves>
- DAC7 details must be optional but prompted strictly in Step 3.
- NextAuth middleware logic must be flawless in rejecting bypass attempts.
</must_haves>
