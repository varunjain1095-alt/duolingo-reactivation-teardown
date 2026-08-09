"""
FastAPI REST API Service for Duolingo Reactivation Engine
Exposes POST /api/v1/reactivation/evaluate returning ReactivationResponse Union (Spec Section 8.4).
"""

import os
from datetime import datetime, date, timezone
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from engine import (
    EngineInputRequest,
    EngineOutputResponse,
    NotTriggeredResponse,
    ReactivationResponse,
    ReactivationEngine,
    PreChurnTouchpoint,
    PreChurnAchievements,
    FeatureDefinition,
    ProNudgeHistory
)
from supabase_client import SupabaseFeatureClient

load_dotenv()

app = FastAPI(
    title="Duolingo Reactivation Engine API",
    description="Deterministic Python Decision Service for Lapsed User Re-onboarding",
    version="1.0.0"
)

# Configure CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = ReactivationEngine()

# Eval 5.2: Core Cached Fallback Features (utilized if Supabase connection times out or returns empty)
DEFAULT_CORE_FEATURES = [
    FeatureDefinition(
        feature_id="energy_system",
        name="Energy System",
        placement="energy-indicator",
        intro_date=date(2025, 12, 1),
        explanation="Hearts are now Energy! You get 25 Energy points daily that auto-refill over time. If your Energy runs low, practice previous lessons to earn instant refills and keep learning!",
        replaces_feature_id="hearts_system",
        user_facing=True
    ),
    FeatureDefinition(
        feature_id="practice_option",
        name="Practice Hub",
        placement="nav-practice",
        intro_date=date(2024, 5, 10),
        explanation="Your personalized Practice Hub is ready! Target tricky grammar, fix recent mistakes, and strengthen weak vocabulary. Use it anytime to warm up before starting a new unit.",
        replaces_feature_id=None,
        user_facing=True
    ),
    FeatureDefinition(
        feature_id="feed_tab",
        name="Social Feed",
        placement="nav-feed",
        intro_date=date(2025, 12, 20),
        explanation="Connect with friends on the Social Feed! Cheer on their streak milestones, send high-fives for quest completions, and celebrate your own learning wins.",
        replaces_feature_id=None,
        user_facing=True
    )
]

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Duolingo Reactivation Engine", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.post(
    "/api/v1/reactivation/evaluate",
    response_model=ReactivationResponse,
    status_code=status.HTTP_200_OK
)
def evaluate_reactivation(request: EngineInputRequest):
    """
    Evaluates returning user touchpoints, achievements, and metadata.
    Returns ReactivationResponse (Union[NotTriggeredResponse, EngineOutputResponse]).
    """
    # --------------------------------------------------------------------------
    # FIX 1: Enforce >= 30-day lapse trigger at API layer
    # --------------------------------------------------------------------------
    if request.lapse_duration_days < 30:
        return NotTriggeredResponse(
            triggered=False,
            reason=f"lapse_duration_days ({request.lapse_duration_days}) is below the 30-day threshold."
        )

    # --------------------------------------------------------------------------
    # FIX 2 & 3: Strict timestamp parsing (No silent fallback, raises HTTP 400)
    # --------------------------------------------------------------------------
    try:
        last_active = datetime.fromisoformat(request.last_active_timestamp.replace("Z", "+00:00"))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid last_active_timestamp format '{request.last_active_timestamp}': {str(e)}"
        )

    # --------------------------------------------------------------------------
    # Granular conversion error handling per payload component
    # --------------------------------------------------------------------------
    # Step A: Parse pre-churn touchpoints
    try:
        touchpoints = [
            PreChurnTouchpoint(
                feature_id=t.feature_id,
                frequency=t.frequency,
                avg_duration=t.avg_duration,
                engaged=t.engaged
            )
            for t in request.pre_churn_feature_touchpoints
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse pre_churn_feature_touchpoints: {str(e)}"
        )

    # Step B: Parse achievements
    try:
        achievements = PreChurnAchievements(
            streak_length=request.pre_churn_achievements.streak_length,
            league_placements=request.pre_churn_achievements.league_placements,
            league_wins=request.pre_churn_achievements.league_wins,
            words_learned=request.pre_churn_achievements.words_learned,
            lessons_completed=request.pre_churn_achievements.lessons_completed,
            gems=request.pre_churn_achievements.gems or 0,
            level=request.pre_churn_achievements.level or 1
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse pre_churn_achievements: {str(e)}"
        )

    # Step C: Parse feature definitions (with Eval 5.2 Database Timeout Fallback)
    try:
        features = []
        for f in request.feature_definitions_current:
            try:
                intro_d = datetime.strptime(f.intro_date, "%Y-%m-%d").date()
            except ValueError as ve:
                raise ValueError(f"Invalid intro_date format '{f.intro_date}' for feature '{f.feature_id}': expected YYYY-MM-DD") from ve

            features.append(FeatureDefinition(
                feature_id=f.feature_id,
                name=f.name,
                placement=f.placement,
                intro_date=intro_d,
                explanation=f.feature_explanation,
                replaces_feature_id=f.replaces_feature_id,
                user_facing=f.user_facing
            ))
        
        # Eval 5.2 Fallback: If feature catalog is empty (database timeout/disconnect), degrade gracefully
        effective_tier = request.persona_tier or "broad"
        if not features:
            features = DEFAULT_CORE_FEATURES
            effective_tier = "narrow"  # Degrade to baseline narrow tier on database timeout
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse feature_definitions_current: {str(e)}"
        )

    # Step D: Parse Pro nudge history
    try:
        pro_history = ProNudgeHistory(
            times_declined=request.pro_nudge_history.times_declined,
            avg_decline_speed=request.pro_nudge_history.avg_decline_speed,
            ever_trialed=request.pro_nudge_history.ever_trialed
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse pro_nudge_history: {str(e)}"
        )

    # Step E: Execute decision engine
    try:
        result_payload = engine.process_reactivation(
            last_active=last_active,
            touchpoints=touchpoints,
            achievements=achievements,
            features=features,
            pro_history=pro_history,
            persona_tier=effective_tier
        )
        return EngineOutputResponse(**result_payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Engine processing error: {str(e)}"
        )
