Duolingo Product Teardown
Core Problem

When churned users return to Duolingo and find drastic UI changes, there is a risk of the user closing the app without completing a lesson and staying in the churned state.

There exists a gap between what the user was familiar with at the time of churning and what the user has returned to.

Currently Duolingo does not provide guidance or a re-onboarding mechanism to help the user become familiar with UI changes and to guide the user back towards the features they used to make use of.

Opportunities

Opportunity 1 From an analytical standpoint: If Duolingo keeps a record of the features a churned user used to frequent, this tracking would help ensure that when the user returns, one half of the onboarding works on reminding the user of the features they used to use.

Opportunity 2 The second half of the onboarding would be to introduce the user to new features and UI improvements. This would allow Duolingo to showcase further strides the application has made and the additional value the user will get.

Goals

NORTH STAR: Get reactivated user to complete a lesson.

Duolingo's core value has always been rooted in lesson completion.

The teardown does not propose a new North Star. It applies the existing one to the reactivation cohort specifically.

FEATURE SPECIFIC SUB-GOAL: Make returning users feel at home with what's changed, while acquainting them with new and improved features.

Research

The resurrected user is a distinct lifecycle state

Resurrected users: Users who previously used a product, became inactive and then resumed usage.

Resurrection re-engages the already-lapsed. These users have accounts, history and known reasons for leaving, which means we aim for personalisation rather than educating the user from scratch.

Research shows that a user returning after 60 days of inactivity should be reminded of where they left off and what's new.

Per Growth.Design's Duolingo case study: Duolingo's resurrected users are 20% less likely than a new user to be retained

Duolingo already has the capability: It's applied elsewhere

Notification system is already a behavioral personalisation engine
The June 2026 revival campaign aimed at eligible users who previously held a 30+ day streak could recover their longest streak by completing three lessons in one session.

Duolingo has invested in the reactivation incentive, but the incentive delivers the user into an unexplained UI.

Before/After Comparison

At the moment I left in 2024, the home screen of Duolingo used to be a whole lot different before returning once in 2025 and once in 2026.

Element	Before	After	Assessment
Lives system	Hearts (heart icon)	Hearts gone, replaced by energy	User's mental model was built on hearts. Changes how the user understands the app
Bottom navigation	Baseline (per 2024 screenshot)	4 of the bottom navigation options changed	Wayfinding structure altered. The bar the user was used to is no longer a muscle memory
Feed	Not present in 2024	New, entirely unfamiliar	Zero context about this change
Video call option	Not present in baseline	New, unfamiliar	Introduction category gap

A lot of options feel displaced, creating a totally unfamiliar territory for the resurrected user.

The Solution Build Up: Part 1

The baseline mental model is a habitual loop

Open the app → View in-app notifications → Tap lesson → Complete lesson → Watch streak update → Open league: view score → Review grammar lessons → Close app

Key implication: At the time of return, a resurrected user could be a narrow loop user or a broad loop user. The same type of reintroduction cannot be given to both.

Narrow-loop users Logged in purely from the standpoint of completing lessons and updating streaks. Kept feature exploration limited.

Broad-loop users In addition to lesson completion, use multiple features like practice, social features. Generally have a rich usage history.

The solution therefore should focus on 3 key aspects

Reintroduction Definition: Using the user's own historical usage patterns and past achievements to motivate their return. How: Draw on existing Duolingo data such as streak history, past achievements.

Introduction Definition: Surfacing new features and UI/product changes that occurred during the user's absence. How: Using the user's usage patterns, pick the features that would resonate with how the user used to use Duolingo.

Mechanic Mutation Definition: a feature or mechanic that existed at the user's last active timestamp and still exists at return, but whose underlying behavior, name or rules have changed. How: Snapshot the state of a named mechanic/feature at the user's last active timestamp. Snapshot the same feature at the current time. If the past feature's mechanics or rules differ, they are considered a mechanic mutation.

The Solution Build Up: Part 2

The pain points of users

Pain point 1: No easing-in, the familiar app felt like a stranger "As a returning user, I genuinely needed both familiarity and would have preferred to be eased into the new UI that I was looking at. In the absence of it, the same application where I spent hours learning lessons felt like a stranger."

Pain point 2: Motivational need met with a monetization pitch instead "When I'm returning, I'm looking to rebuild that consistency, need motivational triggers from the app, instead of talking about achievements from the past, all I got was 'subscribe to pro' starting today."

Pain point 3: Hearts silently replaced by Energy, an unfamiliar system "When I left, hearts were an important aspect of the product that I relied on and would work hard to earn extra, however now they are completely gone, instead it's been replaced by energy concept that I have no idea how it works."

The journey stopwatch: The solution at different time windows has to solve different problems for a resurrected user.

Milliseconds Visual appeal can be assessed within 50 ms. The first frame for the resurrected user is unfamiliar UI.

Seconds Beyond roughly 10 seconds without resolution, focus breaks and frustration sets in. The cognitive cost starts accumulating. Every second spent hunting for familiar features increases frustration.

One session The average session length across a large sample of apps is 4 minutes 20 seconds. For a resurrected user, this session is the North Star Event. If a lesson is not completed in this session, there may not be a second one to try again.

The User Personas

Understanding a few of the potential resurrected users

