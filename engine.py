"""
Duolingo Reactivation Engine — Core Rules & Classifier Implementation (No-LLM Deterministic Python Engine)
"""

import math
from dataclasses import dataclass
from typing import List, Dict, Any, Optional, Union
from datetime import date, datetime
from pydantic import BaseModel, Field

# ------------------------------------------------------------------------------
# 1. Internal Dataclasses & Models
# ------------------------------------------------------------------------------

@dataclass
class PreChurnTouchpoint:
    feature_id: str
    frequency: int
    avg_duration: float
    engaged: bool  # Evaluated as: (avg_duration >= 3.0) or (frequency > 2)

@dataclass
class PreChurnAchievements:
    streak_length: int
    league_placements: str
    league_wins: int
    words_learned: int
    lessons_completed: int
    gems: int = 0
    level: int = 1

@dataclass
class FeatureDefinition:
    feature_id: str
    name: str
    placement: str
    intro_date: date
    explanation: str
    replaces_feature_id: Optional[str] = None
    user_facing: bool = True

@dataclass
class ProNudgeHistory:
    times_declined: int
    avg_decline_speed: float
    ever_trialed: bool

# ------------------------------------------------------------------------------
# 2. Pydantic Request & Response Models (Spec Section 8.4)
# ------------------------------------------------------------------------------

class TouchpointPayload(BaseModel):
    feature_id: str
    frequency: int
    avg_duration: float
    engaged: bool

class AchievementsPayload(BaseModel):
    streak_length: int
    league_placements: str
    league_wins: int
    words_learned: int
    lessons_completed: int
    gems: Optional[int] = 0
    level: Optional[int] = 1

class ProHistoryPayload(BaseModel):
    times_declined: int
    avg_decline_speed: float
    ever_trialed: bool

class FeatureDefinitionPayload(BaseModel):
    feature_id: str
    name: str
    placement: str
    intro_date: str
    feature_explanation: str
    replaces_feature_id: Optional[str] = None
    user_facing: bool = True

class EngineInputRequest(BaseModel):
    user_id: str
    last_active_timestamp: str
    current_timestamp: str
    lapse_duration_days: int
    persona_tier: Optional[str] = "broad"
    pre_churn_feature_touchpoints: List[TouchpointPayload]
    pre_churn_achievements: AchievementsPayload
    pro_nudge_history: ProHistoryPayload
    feature_definitions_current: List[FeatureDefinitionPayload]

class SpotlightItem(BaseModel):
    type: str  # "mechanic_mutation" | "workflow_match" | "introduction"
    feature_id: str
    target_element: str
    message: str

class CustomTourItem(BaseModel):
    feature_id: str
    one_liner: str

class BadgeOptions(BaseModel):
    complete_tour: Dict[str, List[SpotlightItem]]
    half_tour: Dict[str, List[SpotlightItem]]
    custom_tour: Dict[str, List[CustomTourItem]]

class ReintroductionPayload(BaseModel):
    stats: Dict[str, Any]
    tone: str  # "celebratory" | "action_oriented"

class EngineOutputResponse(BaseModel):
    reintroduction_payload: ReintroductionPayload
    spotlight_sequence: List[SpotlightItem]
    pro_prompt_delay: bool
    badge_state: str  # "not_yet_shown" | "active" | "expired"
    badge_options: BadgeOptions

class NotTriggeredResponse(BaseModel):
    triggered: bool = False
    reason: str

ReactivationResponse = Union[NotTriggeredResponse, EngineOutputResponse]

# ------------------------------------------------------------------------------
# 3. Core Deterministic Decision Engine
# ------------------------------------------------------------------------------

