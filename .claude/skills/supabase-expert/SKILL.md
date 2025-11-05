---
name: "Supabase Expert"
description: "Comprehensive Supabase integration, authentication, database, storage, and realtime subscriptions expertise. Use when building with Supabase, setting up authentication (email, OAuth, magic links), designing database schemas with Row Level Security, implementing storage solutions, configuring realtime subscriptions, troubleshooting Supabase errors, or integrating with Next.js/React applications."
---

# Supabase Expert

## What This Skill Does

Provides expert guidance for Supabase (open-source Firebase alternative) including:
1. **Authentication**: Email/password, OAuth, magic links, SSO, MFA
2. **Database**: PostgreSQL, Row Level Security (RLS), migrations, relationships
3. **Storage**: File uploads, image transformations, CDN, access control
4. **Realtime**: Subscriptions, broadcast, presence
5. **Edge Functions**: Serverless functions with Deno
6. **Integration**: Next.js, React, TypeScript patterns

## Prerequisites

- Node.js 18+ or Deno 1.20+
- Supabase account ([supabase.com](https://supabase.com))
- Basic understanding of PostgreSQL and React

---

## Quick Start (Common Tasks)

### Setup Supabase Client

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Sign Up User

```typescript
import { supabase } from '@/lib/supabase'

async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) throw error
  return data
}
```

### Fetch Data with RLS

```typescript
// Automatically filtered by user's permissions
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('status', 'published')
```

### Upload File

```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`public/${userId}.png`, file, {
    cacheControl: '3600',
    upsert: true
  })
```

### Realtime Subscription

```typescript
const channel = supabase
  .channel('posts')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'posts' },
    (payload) => console.log('Change:', payload)
  )
  .subscribe()
```

---

## Step-by-Step Guides

### 1. Setting Up Supabase Project

#### Create Project
```bash
# Option 1: Via Dashboard
# Go to supabase.com → New Project

# Option 2: Via CLI
npm install -g supabase
supabase init
supabase start
```

#### Get Credentials
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Authentication Setup

#### Email/Password Auth

```typescript
// components/AuthForm.tsx
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) alert(error.message)
    else alert('Check your email for the confirmation link!')

    setLoading(false)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) alert(error.message)
    setLoading(false)
  }

  return (
    <form>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button onClick={handleSignIn} disabled={loading}>
        Sign In
      </button>
      <button onClick={handleSignUp} disabled={loading}>
        Sign Up
      </button>
    </form>
  )
}
```

#### OAuth Integration

```typescript
// Sign in with Google
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
})

// Sign in with GitHub
await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
})
```

#### Auth Callback Handler (Next.js App Router)

```typescript
// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(requestUrl.origin)
}
```

### 3. Database & RLS Setup

#### Create Table with Migration

```sql
-- migrations/001_create_posts.sql
CREATE TABLE posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  title TEXT NOT NULL,
  content TEXT,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published'))
);

-- Create index for faster queries
CREATE INDEX posts_user_id_idx ON posts(user_id);
CREATE INDEX posts_status_idx ON posts(status);
```

#### Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view published posts
CREATE POLICY "Public posts are viewable by everyone"
ON posts FOR SELECT
USING (status = 'published');

-- Policy: Users can view their own posts
CREATE POLICY "Users can view their own posts"
ON posts FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create their own posts
CREATE POLICY "Users can create posts"
ON posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own posts
CREATE POLICY "Users can update their own posts"
ON posts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own posts
CREATE POLICY "Users can delete their own posts"
ON posts FOR DELETE
USING (auth.uid() = user_id);
```

### 4. CRUD Operations

```typescript
// Create
const { data, error } = await supabase
  .from('posts')
  .insert([
    { title: 'My Post', content: 'Hello World', user_id: userId }
  ])
  .select()

// Read
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })

// Read with joins
const { data, error } = await supabase
  .from('posts')
  .select(`
    *,
    profiles!user_id (
      username,
      avatar_url
    )
  `)

// Update
const { data, error } = await supabase
  .from('posts')
  .update({ status: 'published' })
  .eq('id', postId)
  .select()

// Delete
const { data, error } = await supabase
  .from('posts')
  .delete()
  .eq('id', postId)

// Count
const { count, error } = await supabase
  .from('posts')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'published')
