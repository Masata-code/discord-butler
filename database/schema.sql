-- Discord Butler Database Schema
-- PostgreSQL 15+

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_skill_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE session_status AS ENUM ('active', 'completed', 'expired', 'error');
CREATE TYPE user_action AS ENUM ('selected', 'rejected', 'deferred', 'feedback_provided');
CREATE TYPE tool_category AS ENUM ('content_creation', 'data_analysis', 'programming', 'design', 'research', 'business', 'other');

-- ユーザープロファイルテーブル
CREATE TABLE user_profiles (
    user_id VARCHAR(255) PRIMARY KEY,
    discord_id VARCHAR(255) UNIQUE NOT NULL,
    discord_username VARCHAR(255) NOT NULL,
    skill_level user_skill_level DEFAULT 'beginner',
    preferences JSONB DEFAULT '{
        "language": "ja",
        "notification_enabled": true,
        "preferred_categories": []
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_sessions INT DEFAULT 0,
    total_recommendations INT DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    gdpr_consent BOOLEAN DEFAULT false,
    gdpr_consent_date TIMESTAMP WITH TIME ZONE
);

-- AIツールマスターテーブル
CREATE TABLE ai_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    category tool_category NOT NULL,
    subcategory VARCHAR(100),
    description TEXT NOT NULL,
    capabilities JSONB NOT NULL,
    pricing_model JSONB NOT NULL DEFAULT '{
        "free_tier": false,
        "price_per_month": null,
        "price_per_request": null,
        "enterprise_pricing": false
    }',
    supported_languages TEXT[] NOT NULL DEFAULT ARRAY['en'],
    skill_level_min INT CHECK (skill_level_min BETWEEN 1 AND 10) DEFAULT 1,
    skill_level_max INT CHECK (skill_level_max BETWEEN 1 AND 10) DEFAULT 10,
    api_availability BOOLEAN DEFAULT false,
    official_website VARCHAR(500),
    documentation_url VARCHAR(500),
    popularity_score DECIMAL(3,2) CHECK (popularity_score BETWEEN 0 AND 10),
    performance_score DECIMAL(3,2) CHECK (performance_score BETWEEN 0 AND 10),
    ease_of_use_score DECIMAL(3,2) CHECK (ease_of_use_score BETWEEN 0 AND 10),
    context_window_size INT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'
);

-- セッション管理テーブル
CREATE TABLE sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    context JSONB DEFAULT '[]',
    task_profile JSONB,
    recommendations JSONB,
    feedback JSONB,
    status session_status DEFAULT 'active',
    message_count INT DEFAULT 0,
    total_tokens_used INT DEFAULT 0,
    error_count INT DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

-- メッセージ履歴テーブル
CREATE TABLE message_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(session_id) ON DELETE CASCADE,
    user_id VARCHAR(255) REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('user', 'bot', 'system')),
    content TEXT NOT NULL,
    encrypted_content BYTEA,
    attachments JSONB DEFAULT '[]',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tokens_used INT,
    processing_time_ms INT,
    metadata JSONB DEFAULT '{}'
);

-- ツール使用履歴テーブル
CREATE TABLE tool_usage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(session_id) ON DELETE CASCADE,
    user_id VARCHAR(255) REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    tool_id UUID REFERENCES ai_tools(id) ON DELETE SET NULL,
    recommended_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    recommendation_score DECIMAL(5,4) CHECK (recommendation_score BETWEEN 0 AND 1),
    user_action user_action,
    action_timestamp TIMESTAMP WITH TIME ZONE,
    feedback_score INT CHECK (feedback_score BETWEEN 1 AND 5),
    feedback_text TEXT,
    feedback_timestamp TIMESTAMP WITH TIME ZONE,
    guide_generated BOOLEAN DEFAULT false,
    guide_quality_score DECIMAL(3,2),
    outcome JSONB DEFAULT '{
        "task_completed": null,
        "time_saved_minutes": null,
        "follow_up_needed": false
    }',
    metadata JSONB DEFAULT '{}'
);

-- フィードバック集計テーブル
CREATE TABLE feedback_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_id UUID REFERENCES ai_tools(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_recommendations INT DEFAULT 0,
    total_selections INT DEFAULT 0,
    total_rejections INT DEFAULT 0,
    average_feedback_score DECIMAL(3,2),
    selection_rate DECIMAL(5,4),
    satisfaction_rate DECIMAL(5,4),
    common_feedback_themes JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tool_id, period_start, period_end)
);

