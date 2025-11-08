-- =====================================================
-- FIX USER ISOLATION - Make lists completely private
-- Each user gets their own isolated lists
-- Sharing is read-only via guest access tokens only
-- =====================================================

-- =====================================================
-- LOCATIONS: Remove shared access, owner-only
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read shared locations" ON public.locations;
DROP POLICY IF EXISTS "Users can read own locations" ON public.locations;
DROP POLICY IF EXISTS "Users can insert own locations" ON public.locations;
DROP POLICY IF EXISTS "Users can update own locations" ON public.locations;
DROP POLICY IF EXISTS "Users can delete own locations" ON public.locations;

-- Create strict owner-only policies
CREATE POLICY "Users can read own locations only"
    ON public.locations FOR SELECT
    USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own locations only"
    ON public.locations FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own locations only"
    ON public.locations FOR UPDATE
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete own locations only"
    ON public.locations FOR DELETE
    USING (owner_id = auth.uid());

-- =====================================================
-- LISTS: Remove all shared access except public/guest
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own lists" ON public.lists;
DROP POLICY IF EXISTS "Users can read shared lists" ON public.lists;
DROP POLICY IF EXISTS "Users can read public lists" ON public.lists;
DROP POLICY IF EXISTS "Users can read lists in accessible locations" ON public.lists;
DROP POLICY IF EXISTS "Users can insert lists in their locations" ON public.lists;
DROP POLICY IF EXISTS "Users can update own lists" ON public.lists;
DROP POLICY IF EXISTS "Users with editor role can update shared lists" ON public.lists;
DROP POLICY IF EXISTS "Users can delete own lists" ON public.lists;

-- Create strict owner-only policies
CREATE POLICY "Users can read own lists only"
    ON public.lists FOR SELECT
    USING (owner_id = auth.uid());

-- Guest access for public lists (read-only via guest_access_token)
-- This allows unauthenticated users to view via share link
CREATE POLICY "Public lists are viewable by anyone"
    ON public.lists FOR SELECT
    USING (is_public = TRUE);

-- Only owner can create lists in their own locations
CREATE POLICY "Users can insert lists in own locations only"
    ON public.lists FOR INSERT
    WITH CHECK (
        owner_id = auth.uid()
        AND location_id IN (
            SELECT id FROM public.locations
            WHERE owner_id = auth.uid()
        )
    );

-- Only owner can update their lists
CREATE POLICY "Users can update own lists only"
    ON public.lists FOR UPDATE
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- Only owner can delete their lists
CREATE POLICY "Users can delete own lists only"
    ON public.lists FOR DELETE
    USING (owner_id = auth.uid());

-- =====================================================
-- ITEMS: Owner-only access, read-only for public lists
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own items" ON public.items;
DROP POLICY IF EXISTS "Users can read items in accessible lists" ON public.items;
DROP POLICY IF EXISTS "Users can read items in public lists" ON public.items;
DROP POLICY IF EXISTS "Users can insert items in own lists" ON public.items;
DROP POLICY IF EXISTS "Users can update own items" ON public.items;
DROP POLICY IF EXISTS "Users with editor role can update items" ON public.items;
DROP POLICY IF EXISTS "Users can delete own items" ON public.items;

-- Create strict owner-only policies
CREATE POLICY "Users can read items in own lists"
    ON public.items FOR SELECT
    USING (
        list_id IN (
            SELECT id FROM public.lists
            WHERE owner_id = auth.uid()
        )
    );

-- Guest access for items in public lists (read-only)
CREATE POLICY "Anyone can read items in public lists"
    ON public.items FOR SELECT
    USING (
        list_id IN (
            SELECT id FROM public.lists
            WHERE is_public = TRUE
        )
    );

-- Only owner can create items in their lists
CREATE POLICY "Users can insert items in own lists only"
    ON public.items FOR INSERT
    WITH CHECK (
        list_id IN (
            SELECT id FROM public.lists
            WHERE owner_id = auth.uid()
        )
    );

-- Only owner can update their items
CREATE POLICY "Users can update own items only"
    ON public.items FOR UPDATE
    USING (
        list_id IN (
            SELECT id FROM public.lists
            WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        list_id IN (
            SELECT id FROM public.lists
            WHERE owner_id = auth.uid()
        )
    );

-- Only owner can delete their items
CREATE POLICY "Users can delete own items only"
    ON public.items FOR DELETE
    USING (
        list_id IN (
            SELECT id FROM public.lists
            WHERE owner_id = auth.uid()
        )
    );

-- =====================================================
-- LOCATION_MEMBERS: Make informational only
-- Members can't access the owner's lists
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read members of accessible locations" ON public.location_members;
DROP POLICY IF EXISTS "Location owners can manage members" ON public.location_members;

-- Only location owner can see and manage members
CREATE POLICY "Location owners can read members"
    ON public.location_members FOR SELECT
    USING (
        location_id IN (
            SELECT id FROM public.locations
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Location owners can manage members"
    ON public.location_members FOR ALL
    USING (
        location_id IN (
            SELECT id FROM public.locations
            WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        location_id IN (
            SELECT id FROM public.locations
            WHERE owner_id = auth.uid()
        )
    );

-- =====================================================
-- SHARES: Remove or restrict to informational only
-- Lists are shared via guest_access_token, not shares table
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read shares they created" ON public.shares;
DROP POLICY IF EXISTS "Users can read shares for them" ON public.shares;
DROP POLICY IF EXISTS "Users can create shares for own resources" ON public.shares;
DROP POLICY IF EXISTS "Users can delete shares they created" ON public.shares;

-- Only resource owner can create and manage shares (for tracking purposes)
CREATE POLICY "Resource owners can read shares"
    ON public.shares FOR SELECT
    USING (shared_by = auth.uid());

CREATE POLICY "Resource owners can create shares"
    ON public.shares FOR INSERT
    WITH CHECK (shared_by = auth.uid());

CREATE POLICY "Resource owners can delete shares"
    ON public.shares FOR DELETE
    USING (shared_by = auth.uid());

-- Note: Shares table is now informational only
-- Actual sharing happens via guest_access_token on lists table

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Users can read own locations only" ON public.locations IS
    'Users can only see their own locations. No cross-user access.';

COMMENT ON POLICY "Users can read own lists only" ON public.lists IS
    'Users can only see their own lists. Sharing is via guest_access_token only.';

COMMENT ON POLICY "Public lists are viewable by anyone" ON public.lists IS
    'Public lists with guest_access_token can be viewed by anyone (read-only).';

COMMENT ON POLICY "Anyone can read items in public lists" ON public.items IS
    'Items in public lists can be viewed by anyone via share link (read-only).';

COMMENT ON TABLE public.shares IS
    'Informational tracking of who lists were shared with. Actual sharing uses guest_access_token.';
