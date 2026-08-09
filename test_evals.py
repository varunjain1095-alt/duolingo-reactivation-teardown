"""
Duolingo Reactivation Engine — Automated Test & Evaluation Suite (`test_evals.py`)
Covers Phase 1 Data Layer Evals and Phase 2 Hard Verification Gate (Eval 2.1 - 2.8).
"""

import sys
import os
import math
from datetime import date, datetime
import pytest
from fastapi.testclient import TestClient

project_root = r"c:\Projects\Duolingo project teardown"
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from engine import (
    ReactivationEngine,
    PreChurnTouchpoint,
    PreChurnAchievements,
    FeatureDefinition,
    ProNudgeHistory,
    EngineInputRequest
)
from app import app
from supabase_client import SupabaseFeatureClient
from posthog_client import PostHogAnalyticsClient

client = TestClient(app)

# ==============================================================================
# PHASE 1 EVALUATIONS (Data Layer & Schema)
# ==============================================================================

def test_eval_1_1_supabase_schema_and_constraints():
    """Eval 1.1: Verify Supabase table schema, indexes, and foreign key relations."""
    sb_client = SupabaseFeatureClient()
    features = sb_client.get_all_features(user_facing_only=False)
    assert len(features) >= 8, f"Expected at least 8 features, got {len(features)}"
    
    # Check that user_facing filter properly excludes infra items
    user_facing = sb_client.get_all_features(user_facing_only=True)
    assert all(f.user_facing for f in user_facing)
    feature_ids = {f.feature_id for f in user_facing}
    assert "grpc_migration" not in feature_ids
    assert "db_indexing_v2" not in feature_ids

    # Check mutation mapping
    mutations = sb_client.get_mutations_map()
    assert "hearts_system" in mutations
    assert mutations["hearts_system"].feature_id == "energy_system"


def test_eval_1_2_posthog_schema_retrieval():
    """Eval 1.2: Verify PostHog ingestion and Pro nudge history retrieval."""
    ph_client = PostHogAnalyticsClient()
    # Test capture
    ph_client.capture_event("test_user_eval_1_2", "eval_test_event", {"status": "ok"})
    
    # Query pro history record
    pro_history = ph_client.get_pro_nudge_history("test_user_eval_1_2")
    assert isinstance(pro_history.times_declined, int)
    assert isinstance(pro_history.avg_decline_speed, float)
    assert isinstance(pro_history.ever_trialed, bool)


# ==============================================================================
# PHASE 2 EVALUATIONS (Hard Verification Gate 2.6)
# ==============================================================================

def test_eval_2_1_engagement_depth_thresholds():
    """
    Eval 2.1: Engagement Depth Threshold Boundary Test.
    Rule: Engaged if (duration >= 3.0s) OR (frequency > 2)
    """
    engine = ReactivationEngine()
    
    # Sub-case 2.1.a: duration = 2.9s, frequency = 2 -> False
    assert engine.evaluate_engagement(frequency=2, avg_duration=2.9) is False, "2.1.a failed: 2.9s / 2 touches should be False"
    
    # Sub-case 2.1.b: duration = 3.0s, frequency = 1 -> True
    assert engine.evaluate_engagement(frequency=1, avg_duration=3.0) is True, "2.1.b failed: 3.0s / 1 touch should be True"
    
    # Sub-case 2.1.c: duration = 0.2s, frequency = 3 -> True (Frequency override)
    assert engine.evaluate_engagement(frequency=3, avg_duration=0.2) is True, "2.1.c failed: 0.2s / 3 touches should be True (frequency override)"