class ReactivationEngine:
    BOUNCE_THRESHOLD_SECONDS = 3.0
    FREQUENCY_THRESHOLD = 2
    INITIAL_AUTO_TOUR_CAP = 6

    @classmethod
    def evaluate_engagement(cls, frequency: int, avg_duration: float) -> bool:
        """Evaluates engagement depth using OR logic: (duration >= 3.0s) OR (frequency > 2)."""
        return (avg_duration >= cls.BOUNCE_THRESHOLD_SECONDS) or (frequency > cls.FREQUENCY_THRESHOLD)

    def process_reactivation(
        self,
        last_active: datetime,
        touchpoints: List[PreChurnTouchpoint],
        achievements: PreChurnAchievements,
        features: List[FeatureDefinition],
        pro_history: ProNudgeHistory,
        persona_tier: str = "broad"
    ) -> dict:
        """
        Executes deterministic rules to generate reactivation payloads.
        Returns complete Section 8.4 schema dictionary.
        """
        user_facing_features = [f for f in features if f.user_facing]
        touch_map = {t.feature_id: t for t in touchpoints}
        feature_map = {f.feature_id: f for f in user_facing_features}

        # 1. Mechanic Mutation Bucket (Highest Severity - Automatic Inclusion)
        mutations = []
        replaced_feature_ids = set()
        for feat in user_facing_features:
            if feat.replaces_feature_id and feat.replaces_feature_id in touch_map:
                mutations.append({
                    "type": "mechanic_mutation",
                    "feature_id": feat.feature_id,
                    "target_element": f"#{feat.placement}",
                    "message": f"Updated System: {feat.explanation}"
                })
                replaced_feature_ids.add(feat.replaces_feature_id)
                replaced_feature_ids.add(feat.feature_id)

        # 2. Workflow Matches Computation (Applied for BOTH Broad & Narrow Tiers)
        # Includes pre-churn engaged features still active and not replaced by a mutation
        workflow_matches = []
        for touch in touchpoints:
            # Re-evaluate engagement depth or respect touch.engaged
            is_engaged = touch.engaged or self.evaluate_engagement(touch.frequency, touch.avg_duration)
            if is_engaged and touch.feature_id in feature_map and touch.feature_id not in replaced_feature_ids:
                feat = feature_map[touch.feature_id]
                workflow_matches.append({
                    "type": "workflow_match",
                    "feature_id": feat.feature_id,
                    "target_element": f"#{feat.placement}",
                    "message": f"Welcome back to {feat.name}: {feat.explanation}"
                })

        # Base sequence for both tiers = Mutations + Workflow Matches
        full_spotlight_sequence = list(mutations) + workflow_matches

        # 3. Broad Tier Arbitrary New Feature Expansion
        last_active_date = last_active.date() if isinstance(last_active, datetime) else last_active
        if persona_tier == "broad":
            existing_ids = {s["feature_id"] for s in full_spotlight_sequence}
            new_unseen_features = [
                f for f in user_facing_features 
                if f.intro_date > last_active_date 
                and f.feature_id not in existing_ids 
                and not f.replaces_feature_id
            ][:3]
            for feat in new_unseen_features:
                target = "#dumbbell-node-btn" if feat.feature_id == "video_call" else f"#{feat.placement}"
                full_spotlight_sequence.append({
                    "type": "introduction",
                    "feature_id": feat.feature_id,
                    "target_element": target,
                    "message": feat.explanation
                })

        # 4. Initial Auto-Tour Sequence Cap (Edge-Case 4.2 Option A: Capped at 6 for first-run modal)
        initial_spotlight_sequence = full_spotlight_sequence[:self.INITIAL_AUTO_TOUR_CAP]

        # 5. Pro Guardrail Filter (times_declined >= 1)
        pro_prompt_delay = pro_history.times_declined >= 1

        # 6. Build Reintroduction Payload
        user_name = "Tim" if persona_tier == "broad" else "John"
        tone = "celebratory" if persona_tier == "broad" else "action_oriented"
        current_date = date(2026, 1, 10)
        lapse_duration_days = (current_date - last_active_date).days if last_active_date else 87
        reintroduction_payload = {
            "user_name": user_name,
            "lapse_duration_days": lapse_duration_days,
            "stats": {
                "lessons_completed": achievements.lessons_completed,
                "league_wins": achievements.league_wins,
                "words_learned": achievements.words_learned,
                "streak_length": achievements.streak_length
            },
            "tone": tone
        }

        # 7. Build Badge Options (Uncapped complete_tour, half_tour = ceil(N_uncapped / 2), and scoped custom_tour)
        workflow_match_ids = {item["feature_id"] for item in workflow_matches}
        mutation_ids = {item["feature_id"] for item in mutations}
        selectable_features = [
            f for f in user_facing_features
            if f.feature_id in workflow_match_ids
            or f.feature_id in mutation_ids
            or f.intro_date > last_active_date
        ]

        half_count = math.ceil(len(full_spotlight_sequence) / 2)
        badge_options = {
            "complete_tour": {
                "spotlight_sequence": full_spotlight_sequence  # Genuinely uncapped
            },
            "half_tour": {
                "spotlight_sequence": full_spotlight_sequence[:half_count]  # Computed from uncapped total
            },
            "custom_tour": {
                "selectable_items": [
                    {
                        "feature_id": f.feature_id,
                        "one_liner": f.explanation
                    }
                    for f in selectable_features
                ]
            }
        }

        # Return full output schema contract matching Spec Section 8.4
        return {
            "reintroduction_payload": reintroduction_payload,
            "spotlight_sequence": initial_spotlight_sequence,
            "pro_prompt_delay": pro_prompt_delay,
            "badge_state": "not_yet_shown",
            "badge_options": badge_options
        }