-- システム設定テーブル
CREATE TABLE system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(100),
    is_sensitive BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255)
);

-- エラーログテーブル
CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(session_id) ON DELETE SET NULL,
    user_id VARCHAR(255) REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    context JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- APIレート制限テーブル
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL, -- user_id or ip_address
    identifier_type VARCHAR(50) NOT NULL CHECK (identifier_type IN ('user', 'ip')),
    endpoint VARCHAR(255) NOT NULL,
    requests_count INT DEFAULT 0,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    window_end TIMESTAMP WITH TIME ZONE,
    is_blocked BOOLEAN DEFAULT false,
    blocked_until TIMESTAMP WITH TIME ZONE,
    UNIQUE(identifier, identifier_type, endpoint, window_start)
);

-- インデックスの作成
CREATE INDEX idx_user_profiles_discord_id ON user_profiles(discord_id);
CREATE INDEX idx_user_profiles_last_active ON user_profiles(last_active);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_started_at ON sessions(started_at);
CREATE INDEX idx_message_history_session ON message_history(session_id);
CREATE INDEX idx_message_history_timestamp ON message_history(timestamp);
CREATE INDEX idx_tool_usage_session ON tool_usage_history(session_id);
CREATE INDEX idx_tool_usage_tool ON tool_usage_history(tool_id);
CREATE INDEX idx_tool_usage_recommended_at ON tool_usage_history(recommended_at);
CREATE INDEX idx_ai_tools_category ON ai_tools(category);
CREATE INDEX idx_ai_tools_active ON ai_tools(is_active);
CREATE INDEX idx_ai_tools_capabilities ON ai_tools USING gin(capabilities);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier, identifier_type);

-- トリガー関数：updated_atの自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーの設定
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_tools_updated_at BEFORE UPDATE ON ai_tools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ビューの作成：アクティブセッション
CREATE VIEW active_sessions AS
SELECT 
    s.session_id,
    s.user_id,
    u.discord_username,
    s.started_at,
    s.last_activity,
    s.message_count,
    s.status
FROM sessions s
JOIN user_profiles u ON s.user_id = u.user_id
WHERE s.status = 'active'
    AND s.last_activity > CURRENT_TIMESTAMP - INTERVAL '1 hour';

-- ビューの作成：ツール人気ランキング
CREATE VIEW tool_popularity_ranking AS
SELECT 
    t.id,
    t.name,
    t.display_name,
    t.category,
    COUNT(DISTINCT tuh.session_id) as total_recommendations,
    COUNT(DISTINCT CASE WHEN tuh.user_action = 'selected' THEN tuh.session_id END) as total_selections,
    COALESCE(AVG(tuh.feedback_score), 0) as avg_feedback_score,
    CASE 
        WHEN COUNT(DISTINCT tuh.session_id) > 0 
        THEN COUNT(DISTINCT CASE WHEN tuh.user_action = 'selected' THEN tuh.session_id END)::DECIMAL / COUNT(DISTINCT tuh.session_id)
        ELSE 0 
    END as selection_rate
FROM ai_tools t
LEFT JOIN tool_usage_history tuh ON t.id = tuh.tool_id
WHERE t.is_active = true
GROUP BY t.id, t.name, t.display_name, t.category
ORDER BY selection_rate DESC, total_recommendations DESC;

-- 初期データ投入のサンプル
INSERT INTO system_settings (key, value, description, category) VALUES
('session_timeout_minutes', '60', 'セッションタイムアウト時間（分）', 'session'),
('max_context_messages', '10', '保持する最大コンテキストメッセージ数', 'session'),
('default_language', '"ja"', 'デフォルト言語設定', 'localization'),
('ai_temperature', '0.7', 'AI応答の温度パラメータ', 'ai'),
('max_retries', '3', 'API呼び出しの最大リトライ回数', 'api'),
('rate_limit_window_minutes', '5', 'レート制限のウィンドウ時間（分）', 'security'),
('rate_limit_max_requests', '100', 'レート制限の最大リクエスト数', 'security');

-- 権限の付与（本番環境用）
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO discord_butler_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO discord_butler_app;