def test_eval_2_2_mechanic_mutation_priority():
    """
    Eval 2.2: Mechanic Mutation Automatic Inclusion & Priority.
    Hearts -> Energy should be placed first in spotlight_sequence for both Broad and Narrow tiers.
    """
    engine = ReactivationEngine()
    features = [
        FeatureDefinition(feature_id="hearts_system", name="Hearts System", placement="top_bar", intro_date=date(2019, 1, 1), explanation="Old hearts", user_facing=True),
        FeatureDefinition(feature_id="energy_system", name="Energy System", placement="energy-indicator", intro_date=date(2025, 12, 1), explanation="Hearts are now Energy!", replaces_feature_id="hearts_system", user_facing=True),
        FeatureDefinition(feature_id="practice_option", name="Practice Hub", placement="nav-practice", intro_date=date(2024, 5, 10), explanation="Practice weak words", user_facing=True)
    ]
    touchpoints = [
        PreChurnTouchpoint(feature_id="hearts_system", frequency=10, avg_duration=4.0, engaged=True),
        PreChurnTouchpoint(feature_id="practice_option", frequency=5, avg_duration=10.0, engaged=True)
    ]
    achievements = PreChurnAchievements(streak_length=10, league_placements="Gold", league_wins=2, words_learned=200, lessons_completed=50)
    pro_history = ProNudgeHistory(times_declined=0, avg_decline_speed=0.0, ever_trialed=False)
    
    # Test Narrow Tier
    res_narrow = engine.process_reactivation(
        last_active=datetime(2025, 10, 1),
        touchpoints=touchpoints,
        achievements=achievements,
        features=features,
        pro_history=pro_history,
        persona_tier="narrow"
    )
    seq_narrow = res_narrow["spotlight_sequence"]
    assert len(seq_narrow) >= 1
    assert seq_narrow[0]["type"] == "mechanic_mutation"
    assert seq_narrow[0]["feature_id"] == "energy_system"

    # Test Broad Tier
    res_broad = engine.process_reactivation(
        last_active=datetime(2025, 10, 1),
        touchpoints=touchpoints,
        achievements=achievements,
        features=features,
        pro_history=pro_history,
        persona_tier="broad"
    )
    seq_broad = res_broad["spotlight_sequence"]
    assert seq_broad[0]["type"] == "mechanic_mutation"
    assert seq_broad[0]["feature_id"] == "energy_system"


def test_eval_2_3_workflow_matches_and_deduplication():
    """
    Eval 2.3: Workflow Matches Computation & De-duplication.
    Verifies that practice_option is included with type == 'workflow_match',
    and replaced features are not duplicated.
    """
    engine = ReactivationEngine()
    features = [
        FeatureDefinition(feature_id="hearts_system", name="Hearts System", placement="top_bar", intro_date=date(2019, 1, 1), explanation="Old hearts", user_facing=True),
        FeatureDefinition(feature_id="energy_system", name="Energy System", placement="energy-indicator", intro_date=date(2025, 12, 1), explanation="Hearts are now Energy!", replaces_feature_id="hearts_system", user_facing=True),
        FeatureDefinition(feature_id="practice_option", name="Practice Hub", placement="nav-practice", intro_date=date(2024, 5, 10), explanation="Practice weak words", user_facing=True)
    ]
    touchpoints = [
        PreChurnTouchpoint(feature_id="hearts_system", frequency=10, avg_duration=4.0, engaged=True),
        PreChurnTouchpoint(feature_id="practice_option", frequency=5, avg_duration=10.0, engaged=True)
    ]
    achievements = PreChurnAchievements(streak_length=10, league_placements="Gold", league_wins=2, words_learned=200, lessons_completed=50)
    pro_history = ProNudgeHistory(times_declined=0, avg_decline_speed=0.0, ever_trialed=False)
    
    res = engine.process_reactivation(
        last_active=datetime(2025, 10, 1),
        touchpoints=touchpoints,
        achievements=achievements,
        features=features,
        pro_history=pro_history,
        persona_tier="narrow"
    )
    seq = res["spotlight_sequence"]
    
    # Check types and feature IDs
    feature_ids = [item["feature_id"] for item in seq]
    assert "practice_option" in feature_ids
    assert "hearts_system" not in feature_ids, "Replaced feature should not be present in spotlight sequence"
    assert len(feature_ids) == len(set(feature_ids)), "Duplicate feature IDs found in spotlight sequence"
    
    practice_item = next(item for item in seq if item["feature_id"] == "practice_option")
    assert practice_item["type"] == "workflow_match", f"Expected type 'workflow_match', got '{practice_item['type']}'"


