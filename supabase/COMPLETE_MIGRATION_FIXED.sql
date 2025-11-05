-- =====================================================
-- COMPLETE DATABASE MIGRATION - FIXED ORDER
-- xmasList - Christmas Wishlist Application
-- Run this entire file in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- STEP 1: EXTENSIONS & TYPES
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom types
CREATE TYPE share_role AS ENUM ('viewer', 'editor', 'admin');
CREATE TYPE resource_type AS ENUM ('location', 'list');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');

-- =====================================================
-- STEP 2: USERS TABLE
-- =====================================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON public.users(email);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

COMMENT ON TABLE public.users IS 'User profiles extending Supabase auth.users';

-- =====================================================
-- STEP 3: LOCATIONS TABLE (WITHOUT RLS THAT REFERENCES SHARES)
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

CREATE INDEX idx_locations_owner ON public.locations(owner_id);
CREATE INDEX idx_locations_created_at ON public.locations(created_at DESC);
CREATE INDEX idx_locations_name ON public.locations(name);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Basic policies (shares reference added later)
CREATE POLICY "Users can read own locations"
    ON public.locations FOR SELECT
    USING (owner_id = auth.uid());

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

-- =====================================================
-- STEP 4: LOCATION_MEMBERS TABLE
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

CREATE INDEX idx_location_members_location ON public.location_members(location_id);
CREATE INDEX idx_location_members_user ON public.location_members(user_id);
CREATE INDEX idx_location_members_role ON public.location_members(role);

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

-- =====================================================
-- STEP 5: LISTS TABLE (WITHOUT RLS THAT REFERENCES SHARES)
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

