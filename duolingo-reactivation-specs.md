# Duolingo Reactivation Engine — Build Spec

Lean handoff document for implementation (Antigravity/Cursor). Extracted and trimmed from the full teardown to reduce token consumption — narrative research, session evidence, and rationale live in the main teardown document; this file carries only what's needed to build.

---

## 1. Problem Statement

When churned users return to Duolingo and find drastic UI changes, there is a risk of the user closing the app without completing a lesson and staying in the churned state — or worse, deciding to permanently churn.

There exists a gap between what the user was familiar with at the time of churning and what the user has returned to. Currently, Duolingo does not provide guidance or a re-onboarding mechanism to help the returning user become familiar with UI changes and to guide the user back toward the features they used to make use of.

This opens up the following opportunities:

1. **From an analytical standpoint** — if Duolingo keeps a record of the features a churned user used to frequent, this tracking would help ensure that when the user returns, one half of the onboarding works on reminding the user of the features they used to use.
2. **The second half of the onboarding** would be to introduce the user to new features and UI improvements — showing the further strides the application has made and the additional value the user will get.

---

## 2. Scoping Decisions Confirmed

**Use-case change is in scope, resolved via direct input rather than inference.**
Rather than relying solely on inferred historical usage data, the reactivation flow will include 2–3 short questions that let returning users self-report if their goals or motivations have shifted since they last used the app. Assuming static motivation is a risk in itself — asking directly hedges against both the tracking assumption and genuine goal drift.

**Goal statement is not formalized as a separate labeled section.**
No dedicated "Goal:" heading — intent is carried by the problem statement and surfaces explicitly in the metrics/goals below.

**Scope: feature-level teardown, not a full/comprehensive Duolingo teardown.**
This stays centered on the reactivation/re-onboarding gap specifically, rather than broadening into a full product review.

**Deliverable: a working prototype of the reactivation flow, not just mockups.**
Being built as an application of the personal "Adaptive Onboarding & Activation Engine" project — specifically its reactivation branch — rather than as static screens alone. Input: lapse duration/tier + prior feature usage + self-reported goal-shift answers. Output: a personalized reactivation path (familiar-feature reminders + new-feature introduction), delivered via tiered nudges.

**Sequencing: build first, then write the teardown.**
The prototype/engine build happens before the full teardown narrative is written, so the document reflects real trade-offs and decisions encountered during the build — not hypothetical ones planned in advance.

---

## 3. Goals

**High-level goal (= North Star, applied to this cohort):** Get reactivated users to complete a lesson.

Duolingo's core value has always been rooted in lesson completion — that doesn't change because a feature is being introduced. This applies the existing North Star to the reactivation cohort specifically (i.e., the rate at which lapsed users who return complete a lesson).

**Feature-specific sub-goal:** Make returning users feel at home with what's changed, while acquainting them with new and improved features — so that the reactivation onboarding is the mechanism that moves the North Star for this cohort, not a replacement for it.

---

## 4. Solution Framing: Three Aspects

### 4.1 Reintroduction
**Definition:** using the user's own historical usage patterns and past achievements to *motivate* their return — not to relocate features, but to reconnect them with their own progress and reinforce why they were engaged in the first place.

- Draws on existing data — streak history, past achievements, prior usage patterns.
- Function is motivational/emotional re-engagement, not orientational. The user doesn't need to be shown *where* things are; they need to be reminded *why it mattered*.
- Absorbs and fixes the broken/partial "why are you learning it" mechanism: complete that flow by having it explicitly acknowledge the gap and reference the user's own history, rather than silently reusing a stored answer with no context.

### 4.2 Introduction
**Definition:** surfacing new features and UI/product changes that occurred during the user's absence, personalized using a launch-date disambiguation rule so genuinely new features are distinguished from previously-existing-but-undiscovered ones.

