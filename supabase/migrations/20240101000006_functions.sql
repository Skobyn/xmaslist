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
