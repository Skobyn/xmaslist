-- =====================================================
-- INITIAL SCHEMA MIGRATION
-- Christmas Wishlist Application - Core Tables
-- =====================================================

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

COMMENT ON TABLE public.users IS 'User profiles extending Supabase auth.users';
COMMENT ON COLUMN public.users.id IS 'Foreign key to auth.users(id)';
COMMENT ON COLUMN public.users.display_name IS 'User-friendly display name';
COMMENT ON COLUMN public.users.avatar_url IS 'URL to user avatar image';
