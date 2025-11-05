-- =====================================================
-- INITIAL SCHEMA MIGRATION
-- Christmas Wishlist Application - Core Tables
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom types
CREATE TYPE share_role AS ENUM ('viewer', 'editor', 'admin');
CREATE TYPE resource_type AS ENUM ('location', 'list');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');

-- =====================================================
-- USERS TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_users_email ON public.users(email);

-- RLS Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

COMMENT ON TABLE public.users IS 'User profiles extending Supabase auth.users';
COMMENT ON COLUMN public.users.id IS 'Foreign key to auth.users(id)';
COMMENT ON COLUMN public.users.display_name IS 'User-friendly display name';
COMMENT ON COLUMN public.users.avatar_url IS 'URL to user avatar image';
-- =====================================================
-- LOCATIONS MIGRATION
-- Christmas Wishlist Application - Locations & Members
-- =====================================================

-- =====================================================
-- LOCATIONS TABLE
-- =====================================================
CREATE TABLE public.locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT locations_name_not_empty CHECK (length(trim(name)) > 0)
);

-- Indexes
CREATE INDEX idx_locations_owner ON public.locations(owner_id);
CREATE INDEX idx_locations_created_at ON public.locations(created_at DESC);
CREATE INDEX idx_locations_name ON public.locations(name);

-- RLS Policies
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own locations"
    ON public.locations FOR SELECT
    USING (owner_id = auth.uid());

CREATE POLICY "Users can read shared locations"
    ON public.locations FOR SELECT
    USING (
        id IN (
            SELECT resource_id FROM public.shares
            WHERE shared_with = auth.uid()
            AND resource_type = 'location'
        )
    );

CREATE POLICY "Users can insert own locations"
    ON public.locations FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own locations"
    ON public.locations FOR UPDATE
    USING (owner_id = auth.uid());

CREATE POLICY "Users can delete own locations"
    ON public.locations FOR DELETE
    USING (owner_id = auth.uid());

COMMENT ON TABLE public.locations IS 'Physical or virtual locations (stores/places) where Christmas lists are organized';
COMMENT ON COLUMN public.locations.name IS 'Display name for the location';
COMMENT ON COLUMN public.locations.owner_id IS 'User who created and owns this location';

-- =====================================================
-- LOCATION_MEMBERS TABLE (many-to-many)
-- =====================================================
CREATE TABLE public.location_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role share_role NOT NULL DEFAULT 'viewer',
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID REFERENCES public.users(id) ON DELETE SET NULL,

    UNIQUE(location_id, user_id)
);

-- Indexes
CREATE INDEX idx_location_members_location ON public.location_members(location_id);
CREATE INDEX idx_location_members_user ON public.location_members(user_id);
CREATE INDEX idx_location_members_role ON public.location_members(role);

-- RLS Policies
ALTER TABLE public.location_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read members of accessible locations"
    ON public.location_members FOR SELECT
    USING (
        location_id IN (
            SELECT id FROM public.locations
            WHERE owner_id = auth.uid()
        )
        OR user_id = auth.uid()
    );

CREATE POLICY "Location owners can manage members"
    ON public.location_members FOR ALL
    USING (
        location_id IN (
            SELECT id FROM public.locations
            WHERE owner_id = auth.uid()
        )
    );

COMMENT ON TABLE public.location_members IS 'Members with access to specific locations';
COMMENT ON COLUMN public.location_members.role IS 'Access level: viewer, editor, or admin';
COMMENT ON COLUMN public.location_members.added_by IS 'User who added this member to the location';
-- =====================================================
-- LISTS MIGRATION
-- Christmas Wishlist Application - Lists Table
-- =====================================================

-- =====================================================
-- LISTS TABLE
-- =====================================================
CREATE TABLE public.lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT FALSE,
    guest_access_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT lists_title_not_empty CHECK (length(trim(title)) > 0),
    CONSTRAINT lists_valid_year CHECK (year BETWEEN 2000 AND 2100)
);

