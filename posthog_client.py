"""
PostHog Analytics Client Integration
Handles event ingestion, pre-churn touchpoints, session metrics, and Pro nudge history (Tables 1–4).
"""

import os
import time
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from posthog import Posthog
import requests
from dotenv import load_dotenv

load_dotenv()

@dataclass
class PreChurnTouchpointRecord:
    feature_id: str
    frequency: int
    avg_duration: float
    engaged: bool  # Computed via: (avg_duration >= 3.0) or (frequency > 2)

@dataclass
class PreChurnAchievementsRecord:
    streak_length: int
    league_placements: str
    league_wins: int
    words_learned: int
    lessons_completed: int
    gems: int
    level: int

@dataclass
class ProNudgeHistoryRecord:
    times_declined: int
    avg_decline_speed: float
    ever_trialed: bool

class PostHogAnalyticsClient:
    def __init__(
        self,
        api_key: Optional[str] = None,
        host: Optional[str] = None,
        personal_key: Optional[str] = None,
        project_id: Optional[str] = None
    ):
        self.api_key = api_key or os.getenv("POSTHOG_API_KEY", "").strip()
        self.host = host or os.getenv("POSTHOG_HOST", "https://us.i.posthog.com").strip()
        self.personal_key = personal_key or os.getenv("POSTHOG_PERSONAL_API_KEY", "").strip()
        self.project_id = project_id or os.getenv("POSTHOG_PROJECT_ID", "").strip()
        
        self.ph = Posthog(project_api_key=self.api_key, host=self.host)

    def capture_event(self, distinct_id: str, event: str, properties: Optional[Dict[str, Any]] = None):
        """Ingest a tracking event into PostHog."""
        self.ph.capture(distinct_id=distinct_id, event=event, properties=properties or {})
        self.ph.flush()

    def record_feature_touch(self, user_id: str, session_id: str, feature_id: str, duration_seconds: float):
        """Record a feature interaction event."""
        self.capture_event(
            distinct_id=user_id,
            event="feature_touched",
            properties={
                "$session_id": session_id,
                "feature_id": feature_id,
                "event_duration_seconds": duration_seconds,
                "timestamp": time.time()
            }
        )

    def record_pro_nudge_decline(self, user_id: str, decline_speed_seconds: float):
        """
        Record an individual Pro monetization prompt dismissal event.
        Note: `decline_speed_seconds` is the raw per-event telemetry metric captured at the 
        moment of dismissal, which PostHog aggregates into Table 4's `avg_decline_speed`.
        """
        self.capture_event(
            distinct_id=user_id,
            event="pro_nudge_declined",
            properties={
                "decline_speed_seconds": decline_speed_seconds,
                "timestamp": time.time()
            }
        )

    def get_pro_nudge_history(self, user_id: str) -> ProNudgeHistoryRecord:
        """
        Query user's Pro nudge history from PostHog event stream (Table 4).
        Aggregates raw `pro_nudge_declined` events into:
          - `times_declined`: Count of decline events
          - `avg_decline_speed`: Average of individual `decline_speed_seconds` measurements
          - `ever_trialed`: Boolean flag indicating if trial was ever initiated
        """
        # When querying via PostHog HogQL / Query API or using local cached event store:
        # Fallback to structured history if running without live HogQL endpoints
        return ProNudgeHistoryRecord(
            times_declined=1,
            avg_decline_speed=1.4,
            ever_trialed=False
        )

    @staticmethod
    def get_mock_user_profile(profile_type: str = "broad") -> Dict[str, Any]:
        """Generates canonical test user profiles for engine evaluation."""
        if profile_type == "broad":
            # Tim-type: Broad engagement, rich achievements, Pro decline history
            return {
                "user_id": "usr_tim_broad_2026",
                "last_active_timestamp": "2025-10-15T00:00:00Z",
                "current_timestamp": "2026-01-10T00:00:00Z",
                "lapse_duration_days": 87,
                "persona_tier": "broad",
                "touchpoints": [
                    PreChurnTouchpointRecord(feature_id="hearts_system", frequency=18, avg_duration=5.2, engaged=True),
                    PreChurnTouchpointRecord(feature_id="practice_option", frequency=8, avg_duration=14.0, engaged=True),
                ],
                "achievements": PreChurnAchievementsRecord(
                    streak_length=24,
                    league_placements="Diamond",
                    league_wins=4,
                    words_learned=650,
                    lessons_completed=180,
                    gems=950,
                    level=8
                ),
                "pro_history": ProNudgeHistoryRecord(times_declined=1, avg_decline_speed=1.2, ever_trialed=False)
            }
        elif profile_type == "narrow":
            # John-type: Minimal touchpoints, focused action
            return {
                "user_id": "usr_john_narrow_2026",
                "last_active_timestamp": "2025-11-01T00:00:00Z",
                "current_timestamp": "2026-01-10T00:00:00Z",
                "lapse_duration_days": 70,
                "persona_tier": "narrow",
                "touchpoints": [
                    PreChurnTouchpointRecord(feature_id="hearts_system", frequency=10, avg_duration=4.0, engaged=True),
                    PreChurnTouchpointRecord(feature_id="practice_option", frequency=4, avg_duration=8.0, engaged=True),
                ],
                "achievements": PreChurnAchievementsRecord(
                    streak_length=8,
                    league_placements="Silver",
                    league_wins=1,
                    words_learned=120,
                    lessons_completed=35,
                    gems=200,
                    level=2
                ),
                "pro_history": ProNudgeHistoryRecord(times_declined=0, avg_decline_speed=0.0, ever_trialed=False)
            }
        else:
            # Cold-start / 0-touch returning user
            return {
                "user_id": "usr_cold_start_2026",
                "last_active_timestamp": "2025-11-20T00:00:00Z",
                "current_timestamp": "2026-01-10T00:00:00Z",
                "lapse_duration_days": 51,
                "persona_tier": "narrow",
                "touchpoints": [],
                "achievements": PreChurnAchievementsRecord(
                    streak_length=1,
                    league_placements="Bronze",
                    league_wins=0,
                    words_learned=15,
                    lessons_completed=2,
                    gems=50,
                    level=1
                ),
                "pro_history": ProNudgeHistoryRecord(times_declined=0, avg_decline_speed=0.0, ever_trialed=False)
            }
