-- ==============================================================================
-- Duolingo Reactivation Engine — Database Migration Schema (Table 5)
-- Target Database: Supabase PostgreSQL
-- ==============================================================================

-- 1. Create Feature Definitions Table
CREATE TABLE IF NOT EXISTS feature_definitions (
    feature_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    placement VARCHAR(64) NOT NULL,
    intro_date DATE NOT NULL,
    explanation TEXT NOT NULL,
    replaces_feature_id VARCHAR(64) REFERENCES feature_definitions(feature_id) ON DELETE SET NULL,
    user_facing BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_feature_user_facing ON feature_definitions(user_facing);
CREATE INDEX IF NOT EXISTS idx_feature_intro_date ON feature_definitions(intro_date);
CREATE INDEX IF NOT EXISTS idx_feature_replaces ON feature_definitions(replaces_feature_id);

-- 3. Seed Canonical Feature Catalog Data
-- Legacy & Base Features
INSERT INTO feature_definitions (feature_id, name, placement, intro_date, explanation, replaces_feature_id, user_facing)
VALUES 
    ('hearts_system', 'Hearts System', 'top_bar_hearts', '2019-01-01', 'Legacy 5-heart daily mistakes counter.', NULL, TRUE)
ON CONFLICT (feature_id) DO UPDATE SET
    name = EXCLUDED.name,
    placement = EXCLUDED.placement,
    intro_date = EXCLUDED.intro_date,
    explanation = EXCLUDED.explanation,
    replaces_feature_id = EXCLUDED.replaces_feature_id,
    user_facing = EXCLUDED.user_facing;

-- Mechanic Mutations (Energy replaces Hearts)
INSERT INTO feature_definitions (feature_id, name, placement, intro_date, explanation, replaces_feature_id, user_facing)
VALUES 
    ('energy_system', 'Energy System', 'energy-indicator', '2025-12-01', 'Hearts are now Energy! You get 25 Energy points daily that auto-refill over time. If your Energy runs low, practice previous lessons to earn instant refills and keep learning!', 'hearts_system', TRUE)
ON CONFLICT (feature_id) DO UPDATE SET
    name = EXCLUDED.name,
    placement = EXCLUDED.placement,
    intro_date = EXCLUDED.intro_date,
    explanation = EXCLUDED.explanation,
    replaces_feature_id = EXCLUDED.replaces_feature_id,
    user_facing = EXCLUDED.user_facing;

-- Workflow Matched & Post-Launch Features
INSERT INTO feature_definitions (feature_id, name, placement, intro_date, explanation, replaces_feature_id, user_facing)
VALUES 
    ('practice_option', 'Practice Hub', 'nav-practice', '2024-05-10', 'Your personalized Practice Hub is ready! Target tricky grammar, fix recent mistakes, and strengthen weak vocabulary. Use it anytime to warm up before starting a new unit.', NULL, TRUE),
    ('feed_tab', 'Social Feed', 'nav-feed', '2025-12-20', 'Connect with friends on the Social Feed! Cheer on their streak milestones, send high-fives for quest completions, and celebrate your own learning wins.', NULL, TRUE),
    ('video_call', 'Interactive Video Call', 'video-call-btn', '2026-01-15', 'Practice real-time conversational speaking with Lily! Experience interactive video scenarios that sharpen your listening and response speed under real world conditions.', NULL, TRUE),
    ('streak_shield', 'Streak Shield', 'streak-shield-icon', '2026-01-20', 'Protect your learning momentum with automatic streak recovery! If you miss a day, Streak Shield preserves your hard-earned streak intact so you never lose your progress.', NULL, TRUE)
ON CONFLICT (feature_id) DO UPDATE SET
    name = EXCLUDED.name,
    placement = EXCLUDED.placement,
    intro_date = EXCLUDED.intro_date,
    explanation = EXCLUDED.explanation,
    replaces_feature_id = EXCLUDED.replaces_feature_id,
    user_facing = EXCLUDED.user_facing;

-- Backend / Infrastructure Upgrades (user_facing = FALSE, excluded from all UI spotlights)
INSERT INTO feature_definitions (feature_id, name, placement, intro_date, explanation, replaces_feature_id, user_facing)
VALUES 
    ('grpc_migration', 'gRPC Protocol v2 Migration', 'internal_infra', '2025-11-01', 'Backend RPC latency reduction and protocol optimization.', NULL, FALSE),
    ('db_indexing_v2', 'PostgreSQL Query Optimizations', 'internal_db', '2025-11-15', 'Database read latency reduction for lesson content.', NULL, FALSE)
ON CONFLICT (feature_id) DO UPDATE SET
    name = EXCLUDED.name,
    placement = EXCLUDED.placement,
    intro_date = EXCLUDED.intro_date,
    explanation = EXCLUDED.explanation,
    replaces_feature_id = EXCLUDED.replaces_feature_id,
    user_facing = EXCLUDED.user_facing;
