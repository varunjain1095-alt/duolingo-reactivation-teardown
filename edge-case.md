# Duolingo Reactivation Engine — Comprehensive Edge-Case & Corner Scenario Catalog

This document provides an exhaustive inventory of edge cases, boundary conditions, data anomalies, and UX fallback strategies for the **Duolingo Reactivation Engine**, complementing [`context.md`](file:///c:/Projects/Duolingo%20project%20teardown/context.md) and [`architecture.md`](file:///c:/Projects/Duolingo%20project%20teardown/architecture.md).

---

## 1. Trigger & Lapse Duration Scenarios

```
Lapse Duration Evaluation:
 ├── Lapse < 30 Days (e.g., 29.9 days)  ──> DO NOT TRIGGER (Standard App Launch)
 ├── Lapse >= 30 Days                   ──> TRIGGER REACTIVATION ENGINE
 └── Corrupted / Future Timestamp       ──> FALLBACK (Conservative Narrow Flow)
```

### 1.1 Boundary Trigger Conditions
* **Scenario:** User opens app after exactly 29 days, 23 hours, 59 minutes vs. 30 days.
* **Rule:** Strict $\text{lapse\_duration} \ge 30.0\text{ days}$ check.
* **Behavior:** Lapses $< 30$ days bypass the engine completely to prevent unnecessary tour interruptions for short absences.

### 1.2 Corrupted, Null, or Future Timestamps
* **Scenario:** Client device clock drift causes `last_active_timestamp > current_timestamp`, or `last_active_timestamp` is `null`/corrupted.
* **Fallback Behavior:** Log warning event; default to conservative safety fallback:
  * Trigger Reactivation Engine with `persona_tier = "narrow"`.
  * Fall back to default static stats in `reintroduction_payload`.
  * Do not crash app open pipeline.

### 1.3 App Force-Quit During Duo Modal
* **Scenario:** User opens app, triggers Duo Reintroduction Modal, but force-quits the application without tapping "Continue" or "Skip".
* **Behavior:** `badge_state` remains `not_yet_shown`. On next launch, engine re-evaluates. The flow triggers again until the user explicitly acknowledges by tapping "Continue" or "Skip".

---

## 2. Pre-Churn Touchpoints & Engagement Depth Anomalies

### 2.1 Cold-Start / Narrow-Loop Returning User (Zero Touchpoints)
* **Scenario:** Lapsed user churned on Day 1 with 0 recorded feature touchpoints in PostHog (`pre_churn_feature_touchpoints = []`).
* **Behavior:**
  * `mutations = []`, `workflow_matches = []`.
  * **Narrow Tier:** `spotlight_sequence = []`. Duo modal shows baseline welcome message; skipping or continuing smoothly routes user to lesson path without orphan Joyride popups.
  * **Broad Tier:** `spotlight_sequence` contains up to 2–3 arbitrary new user-facing features.

### 2.2 Micro-Touch Habitual Check (Duration Override Edge Case)
* **Scenario:** User checked streak counter 15 times pre-churn, spending $0.2\text{ seconds}$ per visit ($\text{avg\_duration} = 0.2\text{s}, \text{frequency} = 15$).
* **Rule:** $\text{Engaged} = (\text{avg\_duration} \ge 3.0\text{s}) \lor (\text{frequency} > 2)$.
* **Behavior:** Evaluates to **`True`** via frequency override. Correctly classified as an engaged workflow match rather than a bounce.

### 2.3 100% Mutation Replacement Scenario
* **Scenario:** Every feature the user engaged with pre-churn has mutated (e.g., Hearts $\rightarrow$ Energy, Lingots $\rightarrow$ Gems).
* **Behavior:**
  * All mutated features are captured in `mutations` list.
  * `replaced_feature_ids` tracks all pre-churn IDs, ensuring `workflow_matches` remains empty to prevent double-counting features in both mutation and workflow match lists.

---

## 3. Product Metadata & Catalog Anomalies (Supabase Table 5)

### 3.1 Backend / Infrastructure Improvements (`user_facing = false`)
* **Scenario:** Table 5 contains infra upgrades (e.g., "gRPC latency reduction", "Database v2 migration").
* **Filter Rule:** Engine applies `user_facing == True` filter first across all queries.
* **Behavior:** Infrastructure items are 100% excluded from `spotlight_sequence`, `custom_tour.selectable_items`, and Duo stat callouts.

### 3.2 Chained / Multi-Stage Mutations
* **Scenario:** Feature A was replaced by Feature B, which was later replaced by Feature C during user absence ($A \rightarrow B \rightarrow C$).
* **Behavior:** Resolution engine recursively traverses `replaces_feature_id` chains, mapping pre-churn usage of Feature A directly to current state Feature C, displaying Feature C's explanation and element target.

### 3.3 Circular or Orphan Foreign Keys
* **Scenario:** `replaces_feature_id` references a deleted `feature_id` or forms a loop ($A \rightarrow B \rightarrow A$).
* **Behavior:** Resolution logic caps traversal depth at 5 steps; orphan links default to treating the current feature as a standalone new feature.

---

## 4. Persona Tier & Spotlight Composition Edge Cases

### 4.1 Broad Tier with Zero Unseen Features
* **Scenario:** Broad tier user returns, but no new features were introduced since `last_active_timestamp` (`intro_date > last_active` yields 0 features).
* **Behavior:** Arbitrary expansion adds 0 items. `spotlight_sequence` degrades gracefully to `Mutations ∪ Workflow_Matches`.

### 4.2 Initial Auto-Tour Sequence Cap vs. Uncapped `complete_tour`
* **Scenario:** Highly active returning user has 12 workflow matches, 3 mutations, and 3 new features (Total: 18 eligible items).
* **Clarified Rule:**
  * **Initial Automatic Duo Spotlight Sequence:** To protect returning users from first-run onboarding fatigue, the initial automatic spotlight sequence shown immediately after the Duo modal is capped at a maximum of **6 items** (prioritized order: Mutations $\rightarrow$ Workflow Matches $\rightarrow$ Arbitrary New Features).
  * **`badge_options.complete_tour`:** The `complete_tour` payload delivered in `badge_options` remains genuinely **uncapped** (containing all eligible items), allowing users who voluntarily click the persistent badge to view the complete sequence.
  * **`badge_options.half_tour`:** Contains half of the total uncapped items ($\lceil N_{\text{uncapped}} / 2 \rceil$).

---

## 5. Pro-Nudge & Upsell Guardrail Edge Cases

### 5.1 Pro-Nudge Guardrail Decline Threshold (`times_declined >= 1`)
* **Scenario:** User declined a Pro/trial nudge once in their history (`pro_nudge_history.times_declined = 1`).
* **Rule:** `pro_prompt_delay = (pro_nudge_history.times_declined >= 1)`.
* **Behavior:** `pro_prompt_delay` evaluates to `True`. Monetization and trial prompts are strictly suppressed until the re-orientation flow completes. If `times_declined == 0`, `pro_prompt_delay` evaluates to `False`.

---

## 6. UX Overlay, Skip Path & Persistent Badge Scenarios

```
Badge State Lifecycle:
 not_yet_shown ──(User Skips Modal)──> active ──(Tour Completed)──> expired
                                                                     │
                                                             (Permanent Fallback)
                                                                     │
                                                                     ▼
                                                             Settings Menu
```

### 6.1 Immediate Skip on Duo Modal
* **Scenario:** User taps "Skip" on step 1 of Duo Modal without viewing any spotlight step.
* **Behavior:** User is immediately routed to a **Revision Lesson**. Persistent badge activates bottom-right (`badge_state: "active"`). Duo reassurance toast appears once.

### 6.2 Tour Selection: Odd Number of Items in `half_tour`
* **Scenario:** `spotlight_sequence` contains 5 total items.
* **Behavior:** `half_tour` items count = $\lceil 5 / 2 \rceil = 3$ items.

### 6.3 Empty `custom_tour` Selectable Pool
* **Scenario:** User has 0 workflow matches, 0 mutations, and 0 new features available.
* **Behavior:** `custom_tour.selectable_items` returns empty list `[]`. Frontend disables "Custom Tour" button with label *"All features up to date"*.

### 6.4 Tour Completion & Badge Expiration
* **Scenario:** User completes a tour launched via the Persistent Badge.
* **Behavior:** `badge_state` updates to `"expired"`. Badge element is unmounted from UI home screen. Access remains permanently under **Settings $\rightarrow$ Take UI Tour**.

---

## 7. Network, API & DOM Fallback Strategies

| Failure Mode | Root Cause | Fallback Strategy |
|---|---|---|
| **PostHog Timeout ($> 150\text{ms}$)** | Network latency | Fall back to local storage cached usage history; default to Narrow tier. |
| **Supabase Query Failure** | Database offline | Use hardcoded fallback catalog of core mutations (e.g. Hearts $\rightarrow$ Energy). |
| **Missing Selector in Joyride** | DOM element `#energy-indicator` missing | React Joyride skips step silently without breaking modal flow or throwing uncaught errors. |
