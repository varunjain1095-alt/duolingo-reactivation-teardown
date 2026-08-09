"""
Phase 5 — End-to-End Integration & Fallback Resilience Test Suite
Verifies full data pipeline flow, JSON delivery contracts, and resilience fallbacks (Eval 5.1 & 5.2).
"""

import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app import app
from engine import (
    EngineInputRequest,
    TouchpointPayload,
    AchievementsPayload,
    ProHistoryPayload,
    FeatureDefinitionPayload,
    ReactivationEngine
)
from posthog_client import PostHogAnalyticsClient
from supabase_client import SupabaseFeatureClient

client = TestClient(app)

def test_e2e_pipeline_broad_tim_data_flow():
    """
    E2E Test: Broad Tier (Tim)
    PostHog events + Supabase schema definitions -> FastAPI -> JSON output contract.
    """
    sb_client = SupabaseFeatureClient()

    # 1. Fetch pre-churn touches and achievements from telemetry client
    ph_data = PostHogAnalyticsClient.get_mock_user_profile("broad")
    assert ph_data["lapse_duration_days"] == 87
    assert ph_data["persona_tier"] == "broad"

    # 2. Fetch current feature catalog from database client
    db_features = sb_client.get_all_features(user_facing_only=True)
    assert len(db_features) >= 5

    # 3. Construct EngineInputRequest payload
    payload = {
        "user_id": ph_data["user_id"],
        "last_active_timestamp": ph_data["last_active_timestamp"],
        "current_timestamp": "2026-01-10T00:00:00Z",
        "lapse_duration_days": ph_data["lapse_duration_days"],
        "persona_tier": ph_data["persona_tier"],
        "pre_churn_feature_touchpoints": [
            {
                "feature_id": t.feature_id,
                "frequency": t.frequency,
                "avg_duration": t.avg_duration,
                "engaged": t.engaged
            }
            for t in ph_data["touchpoints"]
        ],
        "pre_churn_achievements": {
            "streak_length": ph_data["achievements"].streak_length,
            "league_placements": ph_data["achievements"].league_placements,
            "league_wins": ph_data["achievements"].league_wins,
            "words_learned": ph_data["achievements"].words_learned,
            "lessons_completed": ph_data["achievements"].lessons_completed,
            "gems": ph_data["achievements"].gems,
            "level": ph_data["achievements"].level
        },
        "pro_nudge_history": {
            "times_declined": ph_data["pro_history"].times_declined,
            "avg_decline_speed": ph_data["pro_history"].avg_decline_speed,
            "ever_trialed": ph_data["pro_history"].ever_trialed
        },
        "feature_definitions_current": [
            {
                "feature_id": f.feature_id,
                "name": f.name,
                "placement": f.placement,
                "intro_date": f.intro_date.isoformat(),
                "feature_explanation": f.explanation,
                "replaces_feature_id": f.replaces_feature_id,
                "user_facing": f.user_facing
            }
            for f in db_features
        ]
    }

    # 4. Invoke live FastAPI REST endpoint
    response = client.post("/api/v1/reactivation/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()

    # 5. Validate React client delivery contract
    assert "reintroduction_payload" in data
    assert data["reintroduction_payload"]["tone"] == "celebratory"
    assert data["reintroduction_payload"]["stats"]["lessons_completed"] == 180
    assert data["reintroduction_payload"]["stats"]["streak_length"] == 24
    assert data["reintroduction_payload"]["stats"]["league_wins"] == 4
    assert data["reintroduction_payload"]["stats"]["words_learned"] == 650

    # 6. Validate spotlight sequence
    spotlights = data["spotlight_sequence"]
    assert len(spotlights) <= 6
    # Mutation must be first
    assert spotlights[0]["type"] == "mechanic_mutation"
    assert spotlights[0]["feature_id"] == "energy_system"
    assert spotlights[0]["target_element"] == "#energy-indicator"

    # 7. Validate Pro guardrail & badge options
    assert data["pro_prompt_delay"] is True  # declined 1 time
    assert data["badge_state"] == "not_yet_shown"
    assert "complete_tour" in data["badge_options"]
    assert "half_tour" in data["badge_options"]
    assert "custom_tour" in data["badge_options"]

def test_e2e_pipeline_narrow_john_data_flow():
    """
    E2E Test: Narrow Tier (John)
    PostHog events + Supabase schema definitions -> FastAPI -> JSON output contract.
    """
    sb_client = SupabaseFeatureClient()
    ph_data = PostHogAnalyticsClient.get_mock_user_profile("narrow")
    assert ph_data["lapse_duration_days"] == 70
    assert ph_data["persona_tier"] == "narrow"

    db_features = sb_client.get_all_features(user_facing_only=True)

    payload = {
        "user_id": ph_data["user_id"],
        "last_active_timestamp": ph_data["last_active_timestamp"],
        "current_timestamp": "2026-01-10T00:00:00Z",
        "lapse_duration_days": ph_data["lapse_duration_days"],
        "persona_tier": ph_data["persona_tier"],
        "pre_churn_feature_touchpoints": [
            {
                "feature_id": t.feature_id,
                "frequency": t.frequency,
                "avg_duration": t.avg_duration,
                "engaged": t.engaged
            }
            for t in ph_data["touchpoints"]
        ],
        "pre_churn_achievements": {
            "streak_length": ph_data["achievements"].streak_length,
            "league_placements": ph_data["achievements"].league_placements,
            "league_wins": ph_data["achievements"].league_wins,
            "words_learned": ph_data["achievements"].words_learned,
            "lessons_completed": ph_data["achievements"].lessons_completed,
            "gems": ph_data["achievements"].gems,
            "level": ph_data["achievements"].level
        },
        "pro_nudge_history": {
            "times_declined": ph_data["pro_history"].times_declined,
            "avg_decline_speed": ph_data["pro_history"].avg_decline_speed,
            "ever_trialed": ph_data["pro_history"].ever_trialed
        },
        "feature_definitions_current": [
            {
                "feature_id": f.feature_id,
                "name": f.name,
                "placement": f.placement,
                "intro_date": f.intro_date.isoformat(),
                "feature_explanation": f.explanation,
                "replaces_feature_id": f.replaces_feature_id,
                "user_facing": f.user_facing
            }
            for f in db_features
        ]
    }

    response = client.post("/api/v1/reactivation/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["reintroduction_payload"]["tone"] == "action_oriented"
    assert data["reintroduction_payload"]["stats"]["lessons_completed"] == 35
    assert data["pro_prompt_delay"] is False  # 0 declines

    # Narrow tier strictly mutations + workflow matches
    types = [s["type"] for s in data["spotlight_sequence"]]
    assert "introduction" not in types

def test_eval_5_1_missing_dom_target_fallback():
    """
    Eval 5.1: Missing DOM Target Fallback in React Joyride & Spotlight Pipeline.
    Verifies that when spotlight_sequence contains a target element not present in DOM
    (e.g., #missing-element), the sequence structure remains well-formed and safe for client skipping.
    """
    ph_data = PostHogAnalyticsClient.get_mock_user_profile("broad")

    # Inject a feature with a non-existent DOM target
    missing_target_features = [
        {
            "feature_id": "missing_ghost_feature",
            "name": "Ghost Feature",
            "placement": "missing-nonexistent-element",
            "intro_date": "2025-12-05",
            "feature_explanation": "A feature without a matching DOM node.",
            "replaces_feature_id": None,
            "user_facing": True
        }
    ]

    payload = {
        "user_id": "usr_missing_target",
        "last_active_timestamp": "2025-10-15T00:00:00Z",
        "current_timestamp": "2026-01-10T00:00:00Z",
        "lapse_duration_days": 87,
        "persona_tier": "broad",
        "pre_churn_feature_touchpoints": [],
        "pre_churn_achievements": {
            "streak_length": 10,
            "league_placements": "Gold",
            "league_wins": 2,
            "words_learned": 300,
            "lessons_completed": 50,
            "gems": 500,
            "level": 3
        },
        "pro_nudge_history": {
            "times_declined": 0,
            "avg_decline_speed": 0.0,
            "ever_trialed": False
        },
        "feature_definitions_current": missing_target_features
    }

    response = client.post("/api/v1/reactivation/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()

    # The API cleanly outputs the target element identifier without failing
    assert len(data["spotlight_sequence"]) > 0
    assert data["spotlight_sequence"][0]["target_element"] == "#missing-nonexistent-element"

def test_eval_5_2_database_timeout_fallback():
    """
    Eval 5.2: Supabase / Database Connection Timeout Fallback.
    Simulates database query timeout / disconnect by passing empty feature_definitions_current.
    Verifies that the API gracefully degrades to core cached features (Narrow tier, Energy System mutation)
    returning HTTP 200 without throwing a 500 Internal Server Error.
    """
    ph_data = PostHogAnalyticsClient.get_mock_user_profile("broad")

    payload = {
        "user_id": ph_data["user_id"],
        "last_active_timestamp": ph_data["last_active_timestamp"],
        "current_timestamp": "2026-01-10T00:00:00Z",
        "lapse_duration_days": ph_data["lapse_duration_days"],
        "persona_tier": "broad",
        "pre_churn_feature_touchpoints": [
            {
                "feature_id": "hearts_system",
                "frequency": 15,
                "avg_duration": 6.0,
                "engaged": True
            }
        ],
        "pre_churn_achievements": {
            "streak_length": 15,
            "league_placements": "Silver",
            "league_wins": 1,
            "words_learned": 200,
            "lessons_completed": 45,
            "gems": 100,
            "level": 2
        },
        "pro_nudge_history": {
            "times_declined": 0,
            "avg_decline_speed": 0.0,
            "ever_trialed": False
        },
        "feature_definitions_current": []  # Simulates database query timeout / empty response
    }

    response = client.post("/api/v1/reactivation/evaluate", json=payload)
    assert response.status_code == 200, f"Expected 200 on DB timeout fallback, got {response.status_code}: {response.text}"
    data = response.json()

    # Engine must degrade to safety fallback: baseline Narrow tier and core cached energy_system mutation
    assert data["reintroduction_payload"]["tone"] == "action_oriented"  # Degraded to narrow tier
    assert len(data["spotlight_sequence"]) >= 1
    assert data["spotlight_sequence"][0]["feature_id"] == "energy_system"
    assert data["spotlight_sequence"][0]["type"] == "mechanic_mutation"

def test_e2e_health_and_contract_validation():
    """
    E2E Test: Server health and invalid input validation.
    """
    health_resp = client.get("/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["status"] == "ok"

    invalid_payload = {
        "user_id": "usr_active_recent",
        "last_active_timestamp": "2026-01-01T00:00:00Z",
        "current_timestamp": "2026-01-10T00:00:00Z",
        "lapse_duration_days": 9,  # < 30
        "persona_tier": "broad",
        "pre_churn_feature_touchpoints": [],
        "pre_churn_achievements": {
            "streak_length": 1,
            "league_placements": "Bronze",
            "league_wins": 0,
            "words_learned": 10,
            "lessons_completed": 2,
            "gems": 50,
            "level": 1
        },
        "pro_nudge_history": {
            "times_declined": 0,
            "avg_decline_speed": 0.0,
            "ever_trialed": False
        },
        "feature_definitions_current": []
    }

    # Sub-30 day lapse duration returns NotTriggeredResponse (triggered=False)
    resp = client.post("/api/v1/reactivation/evaluate", json=invalid_payload)
    assert resp.status_code == 200
    assert resp.json()["triggered"] is False
    assert "below the 30-day threshold" in resp.json()["reason"]

    # Malformed ISO8601 timestamp must return HTTP 400 Bad Request
    malformed_payload = dict(invalid_payload)
    malformed_payload["lapse_duration_days"] = 60
    malformed_payload["last_active_timestamp"] = "not-a-valid-timestamp"
    resp_bad = client.post("/api/v1/reactivation/evaluate", json=malformed_payload)
    assert resp_bad.status_code == 400
    assert "Invalid last_active_timestamp format" in resp_bad.json()["detail"]
