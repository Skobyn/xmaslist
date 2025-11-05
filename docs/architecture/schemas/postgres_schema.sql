-- PostgreSQL Schema for Christmas Wishlist Application (Custom Backend)
-- This schema is designed for a standalone Node.js backend with full control

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- Custom types
CREATE TYPE share_role AS ENUM ('viewer', 'editor', 'admin');
CREATE TYPE resource_type AS ENUM ('location', 'list');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE auth_provider AS ENUM ('email', 'google', 'facebook', 'apple');

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    password_hash TEXT, -- bcrypt hash, nullable for OAuth users
    display_name TEXT,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    auth_provider auth_provider DEFAULT 'email',
    auth_provider_id TEXT, -- External provider user ID
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_provider ON users(auth_provider, auth_provider_id);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Full-text search index for user search
CREATE INDEX idx_users_name_search ON users USING gin(
    to_tsvector('english', COALESCE(display_name, '') || ' ' || COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
);

-- =====================================================
-- SESSIONS TABLE (for JWT refresh tokens)
-- =====================================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(refresh_token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Auto-delete expired sessions
CREATE INDEX idx_sessions_expired ON sessions(expires_at) WHERE expires_at < NOW();

-- =====================================================
-- PASSWORD_RESET_TOKENS TABLE
-- =====================================================
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_reset_tokens_token ON password_reset_tokens(token);

-- =====================================================
-- EMAIL_VERIFICATION_TOKENS TABLE
-- =====================================================
CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_verify_tokens_user ON email_verification_tokens(user_id);
CREATE INDEX idx_verify_tokens_token ON email_verification_tokens(token);

-- =====================================================
-- LOCATIONS TABLE
-- =====================================================
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_locations_owner ON locations(owner_id);
CREATE INDEX idx_locations_archived ON locations(is_archived) WHERE is_archived = FALSE;
CREATE INDEX idx_locations_created_at ON locations(created_at DESC);

-- =====================================================
-- LOCATION_MEMBERS TABLE (many-to-many)
-- =====================================================
CREATE TABLE location_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role share_role NOT NULL DEFAULT 'viewer',
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(location_id, user_id)
);

-- Indexes
CREATE INDEX idx_location_members_location ON location_members(location_id);
CREATE INDEX idx_location_members_user ON location_members(user_id);
CREATE INDEX idx_location_members_role ON location_members(role);

-- =====================================================
-- LISTS TABLE
-- =====================================================
CREATE TABLE lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT FALSE,
    guest_access_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    theme_color TEXT, -- Hex color for UI customization
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_year CHECK (year >= 2000 AND year <= 2100)
);

-- Indexes
CREATE INDEX idx_lists_location ON lists(location_id);
CREATE INDEX idx_lists_owner ON lists(owner_id);
CREATE INDEX idx_lists_year ON lists(year);
CREATE INDEX idx_lists_active ON lists(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_lists_public ON lists(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_lists_guest_token ON lists(guest_access_token) WHERE guest_access_token IS NOT NULL;
CREATE INDEX idx_lists_created_at ON lists(created_at DESC);

-- Composite index for common queries
CREATE INDEX idx_lists_location_year ON lists(location_id, year, is_active);

-- =====================================================
-- ITEMS TABLE
-- =====================================================
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    currency TEXT DEFAULT 'USD',
    url TEXT,
    image_url TEXT,
    is_purchased BOOLEAN DEFAULT FALSE,
    purchased_by UUID REFERENCES users(id) ON DELETE SET NULL,
    purchased_at TIMESTAMP WITH TIME ZONE,
    priority priority_level DEFAULT 'medium',
    quantity INTEGER DEFAULT 1,
    notes TEXT, -- Private notes for the purchaser
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_price CHECK (price >= 0),
    CONSTRAINT valid_quantity CHECK (quantity > 0),
    CONSTRAINT valid_url CHECK (url IS NULL OR url ~* '^https?://')
);

-- Indexes
CREATE INDEX idx_items_list ON items(list_id);
CREATE INDEX idx_items_created_by ON items(created_by);
CREATE INDEX idx_items_purchased ON items(is_purchased);
CREATE INDEX idx_items_purchased_by ON items(purchased_by) WHERE purchased_by IS NOT NULL;
CREATE INDEX idx_items_priority ON items(priority);
CREATE INDEX idx_items_created_at ON items(created_at DESC);

-- Composite index for filtering
CREATE INDEX idx_items_list_purchased ON items(list_id, is_purchased);

-- Full-text search index
CREATE INDEX idx_items_search ON items USING gin(
    to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, ''))
);

