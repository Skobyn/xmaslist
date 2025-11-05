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