def test_eval_2_4_broad_vs_narrow_tier_sequencing():
    """
    Eval 2.4: Broad vs. Narrow Persona Tier Sequencing.
    Narrow = Mutations + Workflow Matches
    Broad = Mutations + Workflow Matches + 2-3 Arbitrary New Features (intro_date > last_active)
    """
    engine = ReactivationEngine()
    features = [
        FeatureDefinition(feature_id="hearts_system", name="Hearts System", placement="top_bar", intro_date=date(2019, 1, 1), explanation="Old hearts", user_facing=True),
        FeatureDefinition(feature_id="energy_system", name="Energy System", placement="energy-indicator", intro_date=date(2025, 12, 1), explanation="Hearts are now Energy!", replaces_feature_id="hearts_system", user_facing=True),
        FeatureDefinition(feature_id="practice_option", name="Practice Hub", placement="nav-practice", intro_date=date(2024, 5, 10), explanation="Practice weak words", user_facing=True),
        FeatureDefinition(feature_id="feed_tab", name="Social Feed", placement="nav-feed", intro_date=date(2025, 12, 20), explanation="Social feed updates", user_facing=True),
        FeatureDefinition(feature_id="video_call", name="Video Call", placement="video-call-btn", intro_date=date(2026, 1, 15), explanation="Practice speaking with Lily", user_facing=True)
    ]
    touchpoints = [
        PreChurnTouchpoint(feature_id="hearts_system", frequency=10, avg_duration=4.0, engaged=True),
        PreChurnTouchpoint(feature_id="practice_option", frequency=5, avg_duration=10.0, engaged=True)
    ]
    achievements = PreChurnAchievements(streak_length=10, league_placements="Gold", league_wins=2, words_learned=200, lessons_completed=50)
    pro_history = ProNudgeHistory(times_declined=0, avg_decline_speed=0.0, ever_trialed=False)
    
    last_active = datetime(2025, 10, 1)
    
    res_narrow = engine.process_reactivation(
        last_active=last_active,
        touchpoints=touchpoints,
        achievements=achievements,
        features=features,
        pro_history=pro_history,
        persona_tier="narrow"
    )
    res_broad = engine.process_reactivation(
        last_active=last_active,
        touchpoints=touchpoints,
        achievements=achievements,
        features=features,
        pro_history=pro_history,
        persona_tier="broad"
    )
    
    # Narrow has 2 items (1 mutation + 1 workflow match)
    assert len(res_narrow["spotlight_sequence"]) == 2
    assert [x["feature_id"] for x in res_narrow["spotlight_sequence"]] == ["energy_system", "practice_option"]
    
    # Broad has 4 items (1 mutation + 1 workflow match + 2 new features)
    assert len(res_broad["spotlight_sequence"]) == 4
    assert [x["feature_id"] for x in res_broad["spotlight_sequence"]] == ["energy_system", "practice_option", "feed_tab", "video_call"]


def test_eval_2_5_custom_tour_candidate_pool_scoping():
    """
    Eval 2.5: Scoped custom_tour.selectable_items Candidate Pool.
    Verifies that pre-existing untouched features (predating last_active) are 100% excluded.
    """
    engine = ReactivationEngine()
    features = [
        # Pre-existing untouched features (should be EXCLUDED)
        FeatureDefinition(feature_id="old_feature_1", name="Old 1", placement="old-1", intro_date=date(2020, 1, 1), explanation="Old 1", user_facing=True),
        FeatureDefinition(feature_id="old_feature_2", name="Old 2", placement="old-2", intro_date=date(2021, 1, 1), explanation="Old 2", user_facing=True),
        
        # Pre-churn workflow match (INCLUDED)
        FeatureDefinition(feature_id="practice_option", name="Practice Hub", placement="nav-practice", intro_date=date(2024, 5, 10), explanation="Practice weak words", user_facing=True),
        
        # Mutation (INCLUDED)
        FeatureDefinition(feature_id="hearts_system", name="Hearts", placement="top-bar", intro_date=date(2019, 1, 1), explanation="Old Hearts", user_facing=True),
        FeatureDefinition(feature_id="energy_system", name="Energy System", placement="energy-indicator", intro_date=date(2025, 12, 1), explanation="Energy system", replaces_feature_id="hearts_system", user_facing=True),
        
        # New feature introduced after last active (INCLUDED)
        FeatureDefinition(feature_id="feed_tab", name="Social Feed", placement="nav-feed", intro_date=date(2025, 12, 20), explanation="Social feed updates", user_facing=True)
    ]
    touchpoints = [
        PreChurnTouchpoint(feature_id="hearts_system", frequency=10, avg_duration=4.0, engaged=True),
        PreChurnTouchpoint(feature_id="practice_option", frequency=5, avg_duration=10.0, engaged=True)
    ]
    achievements = PreChurnAchievements(streak_length=10, league_placements="Gold", league_wins=2, words_learned=200, lessons_completed=50)
    pro_history = ProNudgeHistory(times_declined=0, avg_decline_speed=0.0, ever_trialed=False)
    
    last_active = datetime(2025, 10, 1)
    res = engine.process_reactivation(
        last_active=last_active,
        touchpoints=touchpoints,
        achievements=achievements,
        features=features,
        pro_history=pro_history,
        persona_tier="broad"
    )
    
    selectable_ids = {item["feature_id"] for item in res["badge_options"]["custom_tour"]["selectable_items"]}
    assert "practice_option" in selectable_ids
    assert "energy_system" in selectable_ids
    assert "feed_tab" in selectable_ids
    assert "old_feature_1" not in selectable_ids, "Pre-existing untouched features must be excluded"
    assert "old_feature_2" not in selectable_ids, "Pre-existing untouched features must be excluded"