CREATE INDEX idx_lists_location ON public.lists(location_id);
CREATE INDEX idx_lists_owner ON public.lists(owner_id);
CREATE INDEX idx_lists_year ON public.lists(year);
CREATE INDEX idx_lists_active ON public.lists(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_lists_public ON public.lists(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_lists_guest_token ON public.lists(guest_access_token) WHERE guest_access_token IS NOT NULL;
CREATE INDEX idx_lists_created_at ON public.lists(created_at DESC);

ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;

-- Basic policies (shares reference added later)
CREATE POLICY "Users can read own lists"
    ON public.lists FOR SELECT
    USING (owner_id = auth.uid());

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

CREATE POLICY "Users can delete own lists"
    ON public.lists FOR DELETE
    USING (owner_id = auth.uid());

COMMENT ON TABLE public.lists IS 'Christmas wishlists organized within locations';

-- =====================================================
-- STEP 6: ITEMS TABLE
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

CREATE INDEX idx_items_list ON public.items(list_id);
CREATE INDEX idx_items_created_by ON public.items(created_by);
CREATE INDEX idx_items_purchased ON public.items(is_purchased);
CREATE INDEX idx_items_purchased_by ON public.items(purchased_by);
CREATE INDEX idx_items_priority ON public.items(priority);
CREATE INDEX idx_items_created_at ON public.items(created_at DESC);
CREATE INDEX idx_items_price ON public.items(price) WHERE price IS NOT NULL;
CREATE INDEX idx_items_search ON public.items USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read items from accessible lists"
    ON public.items FOR SELECT
    USING (
        list_id IN (
            SELECT id FROM public.lists
            WHERE owner_id = auth.uid()
            OR is_public = TRUE
            OR location_id IN (
                SELECT location_id FROM public.location_members
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert items into accessible lists"
    ON public.items FOR INSERT
    WITH CHECK (
        created_by = auth.uid()
    );

CREATE POLICY "Users can update items in accessible lists"
    ON public.items FOR UPDATE
    USING (
        list_id IN (
            SELECT id FROM public.lists
            WHERE owner_id = auth.uid()
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

-- =====================================================
-- STEP 7: SHARES TABLE
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

CREATE INDEX idx_shares_resource ON public.shares(resource_type, resource_id);
CREATE INDEX idx_shares_shared_by ON public.shares(shared_by);
CREATE INDEX idx_shares_shared_with ON public.shares(shared_with);
CREATE INDEX idx_shares_expires_at ON public.shares(expires_at) WHERE expires_at IS NOT NULL;
-- Note: Can't use NOW() in index predicate (must be IMMUTABLE), so we index all active shares
CREATE INDEX idx_shares_active ON public.shares(shared_with, resource_type, expires_at);

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

-- =====================================================
-- STEP 8: ADD SHARES-DEPENDENT RLS POLICIES
-- =====================================================

-- Add shares-dependent policy to locations
CREATE POLICY "Users can read shared locations"
    ON public.locations FOR SELECT
    USING (
        id IN (
            SELECT resource_id FROM public.shares
            WHERE shared_with = auth.uid()
            AND resource_type = 'location'
        )
    );

-- Add shares-dependent policies to lists
CREATE POLICY "Users can read shared lists"
    ON public.lists FOR SELECT
    USING (
        id IN (
            SELECT resource_id FROM public.shares
            WHERE shared_with = auth.uid()
            AND resource_type = 'list'
        )
    );

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

-- Add shares-dependent policies to items
CREATE POLICY "Users can read items from shared lists"
    ON public.items FOR SELECT
    USING (
        list_id IN (
            SELECT resource_id FROM public.shares
            WHERE shared_with = auth.uid()
            AND resource_type = 'list'
        )
    );

CREATE POLICY "Editors can insert items into shared lists"
    ON public.items FOR INSERT
    WITH CHECK (
        list_id IN (
            SELECT resource_id FROM public.shares
            WHERE shared_with = auth.uid()
            AND resource_type = 'list'
            AND role IN ('editor', 'admin')
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "Editors can update items in shared lists"
    ON public.items FOR UPDATE
    USING (
        list_id IN (
            SELECT resource_id FROM public.shares
            WHERE shared_with = auth.uid()
            AND resource_type = 'list'
            AND role IN ('editor', 'admin')
        )
    );

-- =====================================================
-- STEP 9: TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER locations_updated_at BEFORE UPDATE ON public.locations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER lists_updated_at BEFORE UPDATE ON public.lists
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER items_updated_at BEFORE UPDATE ON public.items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Validate purchase tracking
CREATE OR REPLACE FUNCTION public.validate_purchase()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_purchased = TRUE THEN
        NEW.purchased_at = COALESCE(NEW.purchased_at, NOW());
        IF NEW.purchased_by IS NULL THEN
            RAISE EXCEPTION 'purchased_by required when is_purchased is true';
        END IF;
    ELSE
        NEW.purchased_by = NULL;
        NEW.purchased_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_validate_purchase BEFORE INSERT OR UPDATE ON public.items
    FOR EACH ROW EXECUTE FUNCTION public.validate_purchase();

-- Validate share permissions
CREATE OR REPLACE FUNCTION public.validate_share_permission()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.resource_type = 'location' THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.locations
            WHERE id = NEW.resource_id AND owner_id = NEW.shared_by
        ) THEN
            RAISE EXCEPTION 'Can only share locations you own';
        END IF;
    ELSIF NEW.resource_type = 'list' THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.lists
            WHERE id = NEW.resource_id AND owner_id = NEW.shared_by
        ) THEN
            RAISE EXCEPTION 'Can only share lists you own';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shares_validate_permission BEFORE INSERT ON public.shares
    FOR EACH ROW EXECUTE FUNCTION public.validate_share_permission();

-- =====================================================
-- STEP 10: HELPER FUNCTIONS
-- =====================================================

-- Check if user has access to a list
CREATE OR REPLACE FUNCTION public.has_list_access(list_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.lists
        WHERE id = list_uuid
        AND (
            owner_id = user_uuid
            OR is_public = TRUE
            OR id IN (
                SELECT resource_id FROM public.shares
                WHERE shared_with = user_uuid
                AND resource_type = 'list'
                AND (expires_at IS NULL OR expires_at > NOW())
            )
            OR location_id IN (
                SELECT location_id FROM public.location_members
                WHERE user_id = user_uuid
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has access to a location
CREATE OR REPLACE FUNCTION public.has_location_access(location_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.locations
        WHERE id = location_uuid
        AND (
            owner_id = user_uuid
            OR id IN (
                SELECT resource_id FROM public.shares
                WHERE shared_with = user_uuid
                AND resource_type = 'location'
                AND (expires_at IS NULL OR expires_at > NOW())
            )
            OR id IN (
                SELECT location_id FROM public.location_members
                WHERE user_id = user_uuid
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get list statistics
CREATE OR REPLACE FUNCTION public.get_list_stats(list_uuid UUID)
RETURNS TABLE (
    total_items BIGINT,
    purchased_items BIGINT,
    total_value NUMERIC,
    completion_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT,
        COUNT(*) FILTER (WHERE is_purchased = TRUE)::BIGINT,
        COALESCE(SUM(price * quantity), 0),
        CASE WHEN COUNT(*) > 0
            THEN (COUNT(*) FILTER (WHERE is_purchased = TRUE)::NUMERIC / COUNT(*)::NUMERIC * 100)
            ELSE 0
        END
    FROM public.items
    WHERE list_id = list_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get location statistics
CREATE OR REPLACE FUNCTION public.get_location_stats(location_uuid UUID)
RETURNS TABLE (
    total_lists BIGINT,
    total_members BIGINT,
    total_items BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM public.lists WHERE location_id = location_uuid)::BIGINT,
        (SELECT COUNT(*) FROM public.location_members WHERE location_id = location_uuid)::BIGINT,
        (SELECT COUNT(*) FROM public.items i JOIN public.lists l ON i.list_id = l.id WHERE l.location_id = location_uuid)::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Full-text search for items
CREATE OR REPLACE FUNCTION public.search_items(search_query TEXT, user_uuid UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    price DECIMAL,
    url TEXT,
    image_url TEXT,
    list_id UUID,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.id,
        i.title,
        i.description,
        i.price,
        i.url,
        i.image_url,
        i.list_id,
        ts_rank(to_tsvector('english', i.title || ' ' || COALESCE(i.description, '')), plainto_tsquery('english', search_query))
    FROM public.items i
    WHERE to_tsvector('english', i.title || ' ' || COALESCE(i.description, '')) @@ plainto_tsquery('english', search_query)
    AND public.has_list_access(i.list_id, user_uuid)
    ORDER BY ts_rank(to_tsvector('english', i.title || ' ' || COALESCE(i.description, '')), plainto_tsquery('english', search_query)) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Batch share multiple resources
CREATE OR REPLACE FUNCTION public.share_resource_batch(
    resources JSONB,
    target_user_uuid UUID,
    share_role_param share_role
)
RETURNS SETOF public.shares AS $$
DECLARE
    resource JSONB;
BEGIN
    FOR resource IN SELECT * FROM jsonb_array_elements(resources)
    LOOP
        INSERT INTO public.shares (resource_type, resource_id, shared_by, shared_with, role)
        VALUES (
            (resource->>'type')::resource_type,
            (resource->>'id')::UUID,
            auth.uid(),
            target_user_uuid,
            share_role_param
        )
        ON CONFLICT (resource_type, resource_id, shared_with) DO UPDATE
        SET role = share_role_param, created_at = NOW()
        RETURNING * INTO STRICT resource;

        RETURN NEXT (SELECT * FROM public.shares WHERE id = (resource->>'id')::UUID LIMIT 1);
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all accessible lists for a user
CREATE OR REPLACE FUNCTION public.get_user_accessible_lists(user_uuid UUID)
RETURNS SETOF public.lists AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT l.*
    FROM public.lists l
    WHERE l.owner_id = user_uuid
       OR l.is_public = TRUE
       OR l.id IN (
           SELECT resource_id FROM public.shares
           WHERE shared_with = user_uuid
           AND resource_type = 'list'
           AND (expires_at IS NULL OR expires_at > NOW())
       )
       OR l.location_id IN (
           SELECT location_id FROM public.location_members
           WHERE user_id = user_uuid
       );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 11: ENABLE REALTIME
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shares;
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_members;

-- Create helper views for realtime subscriptions
CREATE OR REPLACE VIEW public.items_with_context AS
SELECT
    i.*,
    l.title AS list_title,
    l.location_id,
    u.display_name AS created_by_name
FROM public.items i
JOIN public.lists l ON i.list_id = l.id
LEFT JOIN public.users u ON i.created_by = u.id;

CREATE OR REPLACE VIEW public.lists_with_stats AS
SELECT
    l.*,
    loc.name AS location_name,
    u.display_name AS owner_name,
    (SELECT COUNT(*) FROM public.items WHERE list_id = l.id) AS item_count,
    (SELECT COUNT(*) FROM public.items WHERE list_id = l.id AND is_purchased = TRUE) AS purchased_count
FROM public.lists l
JOIN public.locations loc ON l.location_id = loc.id
LEFT JOIN public.users u ON l.owner_id = u.id;

-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================
-- All tables, RLS policies, triggers, and functions created
-- You can now start using the application
-- =====================================================