- This is where most of the actual orientation problem lives — the gap is a "surrounding-context problem," not a relocation problem.
- Must be sequenced *after* Reintroduction and explicitly *before* any monetization prompt — reorientation has to land before Pro is pitched.
- For narrow-loop users, self-reported goal-shift questions carry more weight here, since behavioral signal is thin.
- Covers genuinely new surfaces (e.g., Feed, video call option, practice option).

### 4.3 Mechanic Mutation
**Definition:** a feature or mechanic that existed at the user's last-active timestamp and still exists at return, but whose underlying behavior, name, or rules have changed. Distinct from both Reintroduction (nothing here is being "remotivated") and Introduction (nothing here is new) — the danger is specifically that the user *believes* their existing understanding still applies when it no longer does.

**Detection rule — a two-point-in-time comparison:**
1. Snapshot the state of a named mechanic/feature at the user's **last-active timestamp** (e.g., "Hearts: heart-based lives system, present").
2. Snapshot the state of the same conceptual slot at **current time** (e.g., "Lives system: Energy, present").
3. If a mechanic occupying the same functional slot exists at both timestamps **but its name, mechanics, or rules differ** → classify as **Mechanic Mutation**, not Introduction (it's not new) and not a simple Reintroduction target (it's not just being remotivated — its rules changed).

This requires storing/reconstructing a per-user "last-known-state" snapshot of core mechanics, not just a feature-usage log.

**Why this is the highest-severity bucket:** Reintroduction and Introduction both fail by *omission* — the user is missing information, and the failure mode is confusion or slower discovery. Mechanic Mutation fails by **false confidence** — the user believes they understand a mechanic and acts on that belief, which can cause real errors (e.g., misjudging remaining attempts under the new Energy system based on old Hearts assumptions) rather than just visible confusion. Weighted as the single highest-impact item, since it's the only failure mode that produces incorrect user action rather than mere hesitation.

**Example:** Hearts (finite, heart-icon, top-bar count) → Energy (different top-right indicator). Same functional slot (governs ability to make mistakes/continue), different underlying system. A returning user attempting a lesson while assuming Hearts-era rules is the concrete risk case.

---

## 5. Engine Data Architecture

### 5.1 Base tables

1. **Events table** — event id, event name, etc. Gives usage patterns.
2. **Sessions table** — session id, etc. Tracks each session; feeds average session duration.
3. **Feature usage table** — session id, event id, feature id. Gives feature touch points.
4. **Pro/AI-mode trial nudge table** — tracks whether the user accepted trials, how many times they declined the nudge, and how quickly they dismissed it.

Table 4 does double duty: beyond conversion tracking, it's the data source for the Pro-upsell sequencing guardrail — nudge-response speed and decline count per user can be used to detect users who have already declined once, and treat them differently (e.g., suppressing or delaying the Pro nudge).

### 5.2 Engagement depth signal (feature usage table extension)

The feature usage table is extended to include **time spent on a feature** and is linked back to the events table: if a new event fires immediately after a feature is touched, the feature was not meaningfully explored.

**Bounce threshold:** a feature touch is classified as a bounce if the time delta to the next event is **< 3 seconds**.

**Frequency override:** if a feature has been touched **more than 2 times** (frequency > 2), it is treated as engaged regardless of individual-visit duration.

**Combined engagement rule (OR, not AND):**

> **Engaged if:** (duration ≥ 3s) **OR** (frequency > 2)

Deliberately an OR condition: high-frequency, short-duration touches (e.g., checking the streak counter, checking the league) are habitual-loop behavior and arguably the *strongest* Reintroduction candidates, since they were part of the user's routine, not a one-off. Requiring both conditions (AND) would misclassify quick, frequent habitual checks as low-engagement.

### 5.3 Mapping the comparison to the three buckets

The core detection logic is a two-point-in-time comparison, generalized across all three buckets: take features touched prior to churn, compare to current features, and classify accordingly.

