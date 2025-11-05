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