```

---

## Common Use Cases

### User Profile System

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Trigger: Create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### File Upload with Storage

```typescript
// Upload image
const uploadImage = async (file: File, userId: string) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const filePath = `avatars/${fileName}`

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) throw uploadError

  // Get public URL
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  return data.publicUrl
}

// Storage policies (run in Supabase SQL editor)
/*
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow public to view avatars
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
*/
```

---

## Advanced Topics

### Realtime Subscriptions

```typescript
// components/RealtimePosts.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function RealtimePosts() {
  const [posts, setPosts] = useState<any[]>([])

  useEffect(() => {
    // Fetch initial data
    const fetchPosts = async () => {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (data) setPosts(data)
    }

    fetchPosts()

    // Subscribe to changes
    const channel = supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: 'status=eq.published',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPosts((current) => [payload.new, ...current])
          } else if (payload.eventType === 'UPDATE') {
            setPosts((current) =>
              current.map((post) =>
                post.id === payload.new.id ? payload.new : post
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setPosts((current) =>
              current.filter((post) => post.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div>
      {posts.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
        </article>
      ))}
    </div>
  )
}
```

### Edge Functions

```typescript
// supabase/functions/hello/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
      },
    })
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    // Your function logic here
    const { name } = await req.json()

    return new Response(
      JSON.stringify({ message: `Hello ${name}!`, userId: user.id }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})
```

---

## Deep Dive Documentation

For detailed guidance, see:
- **[Authentication Guide](docs/AUTHENTICATION.md)** - Complete auth patterns and security
- **[Database Guide](docs/DATABASE.md)** - Schema design, RLS, migrations, queries
- **[Storage Guide](docs/STORAGE.md)** - File management, transformations, policies
- **[Realtime Guide](docs/REALTIME.md)** - Subscriptions, broadcast, presence

## Templates and Examples

### Client Templates
- `resources/templates/supabase-client.ts` - Client initialization
- `resources/templates/auth-context.tsx` - Auth context provider
- `resources/templates/protected-route.tsx` - Protected route component

### Schema Examples
- `resources/examples/blog-schema.sql` - Blog database schema
- `resources/examples/ecommerce-schema.sql` - E-commerce schema
- `resources/examples/social-schema.sql` - Social media schema

### Scripts
- `scripts/generate-types.sh` - Generate TypeScript types from database
- `scripts/setup-storage.sh` - Configure storage buckets
- `scripts/test-rls.sql` - Test RLS policies

---

## Troubleshooting

### Common Issues

**Error: "new row violates row-level security policy"**
```typescript
// Issue: RLS policy preventing operation
// Solution: Check RLS policies and ensure user is authenticated

// Verify user is authenticated
const { data: { user } } = await supabase.auth.getUser()
console.log('User:', user)

// Test with service role key (bypasses RLS)
// WARNING: Only use server-side!
const supabaseAdmin = createClient(url, serviceRoleKey)
```

**Error: "JWT expired"**
```typescript
// Issue: Session expired
// Solution: Refresh session

const { data, error } = await supabase.auth.refreshSession()
if (error) {
  // Redirect to login
  await supabase.auth.signOut()
}
```

**Error: "Failed to fetch"**
```typescript
// Issue: CORS or network error
// Solution: Check Supabase URL and CORS settings

// Verify environment variables
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10))
```

---

## Best Practices

### ✅ Do's
- Use Row Level Security (RLS) for all tables
- Store secrets server-side only (service role key)
- Use TypeScript for type safety
- Implement proper error handling
- Use indexes for frequently queried columns
- Cache public data
- Use storage transformations for images

### ❌ Don'ts
- Don't expose service role key client-side
- Don't skip RLS policies
- Don't store sensitive data unencrypted
- Don't make unnecessary realtime subscriptions
- Don't forget to clean up subscriptions
- Don't use SELECT * in production
- Don't skip email verification

---

## Integration Patterns

### Next.js App Router

```typescript
// lib/supabase/server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createServerClient = () => {
  return createServerComponentClient({ cookies })
}

// app/dashboard/page.tsx
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.id)

  return <div>{/* Render posts */}</div>
}
```

---

## External Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Examples](https://github.com/supabase/supabase/tree/master/examples)
- [Supabase Discord](https://discord.supabase.com)
- [SQL Best Practices](https://supabase.com/docs/guides/database/postgres)

---

**Created**: 2025-01-03
**Supabase Version**: Compatible with Supabase v2+
**Category**: Backend as a Service (BaaS)
**Difficulty**: Beginner to Advanced
