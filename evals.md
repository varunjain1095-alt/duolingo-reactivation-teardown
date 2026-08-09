# Duolingo Reactivation Engine — Test & Verification Evaluation Matrix (`evals.md`)

This document defines the comprehensive test matrix, evaluation protocols, expected behaviors, and pass/fail criteria for verifying each phase of the **Duolingo Reactivation Engine**, as specified in [`context.md`](file:///c:/Projects/Duolingo%20project%20teardown/context.md), [`architecture.md`](file:///c:/Projects/Duolingo%20project%20teardown/architecture.md), [`implementation_plan.md`](file:///c:/Projects/Duolingo%20project%20teardown/implementation_plan.md), and [`edge-case.md`](file:///c:/Projects/Duolingo%20project%20teardown/edge-case.md).

---

## 1. Overview & Verification Strategy

```
Phase 1: Data & Schema Evals ──> Phase 2: Engine & Classifier Unit Evals (Hard Gate 2.6)
                                                                 │
                                                                 ▼
Phase 5: E2E & Fallback Evals <── Phase 4: Badge & Skip Evals <── Phase 3: UI & Joyride Evals
```

Evaluation is structured into 5 phase gates. **Phase 2.6 (Engine Verification Gate)** serves as a strict hard gate: all Python classifier logic and REST API contract evals must pass 100% before Phase 3 UI development begins.

---

## 2. Phase 1 Evaluation: Setup & Data Layer (PostHog & Supabase)

### Eval 1.1: Supabase `feature_definitions` Table Schema & Constraints
* **Test Scenario:** Execute DDL script in Supabase PostgreSQL; insert valid feature rows, invalid duplicate `feature_id`s, and mutation links via `replaces_feature_id`.
* **Expected Behavior:** Table creates successfully with primary key, default `user_facing = true`, and foreign key constraints on `replaces_feature_id`.
* **Pass Criteria:**
  * Inserting a row with an invalid `replaces_feature_id` throws a Foreign Key Violation error.
  * Queries filtering `WHERE user_facing = true` execute in $< 10\text{ms}$.
* **Fail Criteria:** Foreign key constraint missing or `user_facing` defaults to `NULL`.

### Eval 1.2: PostHog Ingestion & Pro Nudge Data Schema Retrieval
* **Test Scenario:** Ingest mock PostHog session events and query user Pro nudge interaction stats (`times_declined`, `avg_decline_speed`, `ever_trialed`).
* **Expected Behavior:** Query returns typed dictionary with integer `times_declined`, float `avg_decline_speed`, and boolean `ever_trialed`.
* **Pass Criteria:** `times_declined` returns exact integer count of past decline events.
* **Fail Criteria:** Missing fields or untyped null values returned.

---

## 3. Phase 2 Evaluation: Core Decision Engine & Classifier (Hard Gate 2.6)

> [!IMPORTANT]
> **Hard Verification Gate:** Phase 3 UI development is blocked until all Eval 2.1 – Eval 2.8 pass with 100% test coverage in `pytest`.

### Eval 2.1: Engagement Depth Threshold Boundary Test
* **Test Matrix:**

| Sub-Case | Touchpoint Input | Expected `engaged` Output | Rationale |
|---|---|---|---|
| **2.1.a** | `duration = 2.9s`, `frequency = 2` | `False` | Below 3.0s duration and $\le 2$ frequency |
| **2.1.b** | `duration = 3.0s`, `frequency = 1` | `True` | Reaches 3.0s duration threshold |
| **2.1.c** | `duration = 0.2s`, `frequency = 3` | `True` | Frequency override ($> 2$) applies |

* **Pass Criteria:** All 3 sub-cases evaluate exactly as specified in the test matrix.
* **Fail Criteria:** 2.1.c returns `False` (ignoring frequency override) or 2.1.a returns `True`.

### Eval 2.2: Mechanic Mutation Automatic Inclusion & Priority
* **Test Scenario:** User touched `hearts_system` pre-churn. Current feature catalog contains `energy_system` with `replaces_feature_id = "hearts_system"`.
* **Expected Behavior:** `energy_system` is categorized as `mechanic_mutation` and placed as the **first item** in `spotlight_sequence` for both Broad and Narrow tiers.
* **Pass Criteria:** `spotlight_sequence[0].type == "mechanic_mutation"` and `spotlight_sequence[0].feature_id == "energy_system"`.
* **Fail Criteria:** Mutation item omitted, placed after workflow matches, or missing from Narrow tier.

### Eval 2.3: Workflow Matches Computation & De-duplication
* **Test Scenario:** User engaged with `practice_option` pre-churn. `practice_option` remains active in current catalog and was not replaced.
* **Expected Behavior:** `practice_option` is included in `workflow_matches` with `type == "workflow_match"`. Features replaced by a mutation are excluded from `workflow_matches` to prevent duplication.
* **Pass Criteria:** `practice_option` present in `spotlight_sequence` for both Broad and Narrow tiers with `type == "workflow_match"`; no duplicate feature IDs present in output.
* **Fail Criteria:** `practice_option` typed as `"introduction"` or `"mechanic_mutation"`, or replaced pre-churn feature appears in both mutation list and workflow match list.

### Eval 2.4: Broad vs. Narrow Persona Tier Sequencing
* **Test Matrix:**

| Tier | Pre-Churn History | Current Catalog | Expected `spotlight_sequence` Composition |
|---|---|---|---|
| **Narrow** | Engaged Feature A | Feature A, New Feature B (intro post-churn) | `[Feature A]` (Workflow match only) |
| **Broad** | Engaged Feature A | Feature A, New Feature B (intro post-churn) | `[Feature A, Feature B]` (Workflow match + Arbitrary expansion) |

* **Pass Criteria:** Narrow tier contains ZERO un-engaged/arbitrary new features; Broad tier appends up to $2\text{--}3$ new user-facing features (`intro_date > last_active` and `user_facing = true`).
* **Fail Criteria:** Narrow tier includes arbitrary new features or Broad tier includes pre-existing un-engaged features.

### Eval 2.5: Scoped `custom_tour.selectable_items` Candidate Pool
* **Test Scenario:** Feature catalog contains 10 user-facing features:
  * 2 Workflow Matches
  * 1 Mechanic Mutation
  * 2 New Features launched post-last-active
  * 5 Pre-existing features predating last-active (never touched pre-churn)
* **Expected Behavior:** `custom_tour.selectable_items` contains exactly **5 items** (2 workflow matches + 1 mutation + 2 new features).
* **Pass Criteria:** The 5 pre-existing untouched features are 100% excluded from `selectable_items`.
* **Fail Criteria:** All 10 features appear in `selectable_items`.

### Eval 2.6: Pro Guardrail Logic (`times_declined >= 1`)
* **Test Matrix:**

| Sub-Case | Input `pro_nudge_history` | Expected `pro_prompt_delay` |
|---|---|---|
| **2.6.a** | `times_declined = 0` | `False` |
| **2.6.b** | `times_declined = 1` | `True` |
| **2.6.c** | `times_declined = 3` | `True` |

* **Pass Criteria:** All sub-cases match table.
* **Fail Criteria:** `times_declined = 1` yields `False`.

### Eval 2.7: REST API Output Schema Contract Validation (Spec Section 8.4)
* **Test Scenario:** Send valid POST request to `/api/v1/reactivation/evaluate`.
* **Expected Behavior:** API returns HTTP 200 JSON object containing mandatory keys: `reintroduction_payload`, `spotlight_sequence`, `pro_prompt_delay`, `badge_state`, `badge_options`.
* **Pass Criteria:** OpenAPI schema validation passes with 0 missing fields or type mismatches.
* **Fail Criteria:** Any of the 5 top-level keys is missing or returned as `null`.

### Eval 2.8: Initial Auto-Tour Cap vs. Uncapped Badge Options
* **Test Scenario:** Construct a user profile with 11 total eligible items across categories (e.g., 3 mechanic mutations, 5 workflow matches, 3 new features).
* **Expected Behavior:**
  1. The initial Duo-modal `spotlight_sequence` (shown before any skip) is truncated to exactly **6 items** in strict priority order (Mutations $\rightarrow$ Workflow Matches $\rightarrow$ Arbitrary New Features).
  2. `badge_options.complete_tour.spotlight_sequence` contains all **11 uncapped eligible items**.
  3. `badge_options.half_tour.spotlight_sequence` contains $\lceil 11 / 2 \rceil = \mathbf{6\text{ items}}$, calculated from the uncapped total of 11.
* **Pass Criteria:**
  * Initial sequence length == 6 and matches priority order.
  * `complete_tour` length == 11.
  * `half_tour` length == 6 (computed from 11).
* **Fail Criteria:** Initial sequence exceeds 6 items, OR `complete_tour`/`half_tour` are computed from the capped 6 instead of the full 11.

---

## 4. Phase 3 Evaluation: Frontend React Overlay & Joyride Integration

### Eval 3.1: Duo Mascot Modal Rendering & Tone Adaptation
* **Test Scenario:** Render Duo Modal using engine payload. Test Broad tier (`tone = "celebratory"`) vs. Narrow tier (`tone = "action_oriented"`).
* **Expected Behavior:** Stats render dynamic achievement values (`lessons_completed`, `streak_length`, etc.). Visual styling and text adapt according to `tone`.
* **Pass Criteria:** Duo stats display correct user values; CTA buttons ("Continue" / "Skip") render cleanly.
* **Fail Criteria:** Hardcoded stat values displayed or "Skip" button unclickable.

### Eval 3.2: React Joyride Spotlight Target Anchoring
* **Test Scenario:** Trigger Joyride spotlight sequence with `target_element = "#energy-indicator"`.
* **Expected Behavior:** Joyride tooltip anchors precisely to `#energy-indicator` DOM element, darkening surrounding UI.
* **Pass Criteria:** Tooltip message matches payload `message`; clicking "Next" advances to next step.
* **Fail Criteria:** Spotlight anchors to top-left `body` due to invalid CSS selector.

---

## 5. Phase 4 Evaluation: Skip Path & Persistent Badge Lifecycle

```
Badge Lifecycle State Machine:
 [Modal Skip] ──> badge_state: "active" ──>[Badge Click + Tour Finish]──> badge_state: "expired"
```

### Eval 4.1: Duo Modal Skip Action & Revision Lesson Routing
* **Test Scenario:** User clicks "Skip" on step 1 of Duo Modal.
* **Expected Behavior:**
  1. Modal unmounts.
  2. Router navigates user directly to `/lesson/revision`.
  3. Duo reassurance toast displays briefly ("Tour available anytime via badge").
  4. `badge_state` updates to `"active"`.
  5. Persistent badge renders bottom-right.
* **Pass Criteria:** User lands on Revision Lesson route and bottom-right badge is visible.
* **Fail Criteria:** User remains on home screen or persistent badge fails to render.

### Eval 4.2: Tour Selection Modal (3 Options)
* **Test Scenario:** Click persistent badge while `badge_state == "active"`.
* **Expected Behavior:** Tour Selection Modal opens displaying 3 options: Complete Tour, Half Tour, Custom Tour.
* **Pass Criteria:**
  * **Complete Tour:** Triggers full uncapped `complete_tour.spotlight_sequence`.
  * **Half Tour:** Triggers `half_tour.spotlight_sequence` (half of total items).
  * **Custom Tour:** Displays checkbox list of `custom_tour.selectable_items`.
* **Fail Criteria:** Modal fails to open or options render empty sequences.

### Eval 4.3: Custom Tour Checkbox Selection & Badge Expiration
* **Test Scenario:** Select 1 feature in Custom Tour checkbox list and click "Start Tour". Complete the spotlight step.
* **Expected Behavior:** Joyride executes spotlight for selected feature only. Upon completion, `badge_state` transitions to `"expired"` and badge unmounts from UI. Fallback option remains accessible in Settings menu.
* **Pass Criteria:** Badge disappears from home screen after tour completion; Settings menu contains functional "Take UI Tour" link.
* **Fail Criteria:** Badge persists on home screen after tour completion.

---

## 6. Phase 5 Evaluation: End-to-End System & Fallback Scenarios

### Eval 5.1: Missing DOM Target Fallback in React Joyride
* **Test Scenario:** `spotlight_sequence` contains target `#missing-element` which does not exist in DOM.
* **Expected Behavior:** React Joyride detects missing target node, skips step silently, and moves to next valid spotlight item.
* **Pass Criteria:** No uncaught JavaScript runtime exceptions thrown; user flow completes smoothly.
* **Fail Criteria:** White screen crash or unhandled React exception.

### Eval 5.2: Supabase / Database Connection Timeout Fallback
* **Test Scenario:** Simulate network disconnect / database query timeout ($> 150\text{ms}$) during API evaluation request.
* **Expected Behavior:** Engine degrades gracefully to safety fallback (Narrow tier, static default achievements, core cached mutations).
* **Pass Criteria:** App launch succeeds without 500 server error; user receives baseline re-orientation flow.
* **Fail Criteria:** App launch hangs indefinitely or throws 500 Internal Server Error.

---

## 7. Master Pass / Fail Evaluation Checklist

- [ ] **Phase 1 Data Evals:** DDL schema created, FK constraints active, PostHog ingestion verified.
- [ ] **Phase 2 Hard Gate Evals (Pass 100% before Phase 3):**
  - [ ] Eval 2.1 Engagement Depth boundary tests (`pytest`)
  - [ ] Eval 2.2 Mechanic Mutation automatic inclusion & priority (`pytest`)
  - [ ] Eval 2.3 Workflow Matches computation & de-duplication (`pytest`)
  - [ ] Eval 2.4 Broad vs Narrow tier sequencing (`pytest`)
  - [ ] Eval 2.5 Scoped custom tour candidate pool (`pytest`)
  - [ ] Eval 2.6 Pro guardrail delay logic (`pytest`)
  - [ ] Eval 2.7 Section 8.4 REST API JSON contract validation (`pytest`)
  - [ ] Eval 2.8 Initial auto-tour cap vs. uncapped badge options (`pytest`)
- [ ] **Phase 3 UI Evals:** Duo Modal rendering, stat dynamic binding, React Joyride DOM targeting.
- [ ] **Phase 4 Badge Evals:** Skip path revision lesson routing, 3-option tour selection, custom tour execution, badge state expiration.
- [ ] **Phase 5 E2E Evals:** Missing DOM element silent skip, database timeout safety fallback execution.