John — The Narrow Loop Returner
Lapse duration: 1 year
Push and pull: Push: general intent to continue learning the language. Pull: no changes.
Job story: "When I return, I want to continue the same way. I will do one lesson in a day and complete it."
Bucket weighting: Reintroduction: Med, Introduction: Med, Mechanic Mutation: Med
Prior achievements: French course, 60 day streak. Progress level at return not recalled, even by John himself.
Anxiety and objection: Disoriented by UI changes, confusion at multiple new options. Too many UI features acting as a distraction.
Narrow prior usage: lessons and streak only
Tried Duolingo Pro for one month
Never explored much
Tim — The Broad User Returner
Lapse duration: 2 years
Push and pull: Push: wants a 5 to 10 minute brain activity habit. Pull: already knows Duolingo, other apps gate features behind a paywall.
Job story: "I have returned after a long time. I just want to do my lessons and practice a bit."
Bucket weighting: Reintroduction: High, Introduction: High, Mechanic Mutation: High
Prior achievements: 150 day streak. Topped Bronze, Silver, Gold leagues multiple times.
Anxiety and objection: "Did I lose my progress? Why does the app feel so unfamiliar? Where are the hearts?"
Broad prior usage: lessons, streak, league, practice, grammar review, social sharing
Took a Pro trial once, stayed on free tier
Explores new features only once nudged
The Solution and Solution Specs

A customised re-onboarding moment that fires the instant a lapsed user reopens Duolingo, built from their own history rather than a generic tour.

What actually happens end to end:

Trigger: A user reopens the app after being gone 30+ days. The backend checks their prior behavior: what they used frequently, how deeply, and when they last were active, against what the product looks like today.
Duo greets them personally, not generically: Instead of dropping the user cold into a changed UI, Duo opens with a modal: your name, how long you've been gone, and a recap of what you actually accomplished before you left (this includes lessons completed, streak record, league wins, words learned).
The user chooses how deep to go: Tap "Continue" and Duo hands off directly into a guided spotlight tour. Tap skip and you're routed into a low-stake revision lesson instead.
The spotlight tour is personalized, not identical for everyone: It's built from the same before/after comparison as the trigger. Anything that's genuinely new since the user left gets introduced. Anything that already existed but has changed (like hearts becoming energy) gets flagged. How much is shown and in what tone differs by the user's past usage patterns.
Skipping doesn't mean losing access: if the user skips, a small persistent badge stays on screen as a low friction way back into the same tour later.
The tour isn't a one-time event, it's a permanent living feature: Settings will always carry a "New UI Tour" option, independent of whether the user ever skipped anything or even lapsed at all. This is not static; this option will always give the user a chance to explore new UI changes.
The tour itself isn't take-it-or-leave-it, the user controls the scope: Whether launched from the badge or settings, there are three ways to take it: Complete, half, or a custom tour where the user picks exactly the features they want talked through from a list.
The Analytics Engine Powering The Solution

The analytics engine powering this solution starts with a key understanding of what tables exist and why.

Users: This tracks the last active timestamp of the user. The key purpose is to map the last active data to the set of features that existed at that last active timestamp.
Sessions: This helps understand what the user used to do in each session. Feeds the customized onboarding engine on the personalization aspect.
Events: Tracks the exact events involved in the user's every session. This helps establish baseline usage patterns of the user and link the most used features during this session.
Feature usage: This is the single most important table because it tracks the exact features that the user used to use. This powers the customized onboarding in the way that the resurrected user is onboarded on features that matter, features that still exist but whose rules have changed, and features that should not be covered because the user never used those features.
Pro nudge history: This tracks how the user responded to nudges to subscribe. This table ensures that if the user does not have a past history of using Pro versions, then the user at the time of return is not immediately nudged to subscribe. This helps prioritize features over subscriptions. The nudges can kick in once the user becomes active.
Feature definition: This table helps map feature usage to exact feature names and descriptions. It helps the onboarding engine decide which new features need to be shown, and which features that existed and had their rules changed need to be shown.
How The Solution Works
Trigger: Fires once at app-open, only if the user has been gone 30+ days.
What it reads (input):
Who is this user, and when did they last leave?
What did they last use before they left, and how engaged were they with it (not just did they tap it, but did they actually use it)?
What does the product look like today?
Have they been pitched to subscribe before, and how did they respond?
How it decides (processing):
Classify every feature into three buckets by comparing them then vs now (reintroduction, introduction, and mechanic mutation)
Classify the user's tier: narrow vs broad. This determines the tone and how much gets shown.
Compose the tour.
Guardrail: If they declined Pro before, delay the prompt until after reorientation.
What it produces (output): a personalised welcome message with real stats, a tour sequence built just for the user, and three ways to take it: complete, half, and self-selected.
Metrics

North Star Metric Resurrected users completing a lesson on return.

Supporting Metrics

Time to first lesson completion
Guided tour completion rate
UI introduction badge usage rate
Feature exploration rate: different for narrow loop users and broad loop users
Downstream retention of reactivated users (Day 7, Day 30)

Guardrail Metrics

New User Activation rate
Existing users retention rate
Pro subscription rate (delaying the Pro prompt should not lead to an overall reduction in subscription rate)
Tool Stack
Layer	Tool
Event tracking & feature flags	PostHog
Feature metadata & mutation history	Supabase (PostgreSQL)
Backend API	FastAPI (Python)
Frontend	React + Vite
Automated testing	Playwright, pytest
Version control	Git / GitHub

Deliberate exclusion: No LLM is used anywhere in the decision engine or presentation layer. The goal/feature space is small and fixed enough that rule-based logic solves it cleanly, with more predictability, lower cost, and lower latency than an LLM would offer at this scope.

Libraries
React Joyride — spotlight/tooltip tour rendering
Pydantic — request/response schema validation (FastAPI)
Tailwind CSS — styling
posthog-js / posthog-python — event capture and querying
supabase-py — database client for feature definitions and mutation links