-- Indexes
CREATE INDEX idx_lists_location ON public.lists(location_id);
CREATE INDEX idx_lists_owner ON public.lists(owner_id);
CREATE INDEX idx_lists_year ON public.lists(year);
CREATE INDEX idx_lists_active ON public.lists(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_lists_public ON public.lists(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_lists_guest_token ON public.lists(guest_access_token) WHERE guest_access_token IS NOT NULL;
CREATE INDEX idx_lists_created_at ON public.lists(created_at DESC);

-- RLS Policies
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own lists"
    ON public.lists FOR SELECT
    USING (owner_id = auth.uid());

CREATE POLICY "Users can read shared lists"
    ON public.lists FOR SELECT
    USING (
        id IN (
            SELECT resource_id FROM public.shares
            WHERE shared_with = auth.uid()
            AND resource_type = 'list'
        )
    );

CREATE POLICY "Users can read public lists"
    ON public.lists FOR SELECT
    USING (is_public = TRUE);

CREATE POLICY "Users can read lists in accessible locations"
    ON public.lists FOR SELECT
    USING (
        location_id IN (
            SELECT location_id FROM public.location_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert lists in their locations"
    ON public.lists FOR INSERT
    WITH CHECK (
        owner_id = auth.uid()
        AND location_id IN (
            SELECT id FROM public.locations
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own lists"
    ON public.lists FOR UPDATE
    USING (owner_id = auth.uid());

CREATE POLICY "Users with editor role can update shared lists"
    ON public.lists FOR UPDATE
    USING (
        id IN (
            SELECT resource_id FROM public.shares
            WHERE shared_with = auth.uid()
            AND resource_type = 'list'
            AND role IN ('editor', 'admin')
        )
    );

CREATE POLICY "Users can delete own lists"
    ON public.lists FOR DELETE
    USING (owner_id = auth.uid());

COMMENT ON TABLE public.lists IS 'Christmas wishlists organized within locations';
COMMENT ON COLUMN public.lists.title IS 'Display name for the list';
COMMENT ON COLUMN public.lists.year IS 'Year this list is for (defaults to current year)';
COMMENT ON COLUMN public.lists.is_active IS 'Whether this list is currently active';
COMMENT ON COLUMN public.lists.is_public IS 'Whether this list can be viewed by anyone';
COMMENT ON COLUMN public.lists.guest_access_token IS 'Token for guest access without authentication';
-- =====================================================
-- ITEMS MIGRATION
-- Christmas Wishlist Application - Items Table
-- =====================================================

-- =====================================================
-- ITEMS TABLE
-- =====================================================
CREATE TABLE public.items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    currency TEXT DEFAULT 'USD',
    url TEXT,
    image_url TEXT,
    is_purchased BOOLEAN DEFAULT FALSE,
    purchased_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    purchased_at TIMESTAMP WITH TIME ZONE,
    priority priority_level DEFAULT 'medium',
    quantity INTEGER DEFAULT 1,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT items_title_not_empty CHECK (length(trim(title)) > 0),
    CONSTRAINT items_valid_price CHECK (price IS NULL OR price >= 0),
    CONSTRAINT items_valid_quantity CHECK (quantity > 0),
    CONSTRAINT items_valid_currency CHECK (length(currency) = 3),
    CONSTRAINT items_valid_url CHECK (url IS NULL OR url ~* '^https?://'),
    CONSTRAINT items_purchased_consistency CHECK (
        (is_purchased = FALSE AND purchased_by IS NULL AND purchased_at IS NULL)
        OR (is_purchased = TRUE AND purchased_by IS NOT NULL AND purchased_at IS NOT NULL)
    )
);

-- Indexes
CREATE INDEX idx_items_list ON public.items(list_id);
CREATE INDEX idx_items_created_by ON public.items(created_by);
CREATE INDEX idx_items_purchased ON public.items(is_purchased);
CREATE INDEX idx_items_purchased_by ON public.items(purchased_by);
CREATE INDEX idx_items_priority ON public.items(priority);
CREATE INDEX idx_items_created_at ON public.items(created_at DESC);
CREATE INDEX idx_items_price ON public.items(price) WHERE price IS NOT NULL;

-- Full-text search index for title and description
CREATE INDEX idx_items_search ON public.items USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- RLS Policies
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read items from accessible lists"
    ON public.items FOR SELECT
    USING (
        list_id IN (
            SELECT id FROM public.lists
            WHERE owner_id = auth.uid()
            OR is_public = TRUE
            OR id IN (
                SELECT resource_id FROM public.shares
                WHERE shared_with = auth.uid()
                AND resource_type = 'list'
            )
            OR location_id IN (
                SELECT location_id FROM public.location_members
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert items into accessible lists"
    ON public.items FOR INSERT
    WITH CHECK (
        list_id IN (
            SELECT id FROM public.lists
            WHERE owner_id = auth.uid()
            OR id IN (
                SELECT resource_id FROM public.shares
                WHERE shared_with = auth.uid()
                AND resource_type = 'list'
                AND role IN ('editor', 'admin')
            )
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "Users can update items in accessible lists"
    ON public.items FOR UPDATE
    USING (
        list_id IN (
            SELECT id FROM public.lists
            WHERE owner_id = auth.uid()
            OR id IN (
                SELECT resource_id FROM public.shares
                WHERE shared_with = auth.uid()
                AND resource_type = 'list'
                AND role IN ('editor', 'admin')
            )
        )
    );

CREATE POLICY "Users can delete own items"
    ON public.items FOR DELETE
    USING (created_by = auth.uid());

CREATE POLICY "List owners can delete items"
    ON public.items FOR DELETE
    USING (
        list_id IN (
            SELECT id FROM public.lists
            WHERE owner_id = auth.uid()
        )
    );

COMMENT ON TABLE public.items IS 'Individual wishlist items within lists';
COMMENT ON COLUMN public.items.title IS 'Display name for the item';
COMMENT ON COLUMN public.items.price IS 'Item price in specified currency';
COMMENT ON COLUMN public.items.currency IS 'ISO 4217 currency code (e.g., USD, EUR)';
COMMENT ON COLUMN public.items.url IS 'Product URL for purchasing';
COMMENT ON COLUMN public.items.image_url IS 'URL to product image';
COMMENT ON COLUMN public.items.is_purchased IS 'Whether this item has been purchased';
COMMENT ON COLUMN public.items.purchased_by IS 'User who purchased this item';
COMMENT ON COLUMN public.items.purchased_at IS 'Timestamp when item was marked as purchased';
COMMENT ON COLUMN public.items.priority IS 'How important this item is: low, medium, or high';
COMMENT ON COLUMN public.items.quantity IS 'Number of units desired';
COMMENT ON COLUMN public.items.notes IS 'Additional notes or preferences';
-- =====================================================
-- SHARES MIGRATION
-- Christmas Wishlist Application - Shares/Collaboration
-- =====================================================

-- =====================================================
-- SHARES TABLE
-- =====================================================
CREATE TABLE public.shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_type resource_type NOT NULL,
    resource_id UUID NOT NULL,
    shared_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    shared_with UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role share_role NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(resource_type, resource_id, shared_with),
    CONSTRAINT shares_no_self_share CHECK (shared_by != shared_with),
    CONSTRAINT shares_valid_expiry CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Indexes
CREATE INDEX idx_shares_resource ON public.shares(resource_type, resource_id);
CREATE INDEX idx_shares_shared_by ON public.shares(shared_by);
CREATE INDEX idx_shares_shared_with ON public.shares(shared_with);
CREATE INDEX idx_shares_expires_at ON public.shares(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_shares_active ON public.shares(shared_with, resource_type) WHERE expires_at IS NULL OR expires_at > NOW();

-- RLS Policies
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read shares they created"
    ON public.shares FOR SELECT
    USING (shared_by = auth.uid());

CREATE POLICY "Users can read shares for them"
    ON public.shares FOR SELECT
    USING (shared_with = auth.uid());

CREATE POLICY "Users can create shares for resources they own"
    ON public.shares FOR INSERT
    WITH CHECK (
        shared_by = auth.uid()
        AND (
            (resource_type = 'location' AND resource_id IN (
                SELECT id FROM public.locations WHERE owner_id = auth.uid()
            ))
            OR
            (resource_type = 'list' AND resource_id IN (
                SELECT id FROM public.lists WHERE owner_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Users can update shares they created"
    ON public.shares FOR UPDATE
    USING (shared_by = auth.uid());

CREATE POLICY "Users can delete shares they created"
    ON public.shares FOR DELETE
    USING (shared_by = auth.uid());

CREATE POLICY "Users can delete shares for them"
    ON public.shares FOR DELETE
    USING (shared_with = auth.uid());

COMMENT ON TABLE public.shares IS 'Sharing/collaboration permissions for locations and lists';
COMMENT ON COLUMN public.shares.resource_type IS 'Type of resource being shared: location or list';
COMMENT ON COLUMN public.shares.resource_id IS 'UUID of the shared resource';
COMMENT ON COLUMN public.shares.shared_by IS 'User who created the share';
COMMENT ON COLUMN public.shares.shared_with IS 'User receiving access';
COMMENT ON COLUMN public.shares.role IS 'Access level: viewer, editor, or admin';
COMMENT ON COLUMN public.shares.expires_at IS 'Optional expiration timestamp for temporary access';
-- =====================================================
-- TRIGGERS MIGRATION
-- Christmas Wishlist Application - Triggers & Automation
-- =====================================================

-- =====================================================
-- TRIGGER: UPDATE UPDATED_AT TIMESTAMP
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON public.locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lists_updated_at
    BEFORE UPDATE ON public.lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
    BEFORE UPDATE ON public.items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates the updated_at timestamp on row updates';

-- =====================================================
-- TRIGGER: SET PURCHASED_AT TIMESTAMP
-- =====================================================
CREATE OR REPLACE FUNCTION set_purchased_at()
RETURNS TRIGGER AS $$
BEGIN
    -- When marking as purchased, set timestamp and ensure purchased_by is set
    IF NEW.is_purchased = TRUE AND OLD.is_purchased = FALSE THEN
        NEW.purchased_at = NOW();
        IF NEW.purchased_by IS NULL THEN
            NEW.purchased_by = auth.uid();
        END IF;
    -- When unmarking as purchased, clear timestamp and purchased_by
    ELSIF NEW.is_purchased = FALSE AND OLD.is_purchased = TRUE THEN
        NEW.purchased_at = NULL;
        NEW.purchased_by = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_item_purchased_at
    BEFORE UPDATE ON public.items
    FOR EACH ROW EXECUTE FUNCTION set_purchased_at();

COMMENT ON FUNCTION set_purchased_at() IS 'Automatically manages purchased_at and purchased_by fields when is_purchased changes';

-- =====================================================
-- TRIGGER: AUTO-CREATE USER PROFILE
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

COMMENT ON FUNCTION handle_new_user() IS 'Automatically creates a user profile when a new auth user is created';

-- =====================================================
-- TRIGGER: VALIDATE SHARE PERMISSIONS
-- =====================================================
CREATE OR REPLACE FUNCTION validate_share_permissions()
RETURNS TRIGGER AS $$
DECLARE
    resource_owner UUID;
BEGIN
    -- Get the owner of the resource being shared
    IF NEW.resource_type = 'location' THEN
        SELECT owner_id INTO resource_owner
        FROM public.locations
        WHERE id = NEW.resource_id;
    ELSIF NEW.resource_type = 'list' THEN
        SELECT owner_id INTO resource_owner
        FROM public.lists
        WHERE id = NEW.resource_id;
    END IF;

    -- Ensure the person sharing is the owner
    IF resource_owner != NEW.shared_by THEN
        RAISE EXCEPTION 'Only the resource owner can create shares';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_share_before_insert
    BEFORE INSERT ON public.shares
    FOR EACH ROW EXECUTE FUNCTION validate_share_permissions();

COMMENT ON FUNCTION validate_share_permissions() IS 'Ensures only resource owners can create shares';

-- =====================================================
-- TRIGGER: CLEANUP EXPIRED SHARES
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_expired_shares()
RETURNS void AS $$
BEGIN
    DELETE FROM public.shares
    WHERE expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_shares() IS 'Deletes expired shares (should be called periodically via cron)';
-- =====================================================
-- FUNCTIONS MIGRATION
-- Christmas Wishlist Application - Helper Functions
-- =====================================================

-- =====================================================
-- AUTHORIZATION FUNCTIONS
-- =====================================================

-- Check if user has access to a list
CREATE OR REPLACE FUNCTION has_list_access(
    list_uuid UUID,
    user_uuid UUID DEFAULT auth.uid(),
    min_role share_role DEFAULT 'viewer'
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.lists
        WHERE id = list_uuid
        AND (
            -- User owns the list
            owner_id = user_uuid
            -- List is public
            OR is_public = TRUE
            -- User has been explicitly shared the list
            OR id IN (
                SELECT resource_id FROM public.shares
                WHERE resource_type = 'list'
                AND resource_id = list_uuid
                AND shared_with = user_uuid
                AND (expires_at IS NULL OR expires_at > NOW())
                AND role >= min_role
            )
            -- User is a member of the location
            OR location_id IN (
                SELECT location_id FROM public.location_members
                WHERE user_id = user_uuid
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION has_list_access IS 'Check if a user has access to a specific list with minimum role level';

-- Check if user has access to a location
CREATE OR REPLACE FUNCTION has_location_access(
    location_uuid UUID,
    user_uuid UUID DEFAULT auth.uid(),
    min_role share_role DEFAULT 'viewer'
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.locations
        WHERE id = location_uuid
        AND (
            -- User owns the location
            owner_id = user_uuid
            -- User has been explicitly shared the location
            OR id IN (
                SELECT resource_id FROM public.shares
                WHERE resource_type = 'location'
                AND resource_id = location_uuid
                AND shared_with = user_uuid
                AND (expires_at IS NULL OR expires_at > NOW())
                AND role >= min_role
            )
            -- User is a member of the location
            OR id IN (
                SELECT location_id FROM public.location_members
                WHERE user_id = user_uuid
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION has_location_access IS 'Check if a user has access to a specific location with minimum role level';

-- =====================================================
-- STATISTICS FUNCTIONS
-- =====================================================

-- Get list statistics
CREATE OR REPLACE FUNCTION get_list_stats(list_uuid UUID)
RETURNS TABLE (
    total_items BIGINT,
    purchased_items BIGINT,
    total_value DECIMAL,
    purchased_value DECIMAL,
    completion_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) AS total_items,
        COUNT(*) FILTER (WHERE is_purchased = TRUE) AS purchased_items,
        COALESCE(SUM(price * quantity), 0) AS total_value,
        COALESCE(SUM(price * quantity) FILTER (WHERE is_purchased = TRUE), 0) AS purchased_value,
        CASE
            WHEN COUNT(*) = 0 THEN 0
            ELSE ROUND((COUNT(*) FILTER (WHERE is_purchased = TRUE)::DECIMAL / COUNT(*)::DECIMAL) * 100, 2)
        END AS completion_percentage
    FROM public.items
    WHERE list_id = list_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_list_stats IS 'Get comprehensive statistics for a specific list';

-- Get location statistics
CREATE OR REPLACE FUNCTION get_location_stats(location_uuid UUID)
RETURNS TABLE (
    total_lists BIGINT,
    total_items BIGINT,
    purchased_items BIGINT,
    total_members BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT l.id) AS total_lists,
        COUNT(i.id) AS total_items,
        COUNT(i.id) FILTER (WHERE i.is_purchased = TRUE) AS purchased_items,
        (SELECT COUNT(*) FROM public.location_members WHERE location_id = location_uuid) AS total_members
    FROM public.lists l
    LEFT JOIN public.items i ON l.id = i.list_id
    WHERE l.location_id = location_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_location_stats IS 'Get comprehensive statistics for a specific location';

-- =====================================================
-- SEARCH FUNCTIONS
-- =====================================================

-- Search items by text
CREATE OR REPLACE FUNCTION search_items(
    search_query TEXT,
    list_uuid UUID DEFAULT NULL,
    user_uuid UUID DEFAULT auth.uid()
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    price DECIMAL,
    currency TEXT,
    url TEXT,
    image_url TEXT,
    list_id UUID,
    list_title TEXT,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.id,
        i.title,
        i.description,
        i.price,
        i.currency,
        i.url,
        i.image_url,
        i.list_id,
        l.title AS list_title,
        ts_rank(
            to_tsvector('english', i.title || ' ' || COALESCE(i.description, '')),
            plainto_tsquery('english', search_query)
        ) AS rank
    FROM public.items i
    JOIN public.lists l ON i.list_id = l.id
    WHERE
        to_tsvector('english', i.title || ' ' || COALESCE(i.description, '')) @@ plainto_tsquery('english', search_query)
        AND (list_uuid IS NULL OR i.list_id = list_uuid)
        AND has_list_access(i.list_id, user_uuid)
    ORDER BY rank DESC, i.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION search_items IS 'Full-text search for items with access control';

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Share resource with multiple users
CREATE OR REPLACE FUNCTION share_resource_batch(
    p_resource_type resource_type,
    p_resource_id UUID,
    p_user_emails TEXT[],
    p_role share_role DEFAULT 'viewer',
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    email TEXT,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    user_email TEXT;
    user_id UUID;
    owner_id UUID;
BEGIN
    -- Get the resource owner
    IF p_resource_type = 'location' THEN
        SELECT locations.owner_id INTO owner_id
        FROM public.locations
        WHERE id = p_resource_id;
    ELSIF p_resource_type = 'list' THEN
        SELECT lists.owner_id INTO owner_id
        FROM public.lists
        WHERE id = p_resource_id;
    END IF;

    -- Verify caller is the owner
    IF owner_id != auth.uid() THEN
        RETURN QUERY SELECT NULL::TEXT, FALSE, 'Not authorized to share this resource'::TEXT;
        RETURN;
    END IF;

    -- Process each email
    FOREACH user_email IN ARRAY p_user_emails
    LOOP
        -- Find user by email
        SELECT id INTO user_id
        FROM public.users
        WHERE email = user_email;

        IF user_id IS NULL THEN
            RETURN QUERY SELECT user_email, FALSE, 'User not found'::TEXT;
            CONTINUE;
        END IF;

        -- Create share
        BEGIN
            INSERT INTO public.shares (resource_type, resource_id, shared_by, shared_with, role, expires_at)
            VALUES (p_resource_type, p_resource_id, auth.uid(), user_id, p_role, p_expires_at)
            ON CONFLICT (resource_type, resource_id, shared_with)
            DO UPDATE SET role = EXCLUDED.role, expires_at = EXCLUDED.expires_at;

            RETURN QUERY SELECT user_email, TRUE, 'Share created successfully'::TEXT;
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT user_email, FALSE, SQLERRM::TEXT;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION share_resource_batch IS 'Share a resource with multiple users at once';

-- Get accessible lists for user
CREATE OR REPLACE FUNCTION get_user_accessible_lists(
    user_uuid UUID DEFAULT auth.uid()
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    owner_id UUID,
    owner_name TEXT,
    location_id UUID,
    location_name TEXT,
    year INTEGER,
    is_active BOOLEAN,
    is_public BOOLEAN,
    access_level share_role,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id,
        l.title,
        l.description,
        l.owner_id,
        u.display_name AS owner_name,
        l.location_id,
        loc.name AS location_name,
        l.year,
        l.is_active,
        l.is_public,
        CASE
            WHEN l.owner_id = user_uuid THEN 'admin'::share_role
            ELSE COALESCE(s.role, 'viewer'::share_role)
        END AS access_level,
        l.created_at
    FROM public.lists l
    JOIN public.users u ON l.owner_id = u.id
    JOIN public.locations loc ON l.location_id = loc.id
    LEFT JOIN public.shares s ON s.resource_id = l.id
        AND s.resource_type = 'list'
        AND s.shared_with = user_uuid
        AND (s.expires_at IS NULL OR s.expires_at > NOW())
    WHERE
        l.owner_id = user_uuid
        OR l.is_public = TRUE
        OR s.id IS NOT NULL
        OR l.location_id IN (
            SELECT location_id FROM public.location_members
            WHERE user_id = user_uuid
        )
    ORDER BY l.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_accessible_lists IS 'Get all lists accessible to a user with their access level';
-- =====================================================
-- REALTIME MIGRATION
-- Christmas Wishlist Application - Realtime Subscriptions
-- =====================================================

-- Enable realtime for specific tables
-- This allows clients to subscribe to database changes in real-time

-- Items table - for live updates when items are added/updated/purchased
ALTER PUBLICATION supabase_realtime ADD TABLE public.items;

-- Lists table - for live updates when lists are created/modified
ALTER PUBLICATION supabase_realtime ADD TABLE public.lists;

-- Shares table - for live updates when sharing changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.shares;

-- Location members table - for live updates when members are added/removed
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_members;

COMMENT ON PUBLICATION supabase_realtime IS 'Realtime publication for live database updates';

-- =====================================================
-- REALTIME HELPER VIEWS
-- =====================================================

-- View for items with list and location context
CREATE OR REPLACE VIEW public.items_with_context AS
SELECT
    i.id,
    i.list_id,
    i.title,
    i.description,
    i.price,
    i.currency,
    i.url,
    i.image_url,
    i.is_purchased,
    i.purchased_by,
    i.purchased_at,
    i.priority,
    i.quantity,
    i.notes,
    i.created_by,
    i.created_at,
    i.updated_at,
    l.title AS list_title,
    l.location_id,
    loc.name AS location_name,
    l.owner_id AS list_owner_id,
    creator.display_name AS created_by_name,
    purchaser.display_name AS purchased_by_name
FROM public.items i
JOIN public.lists l ON i.list_id = l.id
JOIN public.locations loc ON l.location_id = loc.id
JOIN public.users creator ON i.created_by = creator.id
LEFT JOIN public.users purchaser ON i.purchased_by = purchaser.id;

COMMENT ON VIEW public.items_with_context IS 'Items with full context including list and location information';

-- View for lists with statistics
CREATE OR REPLACE VIEW public.lists_with_stats AS
SELECT
    l.id,
    l.title,
    l.description,
    l.location_id,
    l.owner_id,
    l.year,
    l.is_active,
    l.is_public,
    l.created_at,
    l.updated_at,
    loc.name AS location_name,
    u.display_name AS owner_name,
    COUNT(i.id) AS total_items,
    COUNT(i.id) FILTER (WHERE i.is_purchased = TRUE) AS purchased_items,
    COALESCE(SUM(i.price * i.quantity), 0) AS total_value,
    COALESCE(SUM(i.price * i.quantity) FILTER (WHERE i.is_purchased = TRUE), 0) AS purchased_value
FROM public.lists l
JOIN public.locations loc ON l.location_id = loc.id
JOIN public.users u ON l.owner_id = u.id
LEFT JOIN public.items i ON l.id = i.list_id
GROUP BY l.id, l.title, l.description, l.location_id, l.owner_id, l.year,
         l.is_active, l.is_public, l.created_at, l.updated_at,
         loc.name, u.display_name;

COMMENT ON VIEW public.lists_with_stats IS 'Lists with computed statistics about items';

-- =====================================================
-- REALTIME RLS POLICIES FOR VIEWS
-- =====================================================

-- Items with context view policies
ALTER VIEW public.items_with_context SET (security_invoker = on);

-- Lists with stats view policies
ALTER VIEW public.lists_with_stats SET (security_invoker = on);