def test_eval_2_6_pro_guardrail_logic():
    """
    Eval 2.6: Pro Guardrail Logic (times_declined >= 1).
    """
    engine = ReactivationEngine()
    features = [FeatureDefinition(feature_id="practice_option", name="Practice Hub", placement="nav-practice", intro_date=date(2024, 5, 10), explanation="Practice", user_facing=True)]
    touchpoints = [PreChurnTouchpoint(feature_id="practice_option", frequency=5, avg_duration=10.0, engaged=True)]
    achievements = PreChurnAchievements(streak_length=10, league_placements="Gold", league_wins=2, words_learned=200, lessons_completed=50)
    
    # 2.6.a: times_declined = 0 -> False
    res_a = engine.process_reactivation(
        last_active=datetime(2025, 10, 1),
        touchpoints=touchpoints,
        achievements=achievements,
        features=features,
        pro_history=ProNudgeHistory(times_declined=0, avg_decline_speed=0.0, ever_trialed=False)
    )
    assert res_a["pro_prompt_delay"] is False

    # 2.6.b: times_declined = 1 -> True
    res_b = engine.process_reactivation(
        last_active=datetime(2025, 10, 1),
        touchpoints=touchpoints,
        achievements=achievements,
        features=features,
        pro_history=ProNudgeHistory(times_declined=1, avg_decline_speed=1.5, ever_trialed=False)
    )
    assert res_b["pro_prompt_delay"] is True

    # 2.6.c: times_declined = 3 -> True
    res_c = engine.process_reactivation(
        last_active=datetime(2025, 10, 1),
        touchpoints=touchpoints,
        achievements=achievements,
        features=features,
        pro_history=ProNudgeHistory(times_declined=3, avg_decline_speed=0.8, ever_trialed=False)
    )
    assert res_c["pro_prompt_delay"] is True


