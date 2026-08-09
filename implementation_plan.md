# Duolingo Reactivation Engine — Phase-Wise Implementation Plan

This implementation plan details the step-by-step roadmap for building the **Duolingo Reactivation Engine**, derived directly from the specifications in [`context.md`](file:///c:/Projects/Duolingo%20project%20teardown/context.md) and the system architecture in [`architecture.md`](file:///c:/Projects/Duolingo%20project%20teardown/architecture.md).

---

## Architecture & Data Execution Pipeline Overview

```
Phase 1: Setup & Data Layer (PostHog + Supabase)
     │
     ▼
Phase 2: Core Python Decision Engine & Classifier
     │
     ▼ [HARD GATE: Step 2.6 Verification Gate Must Pass]
Phase 3: Frontend React Overlay & Duo Mascot Modal
     │
     ▼
Phase 4: Skip Path & Persistent Badge Architecture
     │
     ▼
Phase 5: End-to-End Integration Testing & Manual UI Verification
```

---

## Phase 1: Environment Provisioning & Data Layer Setup

### 1.1 PostHog Analytics Integration (Tables 1–4)
- [ ] **Account & API Key Setup:** Provision PostHog project and API key credentials for engine interaction.
- [ ] **Event Schema Tracking:** Verify event ingestion for `$session_id`, `feature_id`, `event_duration_seconds`, and user ID.
- [ ] **Pro/Nudge History Tracking (Table 4):** Standardize tracking for `times_declined` (int), `avg_decline_speed` (float), and `ever_trialed` (bool).

### 1.2 Supabase (PostgreSQL) Feature Catalog Setup (Table 5)
- [ ] **Database DDL Execution:** Execute PostgreSQL script to build `feature_definitions` table:
  ```sql
  CREATE TABLE feature_definitions (
      feature_id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      placement VARCHAR(64) NOT NULL,
      intro_date DATE NOT NULL,
      explanation TEXT NOT NULL,
      replaces_feature_id VARCHAR(64) REFERENCES feature_definitions(feature_id),
      user_facing BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  ```
- [ ] **Seed Metadata Ingestion:** Populate Table 5 with current Duolingo features (e.g., `hearts_system`, `energy_system`, `feed`, `practice_option`), linking mutation pairs via `replaces_feature_id` and setting `user_facing` flags.

---

## Phase 2: Core Python Decision Engine & Classifier

### 2.1 Data Models & Contract Definitions
- [x] Implement Pydantic / Dataclass definitions in Python for `PreChurnTouchpoint`, `PreChurnAchievements`, `FeatureDefinition`, `ProNudgeHistory`, and `EnginePayloadOutput`.

### 2.2 Engagement Depth Classifier
- [x] Implement engagement rule evaluator:
  $$\text{Engaged} = (\text{avg\_duration} \ge 3.0\text{s}) \lor (\text{frequency} > 2)$$

### 2.3 Three-Bucket Classifier & Persona Tier Sequencer
- [x] **Mechanic Mutation Extraction:** Scan `user_facing` features where `replaces_feature_id` matches a pre-churn touched feature; format as `mechanic_mutation` spotlight items. Automatically prepend to `spotlight_sequence` for both persona tiers.
- [x] **Workflow Matches Computation:** Filter pre-churn touchpoints where `engaged == True`, feature exists in active `user_facing` set, and was **not** replaced by a mutation. Append to base `spotlight_sequence` for both Broad and Narrow tiers.
- [x] **Broad Persona Tier Expansion:** If `persona_tier == "broad"`, append up to $2\text{--}3$ arbitrary new features where `intro_date > last_active.date()` and `user_facing == True`.

### 2.4 Pro Guardrail & Output Payload Formatter
- [x] **Pro Guardrail:** Evaluate `pro_history.times_declined >= 1` $\rightarrow$ set `pro_prompt_delay: true`.
- [x] **Reintroduction Payload Construction:** Format `stats` dictionary (`lessons_completed`, `league_wins`, `words_learned`, `streak_length`) and assign `tone` (`celebratory` for broad, `action_oriented` for narrow).
- [x] **Badge Options Construction:** Build `complete_tour`, `half_tour` (first $\lceil N/2 \rceil$ items), and `custom_tour` (selectable list scoped to workflow matches, mutations, and features launched post-last-active).

### 2.5 REST API Integration (FastAPI)
- [x] Expose POST `/api/v1/reactivation/evaluate` endpoint delivering the JSON schema contract specified in Spec Section 8.4.

### 2.6 Verification Gate (Hard Gate — Mandatory Before Phase 3)
> [!IMPORTANT]
> **Hard Verification Gate:** Phase 3 (Frontend UI work) CANNOT begin until all unit and API validation tests in Step 2.6 pass 100%. This enforces Spec Section 9's core build-order rule: the rules engine, tables, and API contracts must be fully functional and verified independently before visual design/UI development commences.

- [x] **Engine & Classifier Unit Tests (`pytest`):**
  - **Engagement Depth Thresholding:** Edge cases ($< 3\text{s}$ duration with $\le 2$ frequency = `False`, $\ge 3\text{s}$ or $> 2$ frequency = `True`).
  - **Mechanic Mutation Extraction:** Correct detection and automatic prepending of replaced features for both tiers.
  - **Workflow-Match Computation:** Verification that engaged, non-replaced pre-churn features are included for both Broad and Narrow tiers.
  - **Broad vs. Narrow Tier Sequencing:** Verification that Narrow tier yields `Mutations ∪ Workflow_Matches` and Broad tier yields `Mutations ∪ Workflow_Matches ∪ Arbitrary_New_Features` ($2\text{--}3$ features).
  - **Custom Tour Candidate Scoping:** Verification that `custom_tour.selectable_items` is strictly bounded to the candidate pool (workflow matches + mutations + new features launched post-last-active) and excludes pre-existing untouched features.
  - **Pro Guardrail Logic:** Verification that `times_declined >= 1` correctly sets `pro_prompt_delay: true`.
- [x] **API Schema Contract Validation:** Automated OpenAPI / Pydantic schema validation confirming POST `/api/v1/reactivation/evaluate` returns the exact Section 8.4 JSON output contract (`reintroduction_payload`, `spotlight_sequence`, `pro_prompt_delay`, `badge_state`, `badge_options`).

---

## Phase 3: Frontend Client Integration & Recreated UI Layer

### 3.1 Targeted Screen Recreation (Home / Lesson Path View)
- [x] Recreate Duolingo target home view in React, assigning explicit, named DOM identifiers (`#energy-indicator`, `#streak-indicator`, `#streak-shield-icon`, `#gems-indicator`, `#course-update-banner`, `#lesson-path-active-node`, `#nav-home`, `#nav-practice`, `#nav-league`, `#nav-feed`, `#nav-bird`, `#nav-more`) and Screen B Practice view (`#unit-rewind-card`, `#unit-rewind-start-button`, `#video-call-btn`) for spotlight targeting.

### 3.2 Duo Mascot Reintroduction Modal
- [x] Build custom full-screen modal component voiced by Duo.
- [x] Bind dynamic stats from `reintroduction_payload.stats` with tone adjustments (`celebratory` vs `action_oriented`).
- [x] Add "Continue" and "Skip" action handlers.

### 3.3 React Joyride Spotlight Integration
- [x] Integrate React Joyride overlay library into the React app.
- [x] Bind Joyride step runner to `spotlight_sequence` items returned by the Decision Engine API.

---

## Phase 4: Skip Path & Persistent Badge Architecture

### 4.1 Skip Action & Revision Lesson Routing
- [x] Bind "Skip" button tap to route user directly into a **Revision Lesson**.
- [x] Render Duo brief one-line reassurance toast ("Tour available anytime via badge; disappears once taken").

### 4.2 Persistent Tour Badge Component
- [x] Render fixed bottom-right badge labeled *"Take tour of the new UI features"*.
- [x] On badge click, open Tour Selection Modal offering 3 options:
  1. **Complete Tour:** Triggers full `complete_tour.spotlight_sequence`.
  2. **Half Tour:** Triggers truncated `half_tour.spotlight_sequence`.
  3. **Custom Tour:** Launches custom feature selection UI.

### 4.3 Custom Tour Checkbox Selection UI
- [x] Render interactive checkbox list built from `custom_tour.selectable_items` (`feature_id` + `one_liner`).
- [x] Upon user selection and submission, launch Joyride spotlight sequence targeting only selected items.
- [x] Mark `badge_state = "expired"` upon tour completion (removing badge), while preserving fallback access in **Settings**.

---

## Phase 5: End-to-End Integration Testing & Manual UI Verification

### 5.1 End-to-End System Integration Tests
- [x] **E2E Data Pipeline Integration:** Test real/mock PostHog and Supabase data ingestion flowing into FastAPI decision endpoints and delivering payloads to React client SDK.

### 5.2 Manual UI Flow & State Machine Verification
- [x] **Duo Modal Journey:** Verify dynamic stats rendering (`lessons_completed`, `streak_length`, etc.) and "Continue" handoff to React Joyride spotlight steps.
- [x] **Skip Path & Badge Lifecycle:** Verify skip button tap triggers redirection to Revision Lesson, renders persistent bottom-right badge, opens 3-option tour selection modal, and marks `badge_state: "expired"` upon tour completion.