-- =====================================================
-- SHARES TABLE
-- =====================================================
CREATE TABLE shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_type resource_type NOT NULL,
    resource_id UUID NOT NULL,
    shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role share_role NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(resource_type, resource_id, shared_with),
    CHECK (shared_by != shared_with),
    CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Indexes
CREATE INDEX idx_shares_resource ON shares(resource_type, resource_id);
CREATE INDEX idx_shares_shared_with ON shares(shared_with);
CREATE INDEX idx_shares_shared_by ON shares(shared_by);
CREATE INDEX idx_shares_expires_at ON shares(expires_at) WHERE expires_at IS NOT NULL;

-- Composite index for authorization queries
CREATE INDEX idx_shares_auth ON shares(resource_type, resource_id, shared_with, role);

-- =====================================================
-- ITEM_COMMENTS TABLE (optional feature)
-- =====================================================
CREATE TABLE item_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_comments_item ON item_comments(item_id, created_at);
CREATE INDEX idx_comments_user ON item_comments(user_id);

-- =====================================================
-- ACTIVITY_LOG TABLE (audit trail)
-- =====================================================
CREATE TABLE activity_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activity_user ON activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_resource ON activity_log(resource_type, resource_id);
CREATE INDEX idx_activity_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_metadata ON activity_log USING gin(metadata);

-- Partition by month for performance (optional, for high volume)
-- CREATE TABLE activity_log_2024_12 PARTITION OF activity_log
--     FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- =====================================================
-- NOTIFICATIONS TABLE (optional feature)
-- =====================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'share', 'purchase', 'comment', etc.
    is_read BOOLEAN DEFAULT FALSE,
    related_resource_type TEXT,
    related_resource_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lists_updated_at
    BEFORE UPDATE ON lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
    BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON item_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER FOR PURCHASED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION set_purchased_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_purchased = TRUE AND OLD.is_purchased = FALSE THEN
        NEW.purchased_at = NOW();
    ELSIF NEW.is_purchased = FALSE THEN
        NEW.purchased_at = NULL;
        NEW.purchased_by = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_item_purchased_at
    BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION set_purchased_at();

-- =====================================================
-- TRIGGER FOR SESSION CLEANUP
-- =====================================================
CREATE OR REPLACE FUNCTION update_session_last_used()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_used_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sessions_last_used
    BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_session_last_used();

