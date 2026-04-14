# Story 2.4: Arrival Info Input (Private Master only)

**Epic:** 2 — Dashboard Photo Upload Flow
**Status:** in-progress
**Date:** 2026-04-14

---

## Summary

As a Private Master, I want to enter my arrival details (address, door code, bell info, nearby café) in the dashboard, so that this information is revealed to clients after booking confirmation.

## Acceptance Criteria

- **AC-001:** Dashboard section for arrival details (only visible for `provider_type !== 'SALON'`)
- **AC-002:** Fields: exact address (required), door code (optional), bell/intercom note (optional), waiting spot recommendation (optional)
- **AC-003:** Saved as `Profile.arrivalInfo` JSON via existing `updateArrivalInfo` server action
- **AC-004:** Preview of how the Arrival Ritual Card will look to the client

## Architecture

### Server Action
`updateArrivalInfo` in `src/app/actions/portfolio-photos.ts` — **already implemented and tested** in Epic 1.5. No backend changes needed.

### Dashboard Integration
- New component: `src/components/dashboard/ArrivalInfoSection.tsx` (client component)
- Rendered in `src/app/dashboard/page.tsx` within the `profile` section, gated by `!isSalonProvider`
- Data: `Profile.arrivalInfo` must be fetched in `renderProviderDashboard` and passed to the component

### Component Design
- Card with 4 fields: address, doorCode, bellNote, waitingSpot
- Save button calls `updateArrivalInfo`
- Clear/reset button calls `updateArrivalInfo(null)`
- Preview card rendered below the form showing how clients will see it post-booking
- All strings in Russian

### Anti-Patterns
- Do NOT create a new server action — reuse `updateArrivalInfo`
- Do NOT add this section to Salon dashboards
- Do NOT use router.refresh() — server action already calls `revalidatePath`
- Do NOT add cookies
- Do NOT add new nav sections — this lives inside the existing `profile` tab

## Dev Notes
- The `arrivalInfo` field is already in the Prisma schema (`Profile.arrivalInfo Json?`)
- The field shape: `{ address: string, doorCode?: string, bellNote?: string, waitingSpot?: string }`
- Must add `arrivalInfo` to the profile select in `renderProviderDashboard`
- Existing EditProfileForm already handles profile editing — ArrivalInfoSection is a separate card below it
- Toast feedback: `react-hot-toast` in Russian

## Files to Touch
1. `src/components/dashboard/ArrivalInfoSection.tsx` — **NEW** client component
2. `src/app/dashboard/page.tsx` — fetch `arrivalInfo`, render section, gate on `!isSalonProvider`
3. `src/components/dashboard/__tests__/ArrivalInfoSection.test.tsx` — **NEW** unit tests

## Test Plan
- Unit tests: renders fields, saves on submit, shows preview, hidden for salons, clear button works
- Build: green
- Lint: no new warnings
- Typecheck: no new errors
