# GeoZone AI Design System

Status: **Audit and refactor plan only**  
Scope of this document: visual hierarchy, layout, interaction clarity, accessibility, and styling. Functional behavior, routes, state, API calls, props, and data contracts remain unchanged.

## Product direction

GeoZone AI is a Da Nang-first travel discovery and itinerary-planning product. Its differentiator is practical, geographic planning: destinations are clustered into zones, then selected and scheduled against time, budget, preferences, and optional LLM/RAG narration.

The interface has two deliberate modes:

1. **Inspiration / discovery** — the homepage and destination discovery experience should create desire to travel through photography, movement, and editorial composition.
2. **Utility / planning** — planner, timeline, saved trips, favorites, authentication, account, and admin workspaces should feel quiet, structured, and easy to scan while making budget and schedule decisions.

## Non-negotiable design rules

### Two-zone visual strategy

- Preserve the homepage's five-panel photographic composition, artistic dark background, central hero copy, and hover motion. The existing `.gz-p` interaction expands the hovered panel; this remains the signature motion.
- Do not replace the homepage with a flat canvas or remove the image treatment. Any refinement must use GPU-friendly `transform: scale(...)`, `overflow: hidden`, restrained scrims, and accessible contrast without changing the composition or interaction.
- Use a warm, calm light workspace for functional views: `#F8FAFC` or `#FAFAF8` canvas, white surfaces, `#0F172A` primary ink, and `#475569` secondary ink.
- Keep imagery editorial and useful: fixed aspect ratios, `object-fit: cover`, meaningful alt text, and no decorative image that competes with the primary task.

### Anti-AI-slop rules

- No purple, indigo, cyan, or neon gradients.
- No glowing borders, excessive blur, or muddy glassmorphism. A translucent treatment is reserved for the existing homepage hero scrim/pill where it protects contrast.
- Avoid nested card-inside-card structures. Prefer whitespace, one-pixel hairlines, grouping by typography, and one clear surface boundary.
- Use `lucide-react` for interface icons. Do not introduce raw emoji as UI icons. Keep icons at `1.75` stroke width and pair them with visible text where an action could be ambiguous.
- Keep buttons purposeful: one primary action per region, secondary actions visually quieter, destructive actions explicit.

### Palette

- **Coastal ocean primary:** `#0B6E8E`; hover `#095A73`; soft tint `#E6F3F6`.
- **Warm sand highlight:** `#B7791F`; soft tint `#FFF5D9`. Use for ratings, selected highlights, and non-error attention.
- **Ink:** `#0F172A`; secondary `#475569`; muted `#64748B`.
- **Canvas:** `#FAFAF8`; alternate canvas `#F8FAFC`; surface `#FFFFFF`.
- **Lines:** `#E2E8F0`; stronger line `#CBD5E1`.
- **Success / warning / danger:** restrained semantic colors, never neon.
- Geographic zones have five distinct but muted colors so clustering can be read without relying on text alone:
  - Z1: sea blue
  - Z2: sage
  - Z3: sand
  - Z4: terracotta
  - Z5: lavender-grey

Zone color is always paired with a zone label or iconography; color is not the sole accessibility cue.

### Typography and numbers

- Use **Be Vietnam Pro** for Vietnamese diacritics and compact UI text. Use a restrained display weight for hero headings only.
- Keep body copy at a comfortable reading size and line height. Avoid excessive uppercase and italic text.
- Apply `font-variant-numeric: tabular-nums` to times, budgets, costs, ratings, distances, and durations. This keeps itinerary columns and financial comparisons aligned.
- Use sentence case for actions and labels. Keep Vietnamese terminology consistent across discovery, planning, saving, and account flows.

## UX psychology rules

- **Hick's Law:** group planner inputs into destination/time, budget, preferences, and AI enrichment. Keep one dominant “Tạo lịch trình tối ưu” action and make active tag states unmistakable.
- **Miller's Law / chunking:** use day tabs or clearly separated day sections, then time-of-day and zone groups inside each day.
- **Progressive disclosure:** timeline cards expose time, image, name, zone, cost, and quick actions first. Address, hours, narrative, tips, and other secondary metadata belong in an expandable detail area or drawer.
- **Doherty threshold:** use skeletons and staged status copy during generation, while preserving the existing loading and error behavior.
- **Recognition over recall:** maintain visible city, day, budget, and zone context. Never hide the current mode or selected city behind an icon-only control.
- **Accessible motion:** preserve the homepage hover delight, but provide `prefers-reduced-motion` fallbacks and never rely on motion to communicate state.

## Component-by-component refactor plan

The following inventory is based on the current `frontend/src` tree. The plan is styling and hierarchy work only; every existing handler, prop, state variable, API call, form field, route, and data field is retained.

### Application shell and pages

- `App.jsx` — preserve view switching, auth hydration, trip/favorite state, cart, admin actions, toasts, and modal contracts; simplify shell spacing and establish workspace surface tokens.
- `main.jsx` — preserve the React entry point; load global tokens before existing styles.
- `pages/HomePage.jsx` — preserve the five city image panels, central hero copy, CTA destinations, background treatment, and hover-expand animation. Refine contrast and motion performance only.
- `pages/ExplorePage.jsx` — clarify the Explore/Planner mode switch, city context, filter-to-map relationship, and planner result hierarchy without changing generation or swap flows.
- `pages/AboutPage.jsx` — apply the editorial workspace layout and replace decorative emoji icons with Lucide icons while preserving content.
- `pages/AccountPage.jsx` — group profile, password, data export/reset, and account deletion actions with clear security/destructive affordances.
- `pages/TripsPage.jsx` — make saved-trip browsing scannable with consistent trip metadata, status, and detail actions; preserve open/delete behavior.
- `pages/FavoritesPage.jsx` — use a calm collection layout, city/zone context, empty state, and favorite actions without changing favorite APIs.

