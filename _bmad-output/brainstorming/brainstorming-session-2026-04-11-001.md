---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Redesign /salon/[slug] from digital business card into high-converting portfolio page with binary provider-type visual language (Private Master vs Salon/Studio)'
session_goals: '3-5 well-pressure-tested UX/UI structural concepts covering portfolio integration, booking CTA placement, price/service presentation, and Private vs Salon visual differentiation without downgrading Private Masters'
selected_approach: 'progressive-flow'
techniques_used: ['Analogical Thinking + Cross-Pollination', 'Morphological Analysis', 'Constraint Mapping + Adversarial Pressure', 'Solution Matrix']
ideas_generated: [5 Phase-1 principles, 10 morphological candidates (all rejected), 3 adversarial rounds, 1 final synthesized concept]
technique_execution_complete: true
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Eljar
**Date:** 2026-04-11

## Session Overview

**Topic:** Redesign `/salon/[slug]` — from digital business card to high-converting portfolio page.

**Goals:** Produce 3–5 well-pressure-tested UX/UI structural concepts for the master profile page. Each concept must address all four sub-questions holistically, not as isolated widgets.

### Session Setup

**The Central Tension:**
How does a Private Master page read as *premium* rather than *scrappy* when there is no physical storefront to lean on? The page must manage expectations honestly (so a client arriving at a living-room studio isn't surprised) while refusing to visually downgrade the master relative to a salon.

**Four Sub-Problems (all in scope, must be solved by each concept):**

1. **Portfolio integration** — how the visual work (before/after, gallery, real work macro-photography) becomes the emotional center of the page, not a sidebar afterthought.
2. **Booking CTA placement** — how the "Book Now" action stays present without becoming noisy; sticky-widget behavior on mobile and desktop.
3. **Service & price display** — how prices are shown for maximum transparency and minimum friction (no "DM for price"); how durations, packages, and add-ons are communicated.
4. **Provider-type visual language (binary)** — Private Master vs. Salon/Studio. The differentiation must be visible *in the first second* without making Private feel like a downgrade.

**Design Constraints (inherited from the Svoi.de brand):**
- Old Money aesthetic — Neumorphism + Glassmorphism + Playfair Display serif.
- Existing tokens: `booking-bg`, `booking-primary` (forest green), `booking-card`, neumorphic shadow system.
- Brand DNA: "Свои мастера. Тот самый уровень качества."
- Radical price transparency is a brand promise, not a UX preference.
- Real macro-photography of work, not stock imagery.

**Out of Scope:**
- Backend/API design, database schema changes
- SEO meta, analytics pipelines, routing (unless they directly shape a UX decision)

**Ambient Context:**
- The existing page is built (`page.tsx` ~293 lines + `ProfileClient` ~791 lines).
- The `provider_type` field already exists (`SALON | PRIVATE | INDIVIDUAL`). Current visual differentiation is thin — mostly label swaps ("О мастере" vs "О нас") and conditional address visibility.
- This is a **redesign on top of existing data**, not a greenfield build. Concepts should be evolvable from the current state.

## Technique Selection

**Approach:** Progressive Technique Flow
**Journey Design:** Broad divergence → structural mapping → convergent pressure-test → decision matrix.

**Progressive Techniques:**

- **Phase 1 — Expansive Exploration:** Analogical Thinking + Cross-Pollination. Mine 6–8 "premium no-storefront" domains (private chefs, concierge doctors, bespoke tailors, etc.) for trust-building grammar. User explicitly requested the analogical lens to solve the Private Master dignity problem.
- **Phase 2 — Pattern Recognition:** Morphological Analysis. Convert raw ideas into a design-space matrix with orthogonal axes (page archetype × portfolio treatment × CTA pattern × type signaling × price presentation). Select ~10 coherent candidate concepts.
- **Phase 3 — Idea Development:** Constraint Mapping + Adversarial Pressure-Test. Grade ~10 candidates against hard constraints, then attack each with "ugliest failure mode?" pressure. Converge to 3–5 finalists.
- **Phase 4 — Action Planning:** Solution Matrix. Side-by-side comparison grid scoring finalists on brand fit, portfolio power, CTA conversion, Private Master dignity, build effort, and first-glance clarity. Recommend a "prototype first" pick.

**Journey Rationale:** This mirrors the structure that produced WIREFRAME.md from the last session but is sharpened for a page-level UX/UI brainstorm rather than a homepage narrative. The divergent phase is deliberately analogical (not generic) to force escape from beauty-industry conventions before returning to them with a new frame.

## Technique Execution Results

### Phase 1 — Analogical Thinking + Cross-Pollination

**Divergent exploration across "premium no-storefront" domains.** Three domains mined in depth (Private Chef, In-Home Therapist, High-End Tattoo Artist). A fourth domain (Residential Architect / "case study" model) was considered and rejected as incompatible with marketplace reality — beauty professionals will not write per-item briefs.

**Accepted Core Premium Grammar (5 principles carried forward):**

1. **[P1-CHEF-2] Macro Craft Hero** — the hero visual is macro work photography, not a master selfie. Craft leads; face follows.
2. **[P1-THERAPIST-4] First-Person Voice** — master bios are enforced in first-person singular via onboarding UI placeholders. No institutional "our team" voice. Structural, not aspirational.
3. **[P1-THERAPIST-5] Arrival Orchestration** — the public profile shows only neighborhood + radius, never exact address. Post-booking, a system-released "Arrival Ritual" card unlocks door code, bell info, and waiting-café details as a VIP reveal — not an address dump.
4. **[P1-TATTOO-2] Specialty Lens / Filtering** — specialty chips above the portfolio replace the "About Me" paragraph. Tapping a chip reshuffles the grid in place. Master picks chips from a controlled list at onboarding; no sentences required.
5. **[P1-TATTOO-3] Dominant Visual Grid** — the grid is not a section below the fold. It is 60–70% of the first screen's visual mass. Price, CTA, and identity orbit the grid. The work *is* the claim, not evidence supporting the claim.

**Unifying philosophy (Eljar's articulated principle):** *Structural, not aspirational.* Accept ideas the UI can enforce. Reject ideas that depend on the master being articulate, pedigreed, or available for post-service follow-up. No friction at booking. No scarcity theater. No heavy copywriting burden on masters.

**Dropped (and why):**
- Scarcity framing / inquiry-style CTAs — kill marketplace economics and punish young masters who need booking volume.
- Studio walkthrough, training lineage, "what I don't do" sections — clutter, spam risk, unrealistic for 95% of the base.
- Case Study / brief-per-item portfolio model — too much copywriting burden on masters.
- The Healed Shot — relies on uncontrollable post-service interaction we cannot guarantee.

### Phase 2 — Morphological Analysis

**Outcome:** 5-axis matrix produced 10 candidate concepts. All 10 rejected by Eljar as missing a critical structural constraint: **Salons have multiple staff members; Private Masters do not.** This creates fundamentally different booking flows, hero treatments, and portfolio architectures — not just a skin swap.

**Eljar's Merged Concept (executive decision, carried forward as the sole candidate):**

**1. Hero Section — The Visual Differentiator:**
- **Private Master:** Small high-quality avatar + first-person bio + arrival orchestration (address hidden until booking). *"We sell the Personality."*
- **Salon:** Dominant grid of interior/vibe photos + logo + full address openly visible. *"We sell the Establishment."*

**2. Portfolio Treatment — Service Gallery (C7-derived):**
- No single "wall of photos" on the page.
- Portfolio is **strictly integrated into the service list.** Each service listing (e.g., "Balayage — €150") carries a mini-carousel of photos specific to that service directly beneath it.

**3. Booking Flow — The Staff Router:**
- **Private Master:** User clicks "Book" → calendar (1-step).
- **Salon:** User clicks "Book" → "Choose Specialist (or Any Available)" modal → calendar (2-step).

### Phase 3 — Constraint Mapping + Adversarial Pressure-Test

**Round 1 — Grading Eljar's Merged Concept:**

The C7-derived service-gallery concept was graded against 12 hard constraints and 5 Phase 1 principles. Results: 8 PASS, 3 CAUTION, 2 FAIL, 1 ORPHANED. All failures concentrated in Private Master first-screen visual impact.

**Six adversarial failure modes identified:**

1. **"Empty Carousel" (Critical)** — services with zero tagged photos create broken visual states. A new master with 12 services and 8 photos has most carousels empty.
2. **"Tagging Burden" (High)** — per-upload photo-to-service classification is friction. Cross-service photos (gel + nail art) have no clean home. Optional tagging means untagged photos disappear.
3. **"Private Master's Empty Throne" (High)** — Private hero = small avatar + text. Salon hero = visual grid. Ironically makes Salon pages richer than Private at first glance. Directly contradicts P1-CHEF-2 and P1-TATTOO-3.
4. **"Orphaned Specialty Chips" (Medium)** — no global grid means chips have no surface to filter.
5. **"Carousel Scroll Fatigue" (Medium)** — 15 services × 15 carousels = conveyor belt page.
6. **"Single-Specialist Salon" (Low)** — specialist modal with 1 option is absurd.

**Outcome:** Concept abandoned due to adversarials #1–#3. Eljar requested a synthesized fix.

**Round 2 — "Craft Wall + Service Menu" Synthesis:**

Proposed a global portfolio grid (restored) as Private Master hero, clean service menu with optional one-tap cover photo per service, and the same Team + Service structure for Salons. All 6 adversarials resolved. All 5 Phase 1 principles restored.

**Round 3 — Eljar's Final Executive Architecture:**

Eljar accepted the Craft Wall + Service Menu synthesis but made three decisive refinements:

1. **Killed specialty filter chips.** Global grid is an unfiltered random mix from all services — its job is to create the premium vibe, not to be a search tool.
2. **Replaced optional cover photo model with "Cover Photo + Deep Dive Modal" pattern.** Each service shows one cover photo (auto-assigned: first uploaded photo). A subtle link ("See 24 more photos") opens a full-screen modal/lightbox of all photos tagged to that service.
3. **Unified the upload model.** Masters upload photos PER SERVICE in their dashboard (upload INTO a service folder = implicit tagging, zero friction). System auto-assigns first photo as cover, feeds all photos into the global grid, and hides the rest behind the deep dive link.
4. **Applied the same modal pattern to Salon Team section.** Specialist cards are clean (avatar + name + rating + "See Anna's 45 photos" deep dive link). No inline thumbnail clutter.
5. **Added specialist watermark in Salon service modals.** Photos show which specialist did the work. Booking from a photo pre-selects that specialist.

---

## Final Concept — "Craft Wall + Cover Photo + Deep Dive Modal"

### Shared Design Pattern (Both Page Types)

**The "Cover Photo + Deep Dive" mechanism:**
- Each service in the price list shows ONE cover photo (auto-assigned: first uploaded photo for that service)
- Below the cover photo: a subtle text link "See N more photos"
- Tapping the link opens a full-screen modal/lightbox gallery of ALL photos for that specific service
- Services with zero photos: clean text row (name · duration · price), no visual embarrassment

**The Upload Model (Master Dashboard):**
- Master navigates to a specific service (e.g., "Балаяж") in their dashboard
- Uploads photos directly into that service's folder
- System auto-assigns first photo as cover photo (changeable)
- ALL uploaded photos are simultaneously fed into the Global Grid (random mix)
- Result: upload once → appears in two places (global grid + service deep dive)
- Zero tagging, zero classification, zero friction

### Private Master Page

**Screen 1 — "The Craft Wall" (above the fold):**
- **Dominant portfolio grid** — 60-70% of visual mass. Random mix from all services. Macro work photography. Creates the premium first impression.
- **Compact identity card** (overlaid or adjacent): small avatar, master name (Playfair Display), first-person one-liner bio (enforced via UI placeholders), neighborhood + radius ("Частный кабинет · Mitte · 10 min от U-Bahn"), sticky "Записаться" CTA.
- **No filter chips.** The grid's job is to create vibe and show breadth, not to be a search tool.

**Screen 2 — "The Service Menu" (below the fold):**
- Clean service list: service name · duration · price
- Each service: one cover photo + "See N more photos" deep dive link
- Per-service "Записаться" CTA → **1-step booking** (straight to calendar)

**Visual hierarchy:** The work IS the hero. The face is secondary. The Private Master page is the most visually striking page on the platform.

### Salon Page

**Screen 1 — "The Establishment" (above the fold):**
- Salon logo + name + full address (openly shown)
- Horizontal interior/vibe photo strip (establishing shots, not dominant grid)
- Salon description (institutional voice)

**Screen 2 — "The Team":**
- Clean specialist cards: avatar + name + specialty + rating
- "See Anna's 45 photos" deep dive link → opens modal with that specialist's personal portfolio grid
- **No inline thumbnails on the card.** 10 staff members × 6 thumbnails each = visual chaos. The deep dive modal keeps cards clean.

**Screen 3 — "Services + Prices":**
- Same Cover Photo + Deep Dive pattern as Private Master
- Each service shows which specialist(s) offer it
- **Multi-staff twist:** Inside the service deep dive modal, photos carry a small specialist avatar/name watermark. Tapping "Book" from a specific photo pre-selects that specialist in the 2-step routing flow.

**Booking:** Tap "Book" → "Choose Specialist (or Any Available)" modal → calendar. Skipped if only 1 specialist offers that service.

**Admin upload:** Salon owner uploads photos into a Specialist → Service folder structure. System handles the rest (cover photo auto-assignment, global grid feeding, deep dive modal population).

### Unified Codebase Architecture

Both Private Master and Salon pages use the **exact same components:**
- `<CraftWallGrid>` — the global random-mix portfolio grid (Private Master hero / Salon specialist modal)
- `<ServiceMenu>` — the clean price list with Cover Photo + Deep Dive
- `<DeepDiveModal>` — the full-screen lightbox, reused for service photos AND specialist portfolios
- `<BookingCTA>` — 1-step (Private) or 2-step with specialist routing (Salon)

### Phase 1 Grammar — Final Status

| Principle | Status | Implementation |
|---|---|---|
| P1-CHEF-2 Macro Craft Hero | **PRESERVED** | Global grid of macro work photography is the hero |
| P1-THERAPIST-4 First-Person Voice | **PRESERVED** | Bio enforced in first-person via UI placeholders |
| P1-THERAPIST-5 Arrival Orchestration | **PRESERVED** | Neighborhood + radius only; address released post-booking |
| P1-TATTOO-2 Specialty Lens | **EVOLVED** | Filter chips dropped. Replaced by service-scoped deep dive modals — filtering is implicit (tap a service → see only that work) |
| P1-TATTOO-3 Dominant Visual Grid | **PRESERVED** | Global grid dominates 60-70% of Private Master screen 1 |

### Adversarial Resolution — Final Status

| # | Adversarial | Status | Resolution |
|---|---|---|---|
| #1 Empty Carousel | **KILLED** | No carousels. Global grid shows all photos. Cover photos are auto-assigned. Services with zero photos = clean text rows. |
| #2 Tagging Burden | **KILLED** | Upload-per-service = implicit tagging. Zero classification friction. |
| #3 Empty Throne | **KILLED** | Private Master screen 1 = dominant craft grid. Visually richer than Salon at first glance. |
| #4 Orphaned Chips | **KILLED** | Chips intentionally dropped. Deep dive modals provide service-scoped filtering. |
| #5 Carousel Fatigue | **KILLED** | No carousels. One cover photo + text link per service. |
| #6 Single-Specialist | **KILLED** | Conditional modal skip. |

### Design Constraints Compliance

All hard constraints (Old Money aesthetic, existing tokens, radical price transparency, no copywriting burden, no booking friction, structural-not-aspirational, evolvable from current codebase, Private Master dignity) are satisfied.

---

## Session Output

**Phase 4 (Solution Matrix) skipped** — single converged concept, no comparison needed.

**Implementation Blueprint generated:** `_bmad-output/BLUEPRINT-salon-slug-redesign.md`

Covers: core component list (10 components), data model changes (`PortfolioPhoto` model + `Staff.specialty` + `Profile.arrivalInfo`), upload flow for both provider types, booking flow (1-step and 2-step), 15 non-negotiable UX rules, API endpoint reference, component-to-entity matrix, and migration path from current String[] schema.

**Session complete.** 2026-04-12.
