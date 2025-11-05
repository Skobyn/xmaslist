# Supabase Expert Skill

A comprehensive Claude Code skill for Supabase integration, covering authentication, database, storage, and realtime features.

## Features

- 🔐 **Authentication**: Email/password, OAuth, magic links, MFA
- 🗄️ **Database**: PostgreSQL, RLS, migrations, type-safe queries
- 📦 **Storage**: File uploads, transformations, access control
- ⚡ **Realtime**: Subscriptions, broadcast, presence
- 🚀 **Edge Functions**: Serverless functions with Deno
- 🔧 **Integration**: Next.js App Router patterns

## Installation

This skill is automatically available in Claude Code. No installation required.

## Usage

Claude Code will automatically use this skill when you ask about:

- Setting up Supabase authentication
- Designing database schemas with RLS
- Implementing file storage
- Creating realtime subscriptions
- Integrating Supabase with Next.js
- Troubleshooting Supabase errors

## Quick Start

### Setup

```bash
# Install Supabase
npm install @supabase/supabase-js

# For Next.js App Router
npm install @supabase/auth-helpers-nextjs
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Basic Client

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

## Directory Structure

```
.claude/skills/supabase-expert/
├── SKILL.md                    # Main skill file
├── README.md                   # This file
├── docs/
│   ├── AUTHENTICATION.md       # Complete auth guide
│   ├── DATABASE.md             # Database and RLS
│   ├── STORAGE.md              # File storage
│   └── REALTIME.md             # Realtime subscriptions
├── resources/
│   ├── templates/
│   │   ├── supabase-client.ts  # Client configurations
│   │   ├── auth-context.tsx    # Auth provider
│   │   └── protected-route.tsx # Route protection
│   ├── examples/
│   │   ├── blog-schema.sql     # Blog database schema
│   │   ├── ecommerce-schema.sql
│   │   └── social-schema.sql
│   └── schemas/
└── scripts/
    ├── generate-types.sh       # Generate TS types
    ├── setup-storage.sh        # Configure storage
    └── test-rls.sql            # Test RLS policies
```

## Common Tasks

### Authentication

```typescript
// Sign up
await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
})

// Sign in
await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
})

// OAuth
await supabase.auth.signInWithOAuth({
  provider: 'google',
})
```

### Database Queries

```typescript
// Read
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('status', 'published')

// Insert
const { data } = await supabase
  .from('posts')
  .insert({ title: 'New Post', content: 'Content' })
  .select()

// Update
const { data } = await supabase
  .from('posts')
  .update({ status: 'published' })
  .eq('id', postId)
```

### File Upload

```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.png`, file)

const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.png`)
```

### Realtime Subscriptions

```typescript
const channel = supabase
  .channel('posts')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'posts' },
    (payload) => console.log(payload)
  )
  .subscribe()
```

## Tools & Scripts

### Generate TypeScript Types

```bash
./scripts/generate-types.sh [project-id]
```

Generates type-safe TypeScript interfaces from your database schema.

### Test RLS Policies

```sql
-- Run in SQL Editor
\i scripts/test-rls.sql
```

Tests your Row Level Security policies with different user roles.

## Templates

### Client Configurations
- **Basic Client**: Browser/client-side
- **Server Client**: Next.js Server Components
- **Route Handler Client**: API routes
- **Admin Client**: Bypass RLS (server-only)
- **Middleware Client**: Auth middleware

### Schema Examples
- **Blog Platform**: Posts, comments, categories, tags
- **E-commerce**: Products, orders, cart, inventory
- **Social Media**: Posts, follows, likes, messages

## Best Practices

### Security
- ✅ Always enable RLS on tables
- ✅ Use service role key only server-side
- ✅ Validate user input
- ✅ Implement proper error handling
- ❌ Never expose service role key to client
- ❌ Don't skip email verification

### Performance
- ✅ Use indexes on frequently queried columns
- ✅ Implement pagination
- ✅ Cache public data
- ✅ Use select() to fetch only needed columns
- ❌ Don't use SELECT *
- ❌ Avoid N+1 queries

### Database Design
- ✅ Use foreign keys for relationships
- ✅ Add constraints for data integrity
- ✅ Create indexes for performance
- ✅ Use triggers for automation
- ❌ Don't store sensitive data unencrypted
- ❌ Avoid deeply nested JSON

## Troubleshooting

### "new row violates row-level security policy"
- Check RLS policies
- Verify user is authenticated
- Ensure user has permission

### "JWT expired"
- Refresh session
- Implement auto-refresh
- Handle expiration gracefully

### "Failed to fetch"
- Verify environment variables
- Check CORS settings
- Ensure Supabase URL is correct

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Supabase Discord](https://discord.supabase.com)

## Example Projects

Check `resources/examples/` for complete schema examples:
- Blog platform with comments and categories
- E-commerce with products and orders
- Social media with posts and follows

## Support

- [Supabase GitHub](https://github.com/supabase/supabase)
- [Community Forum](https://github.com/supabase/supabase/discussions)
- [Discord Community](https://discord.supabase.com)

## License

MIT
