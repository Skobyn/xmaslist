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
