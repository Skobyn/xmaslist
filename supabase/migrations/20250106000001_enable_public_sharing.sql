-- =====================================================
-- ENABLE PUBLIC SHARING
-- Allow viewing of public lists/locations/items
-- =====================================================

-- =====================================================
-- LOCATIONS: Allow viewing if user has public lists there
-- =====================================================

CREATE POLICY "Anyone can view locations with public lists"
    ON public.locations
    AS PERMISSIVE
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.lists
            WHERE lists.location_id = locations.id
            AND lists.is_public = TRUE
        )
    );

-- =====================================================
-- LISTS: Allow viewing public lists
-- =====================================================

CREATE POLICY "Anyone can view public lists"
    ON public.lists
    AS PERMISSIVE
    FOR SELECT
    USING (is_public = TRUE);

-- =====================================================
-- ITEMS: Allow viewing items in public lists
-- =====================================================

CREATE POLICY "Anyone can view items in public lists"
    ON public.items
    AS PERMISSIVE
    FOR SELECT
    USING (
        list_id IN (
            SELECT id FROM public.lists
            WHERE is_public = TRUE
        )
    );

-- =====================================================
-- Verify new policies
-- =====================================================

SELECT
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('locations', 'lists', 'items')
  AND policyname LIKE '%public%'
ORDER BY tablename, policyname;

-- Expected: 3 new public viewing policies