-- =====================================================
-- TRIGGER FOR ACTIVITY LOGGING
-- =====================================================
CREATE OR REPLACE FUNCTION log_item_purchase()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_purchased = TRUE AND OLD.is_purchased = FALSE THEN
        INSERT INTO activity_log (user_id, action, resource_type, resource_id, metadata)
        VALUES (
            NEW.purchased_by,
            'item_purchased',
            'item',
            NEW.id,
            jsonb_build_object(
                'item_title', NEW.title,
                'list_id', NEW.list_id,
                'price', NEW.price
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_item_purchase_trigger
    AFTER UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION log_item_purchase();

-- =====================================================
-- FUNCTIONS FOR AUTHORIZATION
-- =====================================================

-- Check if user has access to a list
CREATE OR REPLACE FUNCTION has_list_access(
    list_uuid UUID,
    user_uuid UUID,
    min_role share_role DEFAULT 'viewer'
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM lists
        WHERE id = list_uuid
        AND (
            owner_id = user_uuid
            OR is_public = TRUE
            OR id IN (
                SELECT resource_id FROM shares
                WHERE resource_type = 'list'
                AND resource_id = list_uuid
                AND shared_with = user_uuid
                AND role >= min_role
                AND (expires_at IS NULL OR expires_at > NOW())
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has access to a location
CREATE OR REPLACE FUNCTION has_location_access(
    location_uuid UUID,
    user_uuid UUID,
    min_role share_role DEFAULT 'viewer'
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM locations
        WHERE id = location_uuid
        AND (
            owner_id = user_uuid
            OR id IN (
                SELECT resource_id FROM shares
                WHERE resource_type = 'location'
                AND resource_id = location_uuid
                AND shared_with = user_uuid
                AND role >= min_role
                AND (expires_at IS NULL OR expires_at > NOW())
            )
            OR id IN (
                SELECT location_id FROM location_members
                WHERE user_id = user_uuid
                AND role >= min_role
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's role for a resource
CREATE OR REPLACE FUNCTION get_user_role(
    res_type resource_type,
    res_id UUID,
    user_uuid UUID
)
RETURNS share_role AS $$
DECLARE
    user_role share_role;
BEGIN
    IF res_type = 'list' THEN
        SELECT CASE
            WHEN owner_id = user_uuid THEN 'admin'::share_role
            ELSE COALESCE(s.role, 'viewer'::share_role)
        END INTO user_role
        FROM lists l
        LEFT JOIN shares s ON s.resource_id = l.id AND s.shared_with = user_uuid
        WHERE l.id = res_id;
    ELSIF res_type = 'location' THEN
        SELECT CASE
            WHEN owner_id = user_uuid THEN 'admin'::share_role
            ELSE COALESCE(s.role, lm.role, 'viewer'::share_role)
        END INTO user_role
        FROM locations loc
        LEFT JOIN shares s ON s.resource_id = loc.id AND s.shared_with = user_uuid
        LEFT JOIN location_members lm ON lm.location_id = loc.id AND lm.user_id = user_uuid
        WHERE loc.id = res_id;
    END IF;

    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTIONS FOR STATISTICS
-- =====================================================

-- Get list statistics
CREATE OR REPLACE FUNCTION get_list_stats(list_uuid UUID)
RETURNS TABLE (
    total_items BIGINT,
    purchased_items BIGINT,
    total_value DECIMAL,
    purchased_value DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT,
        COUNT(*) FILTER (WHERE is_purchased = TRUE)::BIGINT,
        COALESCE(SUM(price), 0),
        COALESCE(SUM(price) FILTER (WHERE is_purchased = TRUE), 0)
    FROM items
    WHERE list_id = list_uuid;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MATERIALIZED VIEW FOR ANALYTICS (optional)
-- =====================================================
CREATE MATERIALIZED VIEW list_analytics AS
SELECT
    l.id AS list_id,
    l.title,
    l.owner_id,
    l.location_id,
    l.year,
    COUNT(i.id) AS total_items,
    COUNT(i.id) FILTER (WHERE i.is_purchased = TRUE) AS purchased_items,
    COALESCE(SUM(i.price), 0) AS total_value,
    COALESCE(SUM(i.price) FILTER (WHERE i.is_purchased = TRUE), 0) AS purchased_value,
    COALESCE(AVG(i.price), 0) AS avg_item_price
FROM lists l
LEFT JOIN items i ON i.list_id = l.id
GROUP BY l.id, l.title, l.owner_id, l.location_id, l.year;

-- Index for fast queries
CREATE UNIQUE INDEX idx_list_analytics_list_id ON list_analytics(list_id);
CREATE INDEX idx_list_analytics_owner ON list_analytics(owner_id);
CREATE INDEX idx_list_analytics_location ON list_analytics(location_id);

-- Refresh function (call periodically or via trigger)
CREATE OR REPLACE FUNCTION refresh_list_analytics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY list_analytics;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CLEANUP FUNCTIONS
-- =====================================================

-- Delete expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Delete expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM password_reset_tokens WHERE expires_at < NOW();
    DELETE FROM email_verification_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-sessions', '0 2 * * *', 'SELECT cleanup_expired_sessions()');
-- SELECT cron.schedule('cleanup-tokens', '0 3 * * *', 'SELECT cleanup_expired_tokens()');

-- =====================================================
-- SAMPLE DATA (for development)
-- =====================================================
/*
-- Sample user
INSERT INTO users (id, email, display_name, password_hash, email_verified) VALUES
    ('00000000-0000-0000-0000-000000000001', 'john@example.com', 'John Doe', '$2b$10$...', TRUE);

-- Sample location
INSERT INTO locations (id, name, description, owner_id) VALUES
    ('10000000-0000-0000-0000-000000000001', 'Mom''s House', 'Christmas at Mom''s', '00000000-0000-0000-0000-000000000001');

-- Sample list
INSERT INTO lists (id, title, location_id, owner_id, year) VALUES
    ('20000000-0000-0000-0000-000000000001', 'John''s Wishlist 2024', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 2024);

-- Sample items
INSERT INTO items (title, description, price, url, list_id, created_by, priority) VALUES
    ('Wireless Headphones', 'Noise-cancelling over-ear headphones', 299.99, 'https://amazon.com/headphones', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'high'),
    ('Coffee Maker', 'Programmable drip coffee maker', 79.99, 'https://amazon.com/coffee', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'medium');
*/