| Comparison outcome | Bucket |
|---|---|
| Feature existed pre-churn **and** exists now, and was touched (engaged) pre-churn | **Reintroduction** candidate |
| Feature exists now but did not exist pre-churn, **or** existed but was never engaged pre-churn | **Introduction** candidate |
| Feature existed pre-churn, still exists now, **but** its underlying definition/rules have changed | **Mechanic Mutation** candidate |

The first two rows are computable from tables 1–4 (usage/touch data) alone. Mechanic Mutation requires a separate feature-definition history (Table 5, below) — usage tables show engagement patterns, not feature *definitions*.

---

## 6. No-LLM Decision & Tech Stack

**Explicit decision, stated plainly: no LLM is used anywhere in this system — not in the decision logic, not in the presentation layer.** Goal/feature space is small and fixed enough that rule-based logic (plain Python dict/decision tree) solves it cleanly, with more predictability, lower cost, and lower latency than an LLM would offer for this scope. LangGraph is noted only as a fallback if the goal/feature space grows large enough that hand-written rules become unmanageable — not applicable at current scope.

### 6.1 Stack mapping

| Layer | Tool | Maps to |
|---|---|---|
| Event tracking, session data, feature interactions | **PostHog** | Tables 1–3 — PostHog's native schema covers this ground largely out of the box |
| Pro/nudge tracking | **PostHog** (same event pipeline, different event types) | Table 4 |
| Feature definitions, version history, "replaced by" links | **Supabase / PostgreSQL** | Table 5 — product/feature metadata, not user behavior, so it sits outside PostHog's scope |
| Decision logic (bucket classification, bounce/frequency rules, persona-tier selection) | **Plain Python rules / decision tree** | Reads from PostHog + Supabase; no LLM involved |
| Delivery / feature flags | **PostHog Feature Flags** | Decides whether a given user sees a given reactivation flow variant |
| Nudge/tour UI | **React Joyride** (MIT-licensed, free for commercial use) | Renders the fixed, pre-designed spotlight/tooltip steps — Introduction and Mechanic Mutation content specifically |

**Recommended minimal stack:** PostHog (tracking + flags), Supabase (feature definitions + progress), plain Python rules (path/decision logic), React Joyride (nudge UI), LangGraph reserved only if scope grows.

### 6.2 Table 5 — Feature Definitions (finalized)

Fields: feature id, feature name, feature placement (e.g., "main screen"), feature introduction date, feature explanation, **feature id replaced** (links a new feature row back to whatever it replaced — e.g., Energy's row points to Hearts' row), **user_facing (bool)**.

**The `user_facing` field:** distinguishes UI/product features a returning user should be shown from backend/infrastructure improvements (e.g., latency reductions, performance work) that have no visible surface to spotlight and are irrelevant to a reactivation flow. Any feature-selection logic must filter on `user_facing = true` first — backend improvements are excluded from every user-facing surface, regardless of tier or selection path.

---

## 7. UI & Interaction Design

**Core principle:** the prototype's UI is a fixed, pre-designed overlay layer sitting on top of Duolingo's actual UI — not a from-scratch redesign, and not generated. React Joyride (or the underlying spotlight/tooltip pattern) targets real elements on a recreated version of the relevant Duolingo screen(s), prioritizing clean, named/addressable components so Joyride's targeting works cleanly, over pure visual fidelity. Only the specific screen(s) already identified (the home/lesson-path screen) need to be recreated, not the whole app.

**Personalization boundary:** the engine decides *which* content fires and *what values* populate it (feature names, stats, mutation explanations); the screens/overlay steps themselves are fixed templates, not generated per-user.

### 7.1 Flow structure: Duo-voiced Reintroduction → spotlight handoff