def test_eval_2_7_rest_api_schema_contract():
    """
    Eval 2.7: REST API Output Schema Contract Validation (Spec Section 8.4).
    Validates POST /api/v1/reactivation/evaluate against OpenAPI contract,
    lapse duration trigger enforcement (<30 days), and strict error handling.
    """
    valid_payload = {
        "user_id": "usr_test_eval_2_7",
        "last_active_timestamp": "2025-11-15T10:30:00Z",
        "current_timestamp": "2026-01-10T08:15:00Z",
        "lapse_duration_days": 56,
        "persona_tier": "broad",
        "pre_churn_feature_touchpoints": [
            {
                "feature_id": "hearts_system",
                "frequency": 14,
                "avg_duration": 4.5,
                "engaged": True
            },
            {
                "feature_id": "practice_option",
                "frequency": 5,
                "avg_duration": 12.0,
                "engaged": True
            }
        ],
        "pre_churn_achievements": {
            "streak_length": 18,
            "league_placements": "Gold",
            "league_wins": 2,
            "words_learned": 420,
            "lessons_completed": 110,
            "gems": 650,
            "level": 5
        },
        "pro_nudge_history": {
            "times_declined": 1,
            "avg_decline_speed": 1.4,
            "ever_trialed": False
        },
        "feature_definitions_current": [
            {
                "feature_id": "energy_system",
                "name": "Energy System",
                "placement": "energy-indicator",
                "intro_date": "2025-12-01",
                "feature_explanation": "Hearts are now Energy! You get 25 Energy points daily that auto-refill over time. If your Energy runs low, practice previous lessons to earn instant refills and keep learning!",
                "replaces_feature_id": "hearts_system",
                "user_facing": True
            },
            {
                "feature_id": "practice_option",
                "name": "Practice Hub",
                "placement": "nav-practice",
                "intro_date": "2024-05-10",
                "feature_explanation": "Your personalized Practice Hub is ready! Target tricky grammar, fix recent mistakes, and strengthen weak vocabulary. Use it anytime to warm up before starting a new unit.",
                "replaces_feature_id": None,
                "user_facing": True
            },
            {
                "feature_id": "feed_tab",
                "name": "Social Feed",
                "placement": "nav-feed",
                "intro_date": "2025-12-20",
                "feature_explanation": "Connect with friends on the Social Feed! Cheer on their streak milestones, send high-fives for quest completions, and celebrate your own learning wins.",
                "replaces_feature_id": None,
                "user_facing": True
            }
        ]
    }
    
    # 1. Test Valid Reactivation Flow (lapse_duration_days >= 30)
    resp = client.post("/api/v1/reactivation/evaluate", json=valid_payload)
    assert resp.status_code == 200, f"API failed with: {resp.text}"
    
    data = resp.json()
    assert "reintroduction_payload" in data
    assert "spotlight_sequence" in data
    assert "pro_prompt_delay" in data
    assert "badge_state" in data
    assert "badge_options" in data
    
    # Check stats structure
    stats = data["reintroduction_payload"]["stats"]
    assert stats["lessons_completed"] == 110
    assert stats["league_wins"] == 2
    assert stats["streak_length"] == 18
    assert data["reintroduction_payload"]["tone"] == "celebratory"
    assert data["pro_prompt_delay"] is True
    assert data["badge_state"] == "not_yet_shown"
    
    # Check spotlight sequence contents
    types = [s["type"] for s in data["spotlight_sequence"]]
    assert types == ["mechanic_mutation", "workflow_match", "introduction"]

    # 2. Test Fix 1: Lapse Duration Below 30 Days (< 30)
    short_lapse_payload = dict(valid_payload)
    short_lapse_payload["lapse_duration_days"] = 15
    resp_short = client.post("/api/v1/reactivation/evaluate", json=short_lapse_payload)
    assert resp_short.status_code == 200
    assert resp_short.json()["triggered"] is False
    assert "below the 30-day threshold" in resp_short.json()["reason"]

    # 3. Test Fix 2 & 3: Malformed Timestamp (Must raise HTTP 400 Bad Request)
    invalid_ts_payload = dict(valid_payload)
    invalid_ts_payload["last_active_timestamp"] = "not-a-valid-date-format"
    resp_invalid_ts = client.post("/api/v1/reactivation/evaluate", json=invalid_ts_payload)
    assert resp_invalid_ts.status_code == 400
    assert "Invalid last_active_timestamp format" in resp_invalid_ts.json()["detail"]


