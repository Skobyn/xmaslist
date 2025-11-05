-- Supabase PostgreSQL Schema for Christmas Wishlist Application
-- This schema leverages Supabase's built-in auth.users table and RLS

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

-- =====================================================
-- LOCATIONS TABLE
-- =====================================================
CREATE TABLE public.locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_locations_owner ON public.locations(owner_id);
CREATE INDEX idx_locations_created_at ON public.locations(created_at DESC);

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

-- =====================================================
-- LOCATION_MEMBERS TABLE (many-to-many)
-- =====================================================
CREATE TABLE public.location_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role share_role NOT NULL DEFAULT 'viewer',
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(location_id, user_id)
);

-- Indexes
CREATE INDEX idx_location_members_location ON public.location_members(location_id);
CREATE INDEX idx_location_members_user ON public.location_members(user_id);

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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_lists_location ON public.lists(location_id);
CREATE INDEX idx_lists_owner ON public.lists(owner_id);
CREATE INDEX idx_lists_year ON public.lists(year);
CREATE INDEX idx_lists_active ON public.lists(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_lists_guest_token ON public.lists(guest_access_token) WHERE guest_access_token IS NOT NULL;

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
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_items_list ON public.items(list_id);
CREATE INDEX idx_items_created_by ON public.items(created_by);
CREATE INDEX idx_items_purchased ON public.items(is_purchased);
CREATE INDEX idx_items_priority ON public.items(priority);
CREATE INDEX idx_items_created_at ON public.items(created_at DESC);

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
    CHECK (shared_by != shared_with)
);

-- Indexes
CREATE INDEX idx_shares_resource ON public.shares(resource_type, resource_id);
CREATE INDEX idx_shares_shared_with ON public.shares(shared_with);
CREATE INDEX idx_shares_expires_at ON public.shares(expires_at) WHERE expires_at IS NOT NULL;

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

CREATE POLICY "Users can delete shares they created"
    ON public.shares FOR DELETE
    USING (shared_by = auth.uid());

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
    BEFORE UPDATE ON public.items
    FOR EACH ROW EXECUTE FUNCTION set_purchased_at();

-- =====================================================
-- FUNCTIONS FOR AUTHORIZATION CHECKS
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
        SELECT 1 FROM public.lists
        WHERE id = list_uuid
        AND (
            owner_id = user_uuid
            OR is_public = TRUE
            OR id IN (
                SELECT resource_id FROM public.shares
                WHERE resource_type = 'list'
                AND resource_id = list_uuid
                AND shared_with = user_uuid
                AND role >= min_role
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
        SELECT 1 FROM public.locations
        WHERE id = location_uuid
        AND (
            owner_id = user_uuid
            OR id IN (
                SELECT resource_id FROM public.shares
                WHERE resource_type = 'location'
                AND resource_id = location_uuid
                AND shared_with = user_uuid
                AND role >= min_role
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- REALTIME PUBLICATION
-- =====================================================
-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shares;

-- =====================================================
-- SAMPLE DATA (for development)
-- =====================================================
-- Note: Insert sample data after authentication is set up
-- This is just a template

/*
-- Sample user (created via Supabase Auth)
INSERT INTO public.users (id, email, display_name) VALUES
    ('00000000-0000-0000-0000-000000000001', 'john@example.com', 'John Doe');

-- Sample location
INSERT INTO public.locations (id, name, description, owner_id) VALUES
    ('10000000-0000-0000-0000-000000000001', 'Mom''s House', 'Christmas at Mom''s', '00000000-0000-0000-0000-000000000001');

-- Sample list
INSERT INTO public.lists (id, title, location_id, owner_id, year) VALUES
    ('20000000-0000-0000-0000-000000000001', 'John''s Wishlist 2024', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 2024);

-- Sample items
INSERT INTO public.items (title, description, price, url, list_id, created_by, priority) VALUES
    ('Wireless Headphones', 'Noise-cancelling over-ear headphones', 299.99, 'https://example.com/headphones', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'high'),
    ('Coffee Maker', 'Programmable drip coffee maker', 79.99, 'https://example.com/coffee', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'medium');
*/

-- =====================================================
-- STORAGE BUCKETS (configure in Supabase dashboard)
-- =====================================================
-- Create buckets via Supabase CLI or Dashboard:
-- - avatars (public)
-- - item-images (public)

-- Storage RLS policies (apply via Supabase dashboard):
/*
-- Allow users to upload their own avatars
CREATE POLICY "Users can upload own avatars"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow users to upload item images for their lists
CREATE POLICY "Users can upload item images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'item-images'
        AND auth.uid() IN (
            SELECT owner_id FROM public.lists
        )
    );
*/