### Shared and layout components

- `components/layout/Navbar.jsx` — retain every navigation destination, auth state, cart access, and menu behavior; replace emoji branding/icons and improve active-state hierarchy.
- `components/layout/BottomBack.jsx` — keep the return affordance; reduce visual weight and ensure keyboard/focus clarity.
- `components/common/Header.jsx` — preserve header actions and auth/admin controls; remove gradient-heavy treatment and use Lucide icon buttons with labels/tooltips.
- `components/common/Footer.jsx` — keep links/content; align it to the workspace footer rhythm.
- `components/common/LoadingSpinner.jsx` — retain loading semantics; align visual treatment with skeleton/status tokens.
- `components/common/Toast.jsx` — preserve timing and message behavior; improve contrast, icon semantics, and placement.

### Discovery and map components

- `components/explore/ExploreTopBar.jsx` — make city, mode, and cart state visible at a glance; preserve all callbacks.
- `components/explore/FilterPanel.jsx` — chunk search, tags, zone, cost, open-now, and sort controls; preserve every filter and admin action.
- `components/explore/PlaceCard.jsx` — use fixed-ratio image, concise metadata, zone badge, cost, favorite, and cart actions; keep all existing click contracts.
- `components/explore/ExploreMap.jsx` — preserve Leaflet map behavior and markers; improve legend, controls, and responsive list/map switching.
- `components/map/ZoneMapView.jsx` — preserve zone visualization and data; use the five zone tokens and a readable legend.
- `components/legacy/Geozone1Frame.jsx` — preserve the legacy frame integration and navigation boundary; only normalize its surrounding shell if still used.

### Planner, timeline, and summary components

- `components/form/TripInputForm.jsx` — preserve destination, days, budget, tags, RAG toggle, submit, and loading behavior; reorganize into four low-friction input groups.
- `components/form/BudgetSlider.jsx` — preserve value/range behavior; add tabular budget formatting and a visible current-value/readability treatment.
- `components/form/TagSelector.jsx` — preserve tag IDs and selection callbacks; replace emoji icon strings with Lucide icon mapping and make selected states distinct.
- `components/planner/PlannerSidebar.jsx` — retain planner controls and submit flow; make the primary CTA persistent and secondary options quieter.
- `components/planner/PlannerResults.jsx` — preserve generated result, save, share, and timeline actions; make summary metrics and day chunks scannable.
- `components/planner/SwapModal.jsx` — preserve candidate filtering and swap confirmation; use a clear comparison layout and accessible dialog focus.
- `components/timeline/TimelineView.jsx` — preserve strategy status, save/share behavior, and day rendering; use day-level chunking and progressive disclosure.
- `components/timeline/DayCard.jsx` — preserve day data and actions; establish a strong day header and time-of-day/zone grouping.
- `components/timeline/PlaceItem.jsx` — preserve swap/favorite/detail actions; expose time, image, name, zone, cost first and move secondary detail into disclosure.
- `components/timeline/SwapModal.jsx` — preserve its timeline-specific swap flow; align it with the planner swap dialog to avoid two competing visual patterns.
- `components/summary/BudgetSummaryCard.jsx` — preserve budget calculations and warning/success messaging; use tabular numbers and restrained semantic emphasis.

### Saved trips and favorites

- `components/saved/MyTripsView.jsx` — preserve load/open/delete and RAG status behavior; use collection-level whitespace rather than nested cards.
- `components/saved/SavePlanModal.jsx` — preserve all save fields and submission behavior; use a focused dialog with clear title, validation, and primary action.
- `components/trips/TripCard.jsx` — preserve trip summary and selection actions; align city, dates/days, cost, and status in stable columns.
- `components/favorites/FavoriteCard.jsx` — preserve map/detail/remove actions; make city, zone, image, and rating easy to scan.

### Authentication and admin modals

- `components/auth/AuthModal.jsx` — preserve login/register tabs, fields, validation, demo/admin affordances, and auth callbacks; improve form grouping, error placement, and focus management.
- `components/modals/AuthModal.jsx` — audit against the auth component above and preserve whichever caller currently uses each contract; converge styling without deleting either integration.
- `components/modals/TripCartModal.jsx` — preserve cart contents, remove, and save-trip actions; clarify total cost and empty state.
- `components/modals/TripDetailModal.jsx` — preserve detail rendering and close behavior; use progressive disclosure for address, hours, narrative, and cost.
- `components/modals/AdminPlaceModal.jsx` — preserve create/edit fields and admin submit behavior; group geographic, schedule, cost, and descriptive fields with explicit validation.

## Implementation sequence after approval

1. Import `tokens.css` before existing global/component styles and verify no functional or layout regressions.
2. Refactor the shared shell and icon mapping first (`Navbar`, `Header`, buttons, dialogs, toast).
3. Refactor workspace views and planner/timeline hierarchy.
4. Refine discovery/map surfaces.
5. Tune responsive behavior, reduced motion, focus states, and numeric alignment.
6. Run the existing frontend build and manually verify auth, explore, planner generation, swap, save, share, favorites, and admin flows.

## Acceptance checklist

- No route, state variable, API call, prop contract, form input, button action, or data field is removed or disabled.
- Homepage imagery, five-panel composition, scrim, and hover-expand/zoom character remain intact.
- Functional workspaces use the light editorial theme and remain readable at mobile widths.
- No new raw emoji is used as a UI icon; Lucide icons use a consistent `1.75` stroke width.
- Zone colors remain distinct and are paired with text/shape labels.
- Times, costs, ratings, and durations use tabular numerals.
- Reduced-motion and keyboard focus behavior are covered.
