-- =====================================================
-- ITEMS MIGRATION
-- Christmas Wishlist Application - Items Table
-- =====================================================

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

-- Indexes
CREATE INDEX idx_items_list ON public.items(list_id);
CREATE INDEX idx_items_created_by ON public.items(created_by);
CREATE INDEX idx_items_purchased ON public.items(is_purchased);
CREATE INDEX idx_items_purchased_by ON public.items(purchased_by);
CREATE INDEX idx_items_priority ON public.items(priority);
CREATE INDEX idx_items_created_at ON public.items(created_at DESC);
CREATE INDEX idx_items_price ON public.items(price) WHERE price IS NOT NULL;

-- Full-text search index for title and description
CREATE INDEX idx_items_search ON public.items USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

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
            OR location_id IN (
                SELECT location_id FROM public.location_members
                WHERE user_id = auth.uid()
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

CREATE POLICY "List owners can delete items"
    ON public.items FOR DELETE
    USING (
        list_id IN (
            SELECT id FROM public.lists
            WHERE owner_id = auth.uid()
        )
    );

COMMENT ON TABLE public.items IS 'Individual wishlist items within lists';
COMMENT ON COLUMN public.items.title IS 'Display name for the item';
COMMENT ON COLUMN public.items.price IS 'Item price in specified currency';
COMMENT ON COLUMN public.items.currency IS 'ISO 4217 currency code (e.g., USD, EUR)';
COMMENT ON COLUMN public.items.url IS 'Product URL for purchasing';
COMMENT ON COLUMN public.items.image_url IS 'URL to product image';
COMMENT ON COLUMN public.items.is_purchased IS 'Whether this item has been purchased';
COMMENT ON COLUMN public.items.purchased_by IS 'User who purchased this item';
COMMENT ON COLUMN public.items.purchased_at IS 'Timestamp when item was marked as purchased';
COMMENT ON COLUMN public.items.priority IS 'How important this item is: low, medium, or high';
COMMENT ON COLUMN public.items.quantity IS 'Number of units desired';
COMMENT ON COLUMN public.items.notes IS 'Additional notes or preferences';