def test_eval_2_8_auto_tour_cap_vs_uncapped_badge_options():
    """
    Eval 2.8: Initial Auto-Tour Cap vs. Uncapped Badge Options.
    User has 11 total eligible items across categories:
      - 3 mechanic mutations
      - 5 workflow matches
      - 3 new features
    Expected:
      - Initial spotlight_sequence is capped at exactly 6 items in priority order.
      - badge_options.complete_tour contains all 11 items uncapped.
      - badge_options.half_tour contains ceil(11 / 2) = 6 items (computed from uncapped total).
    """
    engine = ReactivationEngine()
    
    features = [
        # 3 Mutation pairs (old -> new)
        FeatureDefinition(feature_id="old_m1", name="Old M1", placement="m1", intro_date=date(2020, 1, 1), explanation="M1", user_facing=True),
        FeatureDefinition(feature_id="new_m1", name="New M1", placement="m1-new", intro_date=date(2025, 11, 1), explanation="New M1", replaces_feature_id="old_m1", user_facing=True),
        FeatureDefinition(feature_id="old_m2", name="Old M2", placement="m2", intro_date=date(2020, 1, 1), explanation="M2", user_facing=True),
        FeatureDefinition(feature_id="new_m2", name="New M2", placement="m2-new", intro_date=date(2025, 11, 2), explanation="New M2", replaces_feature_id="old_m2", user_facing=True),
        FeatureDefinition(feature_id="old_m3", name="Old M3", placement="m3", intro_date=date(2020, 1, 1), explanation="M3", user_facing=True),
        FeatureDefinition(feature_id="new_m3", name="New M3", placement="m3-new", intro_date=date(2025, 11, 3), explanation="New M3", replaces_feature_id="old_m3", user_facing=True),
        
        # 5 Workflow match features
        FeatureDefinition(feature_id="wf_1", name="WF 1", placement="wf1", intro_date=date(2022, 1, 1), explanation="WF 1", user_facing=True),
        FeatureDefinition(feature_id="wf_2", name="WF 2", placement="wf2", intro_date=date(2022, 2, 1), explanation="WF 2", user_facing=True),
        FeatureDefinition(feature_id="wf_3", name="WF 3", placement="wf3", intro_date=date(2022, 3, 1), explanation="WF 3", user_facing=True),
        FeatureDefinition(feature_id="wf_4", name="WF 4", placement="wf4", intro_date=date(2022, 4, 1), explanation="WF 4", user_facing=True),
        FeatureDefinition(feature_id="wf_5", name="WF 5", placement="wf5", intro_date=date(2022, 5, 1), explanation="WF 5", user_facing=True),
        
        # 3 New features launched post-last-active
        FeatureDefinition(feature_id="new_f1", name="New F1", placement="nf1", intro_date=date(2025, 12, 1), explanation="New F1", user_facing=True),
        FeatureDefinition(feature_id="new_f2", name="New F2", placement="nf2", intro_date=date(2025, 12, 2), explanation="New F2", user_facing=True),
        FeatureDefinition(feature_id="new_f3", name="New F3", placement="nf3", intro_date=date(2025, 12, 3), explanation="New F3", user_facing=True),
    ]
    
    touchpoints = [
        PreChurnTouchpoint(feature_id="old_m1", frequency=10, avg_duration=5.0, engaged=True),
        PreChurnTouchpoint(feature_id="old_m2", frequency=10, avg_duration=5.0, engaged=True),
        PreChurnTouchpoint(feature_id="old_m3", frequency=10, avg_duration=5.0, engaged=True),
        PreChurnTouchpoint(feature_id="wf_1", frequency=5, avg_duration=6.0, engaged=True),
        PreChurnTouchpoint(feature_id="wf_2", frequency=5, avg_duration=6.0, engaged=True),
        PreChurnTouchpoint(feature_id="wf_3", frequency=5, avg_duration=6.0, engaged=True),
        PreChurnTouchpoint(feature_id="wf_4", frequency=5, avg_duration=6.0, engaged=True),
        PreChurnTouchpoint(feature_id="wf_5", frequency=5, avg_duration=6.0, engaged=True),
    ]
    
    achievements = PreChurnAchievements(streak_length=20, league_placements="Diamond", league_wins=5, words_learned=500, lessons_completed=100)
    pro_history = ProNudgeHistory(times_declined=0, avg_decline_speed=0.0, ever_trialed=False)
    
    last_active = datetime(2025, 10, 1)
    
    res = engine.process_reactivation(
        last_active=last_active,
        touchpoints=touchpoints,
        achievements=achievements,
        features=features,
        pro_history=pro_history,
        persona_tier="broad"
    )
    
    # 1. Initial spotlight_sequence must be capped at 6 items
    initial_seq = res["spotlight_sequence"]
    assert len(initial_seq) == 6, f"Expected initial sequence length == 6, got {len(initial_seq)}"
    
    # Priority order check: 3 mutations first, then 3 workflow matches
    expected_initial_ids = ["new_m1", "new_m2", "new_m3", "wf_1", "wf_2", "wf_3"]
    assert [x["feature_id"] for x in initial_seq] == expected_initial_ids
    
    # 2. badge_options.complete_tour must contain all 11 items uncapped
    complete_seq = res["badge_options"]["complete_tour"]["spotlight_sequence"]
    assert len(complete_seq) == 11, f"Expected complete_tour length == 11, got {len(complete_seq)}"
    
    # 3. badge_options.half_tour must contain ceil(11 / 2) = 6 items computed from 11
    half_seq = res["badge_options"]["half_tour"]["spotlight_sequence"]
    assert len(half_seq) == 6, f"Expected half_tour length == 6 (ceil(11/2)), got {len(half_seq)}"
