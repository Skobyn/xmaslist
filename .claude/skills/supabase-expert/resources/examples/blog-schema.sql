-- Blog Platform Database Schema
-- Complete schema with RLS, triggers, and indexes

-- ==============================================
-- 1. ENABLE EXTENSIONS
-- ==============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search

-- ==============================================
-- 2. PROFILES TABLE
-- ==============================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 20),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can create their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Indexes
CREATE INDEX profiles_username_idx ON profiles(username);
CREATE INDEX profiles_created_at_idx ON profiles(created_at DESC);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================
-- 3. POSTS TABLE
-- ==============================================

CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  published_at TIMESTAMP WITH TIME ZONE,

  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  cover_image TEXT,

  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status post_status DEFAULT 'draft' NOT NULL,

  views_count INT DEFAULT 0,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,

  seo_title TEXT,
  seo_description TEXT,

  CONSTRAINT title_length CHECK (char_length(title) >= 3 AND char_length(title) <= 200),
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Published posts are viewable by everyone"
ON posts FOR SELECT
USING (status = 'published');

CREATE POLICY "Users can view their own posts"
ON posts FOR SELECT
USING (auth.uid() = author_id);

CREATE POLICY "Users can create posts"
ON posts FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts"
ON posts FOR UPDATE
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts"
ON posts FOR DELETE
USING (auth.uid() = author_id);

-- Indexes
CREATE INDEX posts_author_id_idx ON posts(author_id);
CREATE INDEX posts_status_idx ON posts(status);
CREATE INDEX posts_published_at_idx ON posts(published_at DESC) WHERE status = 'published';
CREATE INDEX posts_slug_idx ON posts(slug);
CREATE INDEX posts_search_idx ON posts USING gin(to_tsvector('english', title || ' ' || COALESCE(content, '')));

-- Update published_at on status change
CREATE OR REPLACE FUNCTION update_post_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_post_published
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_post_published_at();

-- ==============================================
-- 4. CATEGORIES TABLE
-- ==============================================

CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT,

  posts_count INT DEFAULT 0,

  CONSTRAINT name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 50)
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
ON categories FOR SELECT
USING (true);

-- ==============================================
-- 5. POST_CATEGORIES (Many-to-Many)
-- ==============================================

CREATE TABLE post_categories (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,

  PRIMARY KEY (post_id, category_id)
);

-- Enable RLS
ALTER TABLE post_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post categories are viewable by everyone"
ON post_categories FOR SELECT
USING (true);

CREATE POLICY "Users can add categories to their own posts"
ON post_categories FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_id AND posts.author_id = auth.uid()
  )
);

-- ==============================================
-- 6. TAGS TABLE
-- ==============================================

CREATE TABLE tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,

  posts_count INT DEFAULT 0,

  CONSTRAINT name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 30)
);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags are viewable by everyone"
ON tags FOR SELECT
USING (true);

-- ==============================================
-- 7. POST_TAGS (Many-to-Many)
-- ==============================================

CREATE TABLE post_tags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,

  PRIMARY KEY (post_id, tag_id)
);

-- Enable RLS
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post tags are viewable by everyone"
ON post_tags FOR SELECT
USING (true);

CREATE POLICY "Users can add tags to their own posts"
ON post_tags FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_id AND posts.author_id = auth.uid()
  )
);

-- ==============================================
-- 8. COMMENTS TABLE
-- ==============================================

CREATE TABLE comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  content TEXT NOT NULL,

  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,

  likes_count INT DEFAULT 0,

  CONSTRAINT content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 1000)
);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Comments are viewable by everyone"
ON comments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create comments"
ON comments FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments"
ON comments FOR UPDATE
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments"
ON comments FOR DELETE
USING (auth.uid() = author_id);

-- Indexes
CREATE INDEX comments_post_id_idx ON comments(post_id);
CREATE INDEX comments_author_id_idx ON comments(author_id);
CREATE INDEX comments_parent_id_idx ON comments(parent_id);

-- Update post comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_comment_created
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

CREATE TRIGGER on_comment_deleted
  AFTER DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- ==============================================
-- 9. LIKES TABLE
-- ==============================================

CREATE TABLE likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  CONSTRAINT like_one_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  ),
  CONSTRAINT unique_post_like UNIQUE (post_id, user_id),
  CONSTRAINT unique_comment_like UNIQUE (comment_id, user_id)
);

-- Enable RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Likes are viewable by everyone"
ON likes FOR SELECT
USING (true);

CREATE POLICY "Users can create their own likes"
ON likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
ON likes FOR DELETE
USING (auth.uid() = user_id);

-- ==============================================
-- 10. VIEWS (Database Views)
-- ==============================================

-- Posts with author and stats
CREATE VIEW posts_with_details AS
SELECT
  p.*,
  pr.username as author_username,
  pr.full_name as author_name,
  pr.avatar_url as author_avatar,
  ARRAY_AGG(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as categories,
  ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tags
FROM posts p
LEFT JOIN profiles pr ON p.author_id = pr.id
LEFT JOIN post_categories pc ON p.id = pc.post_id
LEFT JOIN categories c ON pc.category_id = c.id
LEFT JOIN post_tags pt ON p.id = pt.post_id
LEFT JOIN tags t ON pt.tag_id = t.id
GROUP BY p.id, pr.username, pr.full_name, pr.avatar_url;

-- ==============================================
-- 11. FUNCTIONS
-- ==============================================

-- Full-text search
CREATE OR REPLACE FUNCTION search_posts(search_query TEXT)
RETURNS SETOF posts AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM posts
  WHERE
    status = 'published'
    AND (
      to_tsvector('english', title || ' ' || COALESCE(content, ''))
      @@ plainto_tsquery('english', search_query)
    )
  ORDER BY published_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 12. SAMPLE DATA (Optional)
-- ==============================================

-- Insert sample categories
INSERT INTO categories (name, slug, description, color) VALUES
('Technology', 'technology', 'Tech news and tutorials', '#3b82f6'),
('Design', 'design', 'Design tips and inspiration', '#ec4899'),
('Business', 'business', 'Business strategies and insights', '#10b981');

-- Insert sample tags
INSERT INTO tags (name, slug) VALUES
('JavaScript', 'javascript'),
('React', 'react'),
('Next.js', 'nextjs'),
('TypeScript', 'typescript'),
('Supabase', 'supabase');
