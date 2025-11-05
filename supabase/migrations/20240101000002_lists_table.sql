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
