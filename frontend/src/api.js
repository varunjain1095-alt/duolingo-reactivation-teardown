/**
 * Duolingo Reactivation Engine — Client API SDK
 * Connects directly to the FastAPI REST API (engine.py) as the single source of truth.
 */

export const MOCK_PERSONA_PAYLOADS = {
  broad: {
    user_id: "usr_tim_broad_2026",
    last_active_timestamp: "2024-01-10T00:00:00Z",
    current_timestamp: "2026-01-10T00:00:00Z",
    lapse_duration_days: 730,
    persona_tier: "broad",
    pre_churn_feature_touchpoints: [
      {
        feature_id: "hearts_system",
        frequency: 18,
        avg_duration: 5.2,
        engaged: true
      },
      {
        feature_id: "practice_option",
        frequency: 8,
        avg_duration: 14.0,
        engaged: true
      }
    ],
    pre_churn_achievements: {
      streak_length: 24,
      league_placements: "Diamond",
      league_wins: 4,
      words_learned: 650,
      lessons_completed: 180,
      gems: 950,
      level: 8
    },
    pro_nudge_history: {
      times_declined: 1,
      avg_decline_speed: 1.2,
      ever_trialed: false
    },
    feature_definitions_current: [
      {
        feature_id: "energy_system",
        name: "Energy System",
        placement: "energy-indicator",
        intro_date: "2025-12-01",
        feature_explanation: "Hearts are now Energy! You get 25 Energy points daily that auto-refill over time. If your Energy runs low, practice previous lessons to earn instant refills and keep learning!",
        replaces_feature_id: "hearts_system",
        user_facing: true
      },
      {
        feature_id: "practice_option",
        name: "Practice Hub",
        placement: "nav-practice",
        intro_date: "2024-05-10",
        feature_explanation: "Your personalized Practice Hub is ready! Target tricky grammar, fix recent mistakes, and strengthen weak vocabulary. Use it anytime to warm up before starting a new unit.",
        replaces_feature_id: null,
        user_facing: true
      },
      {
        feature_id: "feed_tab",
        name: "Social Feed",
        placement: "nav-feed",
        intro_date: "2025-12-20",
        feature_explanation: "Connect with friends on the Social Feed! Cheer on their streak milestones, send high-fives for quest completions, and celebrate your own learning wins.",
        replaces_feature_id: null,
        user_facing: true
      },
      {
        feature_id: "video_call",
        name: "Interactive Video Call",
        placement: "dumbbell-node-btn",
        intro_date: "2026-01-15",
        feature_explanation: "Practice real-time conversational speaking with Lily! Experience interactive video scenarios that sharpen your listening and response speed under real world conditions.",
        replaces_feature_id: null,
        user_facing: true
      },
      {
        feature_id: "streak_shield",
        name: "Streak Shield",
        placement: "streak-shield-icon",
        intro_date: "2026-01-20",
        feature_explanation: "Protect your learning momentum with automatic streak recovery! If you miss a day, Streak Shield preserves your hard-earned streak intact so you never lose your progress.",
        replaces_feature_id: null,
        user_facing: true
      }
    ]
  },
  narrow: {
    user_id: "usr_john_narrow_2026",
    last_active_timestamp: "2025-01-10T00:00:00Z",
    current_timestamp: "2026-01-10T00:00:00Z",
    lapse_duration_days: 365,
    persona_tier: "narrow",
    pre_churn_feature_touchpoints: [
      {
        feature_id: "hearts_system",
        frequency: 10,
        avg_duration: 4.0,
        engaged: true
      },
      {
        feature_id: "practice_option",
        frequency: 4,
        avg_duration: 8.0,
        engaged: true
      }
    ],
    pre_churn_achievements: {
      streak_length: 8,
      league_placements: "Silver",
      league_wins: 1,
      words_learned: 120,
      lessons_completed: 35,
      gems: 200,
      level: 2
    },
    pro_nudge_history: {
      times_declined: 0,
      avg_decline_speed: 0.0,
      ever_trialed: false
    },
    feature_definitions_current: [
      {
        feature_id: "energy_system",
        name: "Energy System",
        placement: "energy-indicator",
        intro_date: "2025-12-01",
        feature_explanation: "Hearts are now Energy! You get 25 Energy points daily that auto-refill over time. If your Energy runs low, practice previous lessons to earn instant refills and keep learning!",
        replaces_feature_id: "hearts_system",
        user_facing: true
      },
      {
        feature_id: "practice_option",
        name: "Practice Hub",
        placement: "nav-practice",
        intro_date: "2024-05-10",
        feature_explanation: "Your personalized Practice Hub is ready! Target tricky grammar, fix recent mistakes, and strengthen weak vocabulary. Use it anytime to warm up before starting a new unit.",
        replaces_feature_id: null,
        user_facing: true
      }
    ]
  }
};

/**
 * Fetches reactivation evaluation from the FastAPI backend service (engine.py).
 * Architecture Section 6 single source of truth.
 */
const DEFAULT_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? "" : "http://localhost:8000");

export async function fetchReactivationEvaluation(requestPayload, apiBaseUrl = DEFAULT_API_BASE_URL) {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/reactivation/evaluate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Engine API returned HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return { data, source: "FastAPI REST Service (engine.py)" };
  } catch (err) {
    console.error("FastAPI Decision Engine error:", err);
    return { error: err.message, data: null, source: "Failed: API Unreachable" };
  }
}