**Reintroduction is delivered as a full-screen/modal moment voiced by Duo** (Duolingo's mascot), not a Joyride spotlight step — motivational content doesn't fit Joyride's "point at an element" pattern.

**Duo's script (fixed template, dynamic content):**
1. "Welcome back."
2. Motivational stats pulled from the user's engagement history: lessons completed, league placements/wins, words learned — actual values come from the feature-usage/engagement-depth data, so content is genuinely personalized even though the template is fixed.
3. "Since you're back, let me run you through the important features so you can quickly jump into your new lesson."
4. Handoff to spotlight steps (Introduction + Mechanic Mutation content).

**What varies by persona tier — values change, tone changes, structure stays fixed:**
- **Broad tier** (Tim-type): richer stat callout, more features surfaced, excitement-building/celebratory tone, fuller walkthrough.
- **Narrow tier** (John-type): thinner stat callout, fewer features surfaced, action-oriented/faster-to-lesson tone.

### 7.2 User controls: tap-to-continue and skip

Two actions available at Duo's modal: **tap to continue** (proceeds into the spotlight sequence) or **skip**.

**Why skip exists and is not overridden:** interruption fatigue, tour-abandonment rates, and premature-upsell risk all point the same direction — forcing a tour risks permanent churn. Skip is respected fully; nothing is force-shown afterward.

**Skip path, fully specified:**
1. User taps skip.
2. Redirected into a **revision lesson**, framed as rebuilding momentum rather than dropping them cold into new material.
3. Duo mentions, briefly, that a tour of new features is available anytime via a badge — including the explicit reassurance that the badge disappears once the tour is taken, so engaging with it doesn't open the door to further nagging.
4. A **persistent badge** appears, bottom-right: "Take tour of the new UI features."

**Deliberate trade-off, stated openly:** skipping means the user does not see Mechanic Mutation content (e.g., the Hearts→Energy explanation) in the moment. Given Mechanic Mutation's severity, this is a real risk accepted in service of not forcing the user. The badge is the mitigation: the path back to that content remains easy to find, just not forced.

### 7.3 The persistent badge

- **Placement:** small, bottom-right of the screen — visible enough to be discovered, not buried in a low-traffic surface like settings alone.
- **Label:** "Take tour of the new UI features."
- **Behavior:** clicking the badge triggers the Introduction/Mechanic Mutation spotlight sequence (the same content Duo would have handed off to, had the user tapped continue instead of skipping).
- **Expiry:** the badge disappears once the tour is completed. It does not persist indefinitely and does not reappear on its own.
- **Fallback for later:** if the user wants to revisit the tour again after the badge has expired, it remains available permanently under **Settings**.

---

## 8. Engine Input/Output Schema (Consolidated)

Single build-ready contract. This is the handoff spec for Cursor/Antigravity.

### 8.1 Trigger

Engine fires once, at app-open, if the user's lapse duration is **≥ 30 days**.

### 8.2 Input

```
{
  user_id,
  last_active_timestamp,
  current_timestamp,
  lapse_duration (derived),

  // Tables 1–3 (PostHog)
  pre_churn_feature_touchpoints: [
    { feature_id, frequency, avg_duration, engaged (bool, §5.2 OR rule: duration ≥3s OR frequency >2) }
  ],
  pre_churn_achievements: { streak_length, league_placements, words_learned, lessons_completed, gems, level },

  // Table 4 (PostHog)
  pro_nudge_history: { times_declined, avg_decline_speed, ever_trialed (bool) },

  // Table 5 (Supabase)
  feature_definitions_current: [
    { feature_id, name, placement, intro_date, feature_explanation, replaces_feature_id, user_facing (bool) }
  ]
}
```

### 8.3 Processing (rules layer — plain Python, no LLM)

1. **Bucket classification** — run the §5.3 comparison (pre-churn touchpoints vs. current feature_definitions) to classify each feature as Reintroduction / Introduction / Mechanic Mutation.
2. **Persona-tier classification** — narrow footprint (John-type) vs. broad footprint (Tim-type), determining tone (action-oriented vs. celebratory) and spotlight composition rules below.
3. **Spotlight sequence composition:**
   - **Mechanic Mutation items are automatic** for both tiers — always included, bypassing the workflow-matching filter below, since Mechanic Mutation is the highest-severity bucket.
   - **Broad tier:** Introduction items = features matching the user's original workflow, **plus 2–3 new features, selected arbitrarily** — any feature where `intro_date > user's last_active_timestamp` **and `user_facing = true`** (backend/infrastructure/performance improvements are excluded — no visible surface to spotlight, irrelevant to reactivation). No similarity/adjacency matching — a straightforward filter on Table 5, no additional logic needed.
   - **Narrow tier:** Introduction items = features matching the user's original workflow **only** — no adjacent additions.
4. **Pro-nudge guardrail** — if `pro_nudge_history.times_declined ≥ 1`, suppress/delay the Pro prompt until after reorientation is complete.

### 8.4 Output

```
{
  reintroduction_payload: {
    stats: { lessons_completed, league_wins, words_learned, streak_length },
    tone: "celebratory" | "action_oriented"   // per persona tier, §7.1
  },
  spotlight_sequence: [
    { type: "introduction" | "mechanic_mutation", feature_id, target_element, message }
    // composed per §8.3.3
  ],
  pro_prompt_delay: bool,
  badge_state: "not_yet_shown" | "active" | "expired",
  badge_options: {
    complete_tour: { spotlight_sequence: [...] },          // full sequence, per §8.3.3
    half_tour: { spotlight_sequence: [...] },               // half of total new-UI-change items identified
    custom_tour: {
      selectable_items: [ { feature_id, one_liner (from feature_explanation, Table 5) } ]
      // pool restricted to user_facing = true — backend/infra features never appear as selectable
      // user selects a subset; selected items become the delivered spotlight_sequence
    }
  }
}
```

### 8.5 Skip path — full state trace

1. User skips Duo's modal.
2. → routed to a **revision lesson**.
3. Duo delivers a one-line mention: a tour is available anytime, plus the reassurance that engaging with it won't lead to further nagging (the badge disappears once used).
4. → **badge_state: "active"**, badge rendered bottom-right, label: *"Take tour of the new UI features."*
5. On badge click → user is presented the three options (§8.4's `badge_options`): complete tour, half tour, or custom (select from one-line feature descriptions, sourced directly from Table 5's `feature_explanation` field — no new content authored for this path).
6. On tour completion (any of the three options) → **badge_state: "expired"**, badge removed.
7. **Permanent fallback:** the same three-option tour remains available indefinitely under **Settings**, independent of badge state.

---

## 9. Implementation Plan

**Build order:** core system structure and libraries first. UI polish is a deliberately later, separate stage — it should not block or influence the implementation of the core rules engine, tables, or library integrations.

### 9.1 Blockers to resolve before implementation starts

- **API keys for libraries used** — PostHog, Supabase, and any other external service in the stack (§6) each require account setup and API key provisioning before integration work can begin. Confirm all required keys are available and configured first.
- **Full-scale UI structure** — explicitly **not** a blocker for core build. Deferred to a later, dedicated UI stage (§9.2) so that system architecture (tables, rules engine, decision logic) can be built and tested independently of visual design work.

### 9.2 UI Stage (deferred, later phase)

A dedicated, separate stage — not concurrent with core system build:

- Recreate the target Duolingo screen(s) (home/lesson-path screen) in Claude Design or Google Stitch, prioritizing named/addressable components for Joyride targeting.
- Build the Duo-voiced Reintroduction modal (fixed template, per §7.1).
- Wire up React Joyride spotlight steps against the recreated screen's elements.
- Build the persistent badge component (§7.3) and its three-option tour selector (complete/half/custom) — note: the "custom" option requires its own small selection UI (one-liner + checkbox per feature) and is a larger build item than the other two options.
- This stage begins only once the core rules engine, tables, and stack integrations (§6, §8) are functional and testable independently of any UI.

### 9.3 Still open (not blockers, but unresolved)

- Precise numeric/computable rule for "matching the user's original workflow" (referenced in §8.3.3) — conceptually defined, not yet quantified.
- Prioritization (Impact vs. Effort) across pain points/features — deferred, to be built alongside a rejected-solutions list.
