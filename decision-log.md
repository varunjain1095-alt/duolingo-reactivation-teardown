# Duolingo Reactivation Engine — Retroactive Architectural Decision Log (`decision-log.md`)

This document serves as the official retroactive changelog and decision record for all technical reviews, schema refinements, implementation fixes, and edge-case resolutions applied across the project specification suite.

---

## [Context] — Missing Spotlight Sequence Composition Rule
**Issue:** Section 7 of `context.md` lacked explicit composition rules for how persona tiers (Broad vs. Narrow) and Mechanic Mutations combine to form the final `spotlight_sequence`.
**Resolution:** Added Section 7.2 explicitly detailing: (1) Mechanic Mutations are always automatically included for both tiers, (2) Broad tier adds 2–3 arbitrary new user-facing features, and (3) Narrow tier includes workflow-matched features only.
**Reasoning:** Prevents developers from guessing tier composition rules or creating arbitrary LLM-based similarity filters, ensuring strict adherence to the deterministic no-LLM policy.
**Files affected:** [`context.md`](file:///c:/Projects/Duolingo%20project%20teardown/context.md)

---

## [Context] — Flagging Unresolved Open Items
**Issue:** Known open items (unquantified workflow-matching threshold and deferred feature prioritization) were omitted rather than explicitly tracked, risking unstated assumptions during engineering.
**Resolution:** Added Section 9.3 ("Open / Unresolved Items") to formally document these two items as open conceptual policies.
**Reasoning:** Prevents developers from inventing arbitrary mathematical thresholds or scoring algorithms for workflow matching without explicit user approval.
**Files affected:** [`context.md`](file:///c:/Projects/Duolingo%20project%20teardown/context.md)

---

## [Data Schema] — Table 4 Schema Field-Name Standardizations
**Issue:** Table 4 (Pro Nudge History) in Section 5.1 used `decline_count`, `dismiss_speed`, `accepted`, whereas Section 8.2 used `times_declined`, `avg_decline_speed`, `ever_trialed`.
**Resolution:** Standardized Table 4 schema definitions on `times_declined`, `avg_decline_speed`, `ever_trialed` across all documents.
**Reasoning:** Eliminates field name mismatches between database models and incoming JSON payload contracts that would break API serialization.
**Files affected:** [`context.md`](file:///c:/Projects/Duolingo%20project%20teardown/context.md), [`architecture.md`](file:///c:/Projects/Duolingo%20project%20teardown/architecture.md), [`data-schema.md`](file:///c:/Projects/Duolingo%20project%20teardown/data-schema.md)

---

## [Architecture] — Uncomputed `Workflow_Matches` in `process_reactivation`
**Issue:** The `ReactivationEngine.process_reactivation` Python method in `architecture.md` omitted `Workflow_Matches` computation, causing Narrow-tier users to receive only mutations.
**Resolution:** Implemented `Workflow_Matches` logic (filtering pre-churn engaged, non-replaced active features) and prepended them to `spotlight_sequence` for both Broad and Narrow tiers.
**Reasoning:** Ensures Narrow-tier users receive re-orientation spotlights for their own familiar pre-churn features rather than an incomplete tour containing only mutations.
**Files affected:** [`architecture.md`](file:///c:/Projects/Duolingo%20project%20teardown/architecture.md)

---

## [Architecture] — Engine Return Object Output Schema Incompleteness
**Issue:** The return dictionary of `ReactivationEngine.process_reactivation` was missing `reintroduction_payload` and `badge_options`, violating the Section 8.4 output contract.
**Resolution:** Added `PreChurnAchievements` data structures, dynamically generated `reintroduction_payload` (stats + tone), and populated `badge_options` (`complete_tour`, `half_tour`, `custom_tour`).
**Reasoning:** Guarantees the decision engine returns a complete payload matching the client SDK's expected JSON contract, preventing client-side `undefined` property crashes.
**Files affected:** [`architecture.md`](file:///c:/Projects/Duolingo%20project%20teardown/architecture.md)

---

## [Architecture] — Scoping `custom_tour.selectable_items` Candidate Pool
**Issue:** `custom_tour.selectable_items` pulled all `user_facing = true` features from the database catalog, exposing irrelevant pre-existing features never touched by the user.
**Resolution:** Scoped the selectable pool to the candidate feature set: pre-churn workflow matches, mechanic mutations, and features introduced since `last_active_timestamp`.
**Reasoning:** Prevents the custom tour selection UI from cluttering the user experience with irrelevant pre-existing features that the user was never exposed to or engaged with.
**Files affected:** [`architecture.md`](file:///c:/Projects/Duolingo%20project%20teardown/architecture.md)

---

## [Implementation Plan] — Build Order Violation & Phase 2.6 Hard Gate
**Issue:** `implementation_plan.md` scheduled frontend UI development (Phase 3 & 4) before testing decision engine rules (Phase 5), violating Spec Section 9's build-order rule.
**Resolution:** Created Step 2.6 ("Verification Gate") as a mandatory hard gate blocking Phase 3 until all classifier unit tests and API schema evaluations pass 100%.
**Reasoning:** Ensures engine classifier errors, threshold bugs, and schema mismatches are caught and resolved before building frontend overlay UI on top of them.
**Files affected:** [`implementation_plan.md`](file:///c:/Projects/Duolingo%20project%20teardown/implementation_plan.md)

---

## [Edge-Case Catalog] — Resolving Spotlight Cap Conflict with `complete_tour`
**Issue:** Section 4.2 of `edge-case.md` introduced a 6-item spotlight cap that conflicted with the spec's definition of `complete_tour` as containing the full uncapped sequence.
**Resolution:** Clarified via Option A: the 6-item cap applies *only* to the initial automatic Duo spotlight sequence (to prevent first-run onboarding fatigue), while `complete_tour` in `badge_options` remains genuinely uncapped.
**Reasoning:** Protects first-run user experience from tour fatigue while ensuring users who explicitly request a "Complete Tour" via the persistent badge receive the full, un-truncated feature tour.
**Files affected:** [`edge-case.md`](file:///c:/Projects/Duolingo%20project%20teardown/edge-case.md), [`evals.md`](file:///c:/Projects/Duolingo%20project%20teardown/evals.md)

---

## [Edge-Case Catalog] — Removing Non-Spec Pro Subscriber Scenario
**Issue:** Section 5.1 introduced `subscription_status` as a Pro guardrail condition, referencing an un-schematized field absent from the Section 8.2 input schema contract.
**Resolution:** Removed the non-spec scenario and standardized Section 5.1 strictly on the schema's `pro_nudge_history.times_declined >= 1` logic.
**Reasoning:** Prevents introducing undeclared data dependencies into the engine payload that would break input validation contracts.
**Files affected:** [`edge-case.md`](file:///c:/Projects/Duolingo%20project%20teardown/edge-case.md)

---

## [Evals] — Adding Eval 2.8 for Initial Auto-Tour Cap vs. Uncapped Badge Options
**Issue:** The hard-gate test suite lacked test coverage verifying the 6-item initial spotlight cap and its separation from uncapped badge options.
**Resolution:** Added `Eval 2.8` to Phase 2.6 unit tests and Section 7 checklist, asserting initial sequence == 6 items (prioritized) while `complete_tour` == 11 items and `half_tour` == 6 items ($\lceil 11 / 2 \rceil$).
**Reasoning:** Closes the verification gap between the edge-case resolution and automated test coverage, ensuring cap logic doesn't leak into badge-triggered tours.
**Files affected:** [`evals.md`](file:///c:/Projects/Duolingo%20project%20teardown/evals.md)

---

## [Schema] — Adding `"workflow_match"` to `spotlight_sequence[].type` Enum
**Issue:** `spotlight_sequence[].type` used only `"introduction"` and `"mechanic_mutation"`, causing re-engaged pre-churn features (like Practice Hub) to be mistyped as `"introduction"`.
**Resolution:** Expanded the type enum to include `"workflow_match"`, updated payloads across all documents, and updated `ReactivationEngine.process_reactivation` to emit `"workflow_match"`.
**Reasoning:** Prevents the frontend overlay from applying "new feature" visual badges or copy to familiar features that returning users already engaged with pre-churn.
**Files affected:** [`context.md`](file:///c:/Projects/Duolingo%20project%20teardown/context.md), [`architecture.md`](file:///c:/Projects/Duolingo%20project%20teardown/architecture.md), [`evals.md`](file:///c:/Projects/Duolingo%20project%20teardown/evals.md), [`data-schema.md`](file:///c:/Projects/Duolingo%20project%20teardown/data-schema.md)

---

## [Schema] — Undefined Transformation for `league_wins` Passthrough
**Issue:** Input schema contained `pre_churn_achievements.league_placements` (string, e.g., `"Gold"`), but output schema required `reintroduction_payload.stats.league_wins` (integer, e.g., `2`), with no conversion rule.
**Resolution:** Standardized input schema to include `"league_wins": 2` directly in `pre_churn_achievements`, allowing direct passthrough to the output payload.
**Reasoning:** Eliminates invalid runtime assumptions or string-parsing logic when constructing Duo's reintroduction stat payload.
**Files affected:** [`context.md`](file:///c:/Projects/Duolingo%20project%20teardown/context.md), [`architecture.md`](file:///c:/Projects/Duolingo%20project%20teardown/architecture.md), [`data-schema.md`](file:///c:/Projects/Duolingo%20project%20teardown/data-schema.md)
