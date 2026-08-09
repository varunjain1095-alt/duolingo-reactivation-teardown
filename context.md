# Context: Duolingo Reactivation Engine

This document provides the full technical and design context extracted from [`duolingo-reactivation-specs.md`](file:///c:/Projects/Duolingo%20project%20teardown/duolingo-reactivation-specs.md) for direct implementation in Cursor / Antigravity.

### Project Documentation Index
- **Specification:** [`context.md`](file:///c:/Projects/Duolingo%20project%20teardown/context.md)
- **Architecture & System Design:** [`architecture.md`](file:///c:/Projects/Duolingo%20project%20teardown/architecture.md)
- **Phase-Wise Implementation Plan:** [`implementation_plan.md`](file:///c:/Projects/Duolingo%20project%20teardown/implementation_plan.md)
- **Edge-Case & Corner Scenario Catalog:** [`edge-case.md`](file:///c:/Projects/Duolingo%20project%20teardown/edge-case.md)
- **Test & Verification Matrix:** [`evals.md`](file:///c:/Projects/Duolingo%20project%20teardown/evals.md)
- **Official Data Structure Documentation:** [`data-schema.md`](file:///c:/Projects/Duolingo%20project%20teardown/data-schema.md)
- **Architectural Decision & Retroactive Changelog:** [`decision-log.md`](file:///c:/Projects/Duolingo%20project%20teardown/decision-log.md)

---

## 1. Problem Statement & Core Value Gap

* **Core Problem:** Lapsed/churned users returning after significant absence face a drastically changed UI. Without guidance or re-onboarding, users experience cognitive friction and risk closing the app without completing a lesson, leading to permanent churn.
* **The Gap:** Disconnect between the user's last-known familiar interface/mechanics and the current state of the app.
* **Dual Opportunity:**
  1. **Analytical Re-engagement:** Track pre-churn feature usage history to remind returning users of familiar features and past milestones.
  2. **Product Value Discovery:** Introduce new features and UI improvements introduced during their absence to highlight product evolution and added value.

---

## 2. Confirmed Scoping & Design Decisions

* **Self-Reported Goal Shift:** Lapsed flow includes 2–3 short questions allowing returning users to self-report goal/motivation changes directly, mitigating static assumption risks.
* **Goal Framing:** Embedded directly in metrics and problem definition (no standalone "Goal:" header section).
* **Scope Boundary:** Feature-level teardown focused specifically on the reactivation and re-onboarding engine (not a general product overhaul).
* **Deliverable:** Functional prototype of the Reactivation Flow, extending the *Adaptive Onboarding & Activation Engine* (reactivation branch).
* **Build-First Approach:** Implementation of prototype precedes final teardown narrative documentation.

---

## 3. Core Goals & North Star

* **North Star Metric (Cohort-Specific):** Lapsed User Lesson Completion Rate.
  * Primary target: Reactivated users completing at least one lesson upon return.
* **Feature Sub-Goal:** Seamlessly re-orient returning users to familiar and updated features, serving as the driver for lesson completion.

---

## 4. Solution Framing: Three Core Buckets

```
                          ┌──────────────────────────┐
                          │   Reactivation Signal    │
                          └────────────┬─────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐
│    Reintroduction     │  │     Introduction      │  │   Mechanic Mutation   │
│ (Past Usage & Stats)  │  │ (New Features/UI Gap) │  │  (Rule/Behavior Gap)  │
└───────────────────────┘  └───────────────────────┘  └───────────────────────┘
```

### 4.1 Reintroduction
* **Definition:** Leverages pre-churn user activity and achievements to emotionally/motivationally re-engage returning users.
* **Purpose:** Motivational re-ignition (remind *why* they learned), not spatial navigation.
* **Fixes:** Replaces broken/silent static usage prompts with context-aware historical acknowledgments.

### 4.2 Introduction
* **Definition:** Surfacing new features and UI additions launched during user absence.
* **Disambiguation Rule:** Distinguishes newly launched features from previously existing but unvisited ones via launch dates.
* **Sequencing Constraint:** Must occur *after* Reintroduction and *before* any Pro/monetization pitch.
* **Key Surfaces:** Feed, Video Call options, Practice options.

### 4.3 Mechanic Mutation (Highest Severity Bucket)
* **Definition:** A feature/mechanic present pre-churn and post-churn whose name, underlying logic, or operational rules have changed (e.g., **Hearts** → **Energy**).
* **Detection Logic (Two-Point Comparison):**
  1. Snapshot pre-churn mechanic state at `last_active_timestamp`.
  2. Snapshot current mechanic state at `current_timestamp`.
  3. If functional slot matches but rules/names differ $\rightarrow$ Classify as **Mechanic Mutation**.
* **Why Highest Severity:** Unlike Reintroduction/Introduction (which fail by omission/confusion), Mechanic Mutation fails by **false confidence**—the user acts on invalid assumptions, causing errors during gameplay/lessons.

---

## 5. Engine Data Architecture & Logic

### 5.1 Base Tables Schema

| Table Name | Primary Purpose | Fields / Key Tracking Data |
|---|---|---|
| **Table 1: Events** | Raw usage logs | `event_id`, `event_name`, timestamp |
| **Table 2: Sessions** | Session metrics | `session_id`, `user_id`, session duration |
| **Table 3: Feature Usage** | Feature touchpoints | `session_id`, `event_id`, `feature_id`, duration, timestamp |
| **Table 4: Pro/Nudge History** | Upsell tracking & guardrails | `nudge_id`, `user_id`, `ever_trialed` (bool), `times_declined`, `avg_decline_speed` |
| **Table 5: Feature Definitions** | Product metadata & mutations | `feature_id`, `name`, `placement`, `intro_date`, `explanation`, `replaces_feature_id`, `user_facing` (bool) |

### 5.2 Engagement Depth Signal & Classification Logic

* **Bounce Threshold:** Inter-event delta $< 3\text{ seconds}$ is categorized as a bounce.
* **Frequency Override:** Feature touches $> 2\text{ times}$ override duration checks.
* **Combined Rule (OR condition):**
$$\text{Engaged} = (\text{duration} \ge 3\text{s}) \lor (\text{frequency} > 2)$$
* *Rationale:* Quick, repeated actions (checking streak/leagues) are strong habitual signals and must not be filtered out by strict AND logic.

### 5.3 Classification Matrix

| Pre-Churn State | Current State | Touch History | Resulting Classification |
|---|---|---|---|
| Existed | Exists | Engaged ($\text{duration} \ge 3\text{s} \lor \text{freq} > 2$) | **Reintroduction** Candidate |
| Non-existent OR Unengaged | Exists | Unengaged / No touches | **Introduction** Candidate |
| Existed | Exists | Rules / Name / Logic Changed | **Mechanic Mutation** Candidate |

---

## 6. Tech Stack & Integration Architecture

* **No-LLM Policy:** System uses a deterministic Python rule-engine/decision tree (predictable, low latency, zero API LLM cost). LangGraph is reserved as a scale fallback only.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            Frontend (React)                             │
│       ┌──────────────────────────┐    ┌──────────────────────────┐      │
│       │ Duo Reintro Modal (Custom)│    │ React Joyride Spotlights │      │
│       └──────────────────────────┘    └──────────────────────────┘      │
└────────────────────────────────────▲────────────────────────────────────┘
                                     │ Payload JSON
┌────────────────────────────────────┴────────────────────────────────────┐
│                        Python Decision Engine                           │
│  - Calculates 3 buckets                                                 │
│  - Formats broad / narrow persona payloads                              │
│  - Applies Pro-nudge delay guardrails                                   │
└──────────────▲───────────────────────────────────────────▲──────────────┘
               │ Query                                     │ Query
┌──────────────┴──────────┐                     ┌──────────┴──────────────┐
│  PostHog (Events/Flags) │                     │   Supabase (PostgreSQL) │
│ - User session tables   │                     │ - Feature Definitions   │
│ - Pro nudge history     │                     │ - Mutation links        │
└─────────────────────────┘                     └─────────────────────────┘
```

### 6.1 Stack Component Mapping

* **Analytics & Session Tracking:** PostHog (Tables 1–4).
* **Feature Definitions & Mutations:** Supabase / PostgreSQL (Table 5).
* **Rules Engine:** Pure Python decision tree.
* **Feature Flagging:** PostHog Feature Flags.
* **Spotlight & Tour UI:** React Joyride (MIT License).
* **Backend Improvement Guardrail:** `user_facing = true` boolean filter applied on Table 5 to exclude backend/infra updates from end-user spotlight flows.

---

## 7. UI, Flow & Interaction Design

### 7.1 Reintroduction & Handoff Sequence

1. **Duo Modal (Full-Screen):**
   * Duo mascot delivers personalized stats: lessons completed, streak length, league wins, words learned.
   * Transition statement: *"Since you're back, let me run you through the important features so you can quickly jump into your new lesson."*
2. **Persona Tier Adaptations:**
   * **Broad Footprint (Tim-type):** Richer stat callouts, expanded feature set, celebratory tone.
   * **Narrow Footprint (John-type):** Focused stat callouts, minimal feature set, direct action-oriented tone.

### 7.2 Spotlight Sequence Composition Rules

* **Mechanic Mutation Automatic Inclusion:** Mechanic Mutation items are always automatically included in the spotlight sequence for both persona tiers — this bypasses any workflow-matching filter, since Mechanic Mutation is the highest-severity bucket.
* **Broad Tier Composition:** $\text{Spotlight Sequence} = \text{Features matching user's pre-churn workflow (via 5.3 classification)}$ + $2\text{–}3$ additional new features selected arbitrarily ($\text{intro\_date} > \text{last\_active\_timestamp} \land \text{user\_facing} = \text{true}$). No similarity/adjacency ranking logic — this must remain a simple filter, consistent with the no-LLM policy in Section 6.
* **Narrow Tier Composition:** $\text{Spotlight Sequence} = \text{Workflow-matching features only}$ — no additional new features are added.

### 7.3 User Control & Skip Architecture

```
User Action on Duo Modal:
 ├── Tap "Continue" ──> Launch React Joyride Spotlight Sequence
 └── Tap "Skip"     ──> 1. Route to Revision Lesson
                        2. Duo one-line badge reassurance
                        3. Activate Persistent Badge (Bottom-Right)
```

* **Skip Mitigation:** Persistent bottom-right badge labeled *"Take tour of the new UI features"*.
* **Badge Options Menu on Click:**
  * **Complete Tour:** Full spotlight sequence.
  * **Half Tour:** 50% truncated spotlight sequence.
  * **Custom Tour:** Interactive checkbox selector based on `feature_explanation` one-liners (filtered by `user_facing = true`).
* **Expiry:** Badge disappears on tour completion (`badge_state: "expired"`). Re-accessible under **Settings**.

---

## 8. Engine Input / Output Schema Contract

### 8.1 Trigger Criterion
* Engine triggers on application open if $\text{lapse\_duration} \ge 30\text{ days}$.

### 8.2 Input Payload Schema (JSON)
```json
{
  "user_id": "string",
  "last_active_timestamp": "ISO8601_string",
  "current_timestamp": "ISO8601_string",
  "lapse_duration_days": 45,
  "pre_churn_feature_touchpoints": [
    {
      "feature_id": "hearts_system",
      "frequency": 14,
      "avg_duration": 4.5,
      "engaged": true
    }
  ],
  "pre_churn_achievements": {
    "streak_length": 12,
    "league_placements": "Gold",
    "league_wins": 2,
    "words_learned": 340,
    "lessons_completed": 85,
    "gems": 450,
    "level": 4
  },
  "pro_nudge_history": {
    "times_declined": 1,
    "avg_decline_speed": 1.2,
    "ever_trialed": false
  },
  "feature_definitions_current": [
    {
      "feature_id": "energy_system",
      "name": "Energy System",
      "placement": "top_bar",
      "intro_date": "2025-06-01",
      "feature_explanation": "Replaces Hearts with dynamic daily energy refill mechanics.",
      "replaces_feature_id": "hearts_system",
      "user_facing": true
    }
  ]
}
```

### 8.3 Output Payload Schema (JSON)
```json
{
  "reintroduction_payload": {
    "stats": {
      "lessons_completed": 85,
      "league_wins": 2,
      "words_learned": 340,
      "streak_length": 12
    },
    "tone": "celebratory"
  },
  "spotlight_sequence": [
    {
      "type": "mechanic_mutation",  // Enum: "mechanic_mutation" | "workflow_match" | "introduction"
      "feature_id": "energy_system",
      "target_element": "#energy-indicator",
      "message": "Hearts are now Energy! Here is how your daily lives work now."
    }
  ],
  "pro_prompt_delay": true,
  "badge_state": "not_yet_shown",
  "badge_options": {
    "complete_tour": { "spotlight_sequence": [] },
    "half_tour": { "spotlight_sequence": [] },
    "custom_tour": {
      "selectable_items": [
        {
          "feature_id": "energy_system",
          "one_liner": "Replaces Hearts with dynamic daily energy refill mechanics."
        }
      ]
    }
  }
}
```

---

## 9. Implementation Roadmap & Milestones

1. **Phase 1: Core Engine & Data Infrastructure (Current Focus)**
   * Provision PostHog & Supabase API keys.
   * Construct Table 5 in Supabase and mock Tables 1–4 in PostHog.
   * Build pure Python logic tree for engagement depth, persona tiering, and payload generation.
2. **Phase 2: UI Overlay & React Integration (Deferred)**
   * Recreate Duolingo target screen (Home/Path view) with named DOM targets.
   * Implement Duo modal and Joyride spotlight engine.
   * Build persistent badge component and custom tour selection UI.

### 9.3 Open / Unresolved Items

* **Workflow Matching Threshold:** The precise, computable definition of "matching the user's pre-churn workflow" (referenced in Section 7.2) is not yet quantified — currently a conceptual rule, not an implementable one. Do not invent a specific threshold or matching algorithm without flagging it as an assumption.
* **Prioritization Matrix:** Prioritization (Impact vs. Effort) across pain points/features is deferred and out of scope for the current build phase.
