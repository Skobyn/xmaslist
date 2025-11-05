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
