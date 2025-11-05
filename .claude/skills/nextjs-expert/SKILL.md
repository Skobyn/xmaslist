---
name: "Next.js Expert"
description: "Specialized Next.js design, architecture, and troubleshooting expertise. Use when building Next.js applications, debugging App Router vs Pages Router issues, optimizing performance, resolving hydration errors, configuring server/client components, fixing build errors, or designing scalable Next.js architectures."
---

# Next.js Expert

## What This Skill Does

Provides expert guidance for Next.js 13+ (App Router) and Next.js 12 (Pages Router) applications including:
1. **Design Patterns**: Server Components, Client Components, layouts, and data fetching
2. **Troubleshooting**: Hydration errors, build failures, routing issues, and deployment problems
3. **Performance**: Image optimization, bundle analysis, caching strategies, and Core Web Vitals
4. **Architecture**: File structure, API routes, middleware, and authentication patterns

## Prerequisites

- Node.js 18.17+ or 20+
- Next.js 13+ (for App Router) or Next.js 12+ (for Pages Router)
- React 18+
- Basic understanding of React Server Components

---

## Quick Start (Common Issues)

### Issue: Hydration Error
```bash
# Check for mismatched HTML between server and client
# Common causes:
# 1. Different content on server vs client
# 2. Using browser-only APIs in server components
# 3. Incorrect use of useEffect
```

**Quick Fix**:
```tsx
// ❌ Wrong: Using Date.now() causes hydration mismatch
export default function Component() {
  return <div>{Date.now()}</div>
}

// ✅ Correct: Use client component with useEffect
'use client'
import { useState, useEffect } from 'react'

export default function Component() {
  const [time, setTime] = useState<number | null>(null)

  useEffect(() => {
    setTime(Date.now())
  }, [])

  return <div>{time}</div>
}
```

### Issue: "use client" vs Server Components
```tsx
// ✅ Server Component (default in app/)
export default async function ServerPage() {
  const data = await fetch('https://api.example.com/data')
  return <div>{/* No interactivity needed */}</div>
}

// ✅ Client Component (for interactivity)
'use client'
import { useState } from 'react'

export default function ClientComponent() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

### Issue: Images Not Optimizing
```tsx
// ❌ Wrong: Using regular <img>
<img src="/photo.jpg" alt="Photo" />

// ✅ Correct: Using Next.js Image component
import Image from 'next/image'
<Image
  src="/photo.jpg"
  alt="Photo"
  width={500}
  height={300}
  priority // for above-the-fold images
/>
```

---

## Step-by-Step Guides

### 1. Setting Up New Next.js Project

#### App Router (Recommended for new projects)
```bash
npx create-next-app@latest my-app --typescript --tailwind --app --src-dir
cd my-app
npm run dev
```

#### Pages Router (Legacy/existing projects)
```bash
npx create-next-app@latest my-app --typescript --tailwind --src-dir
cd my-app
npm run dev
```

### 2. Understanding File Structure

**App Router Structure**:
```
app/
├── layout.tsx          # Root layout (required)
├── page.tsx            # Home page (/)
├── loading.tsx         # Loading UI
├── error.tsx           # Error UI
├── not-found.tsx       # 404 UI
├── about/
│   └── page.tsx        # /about route
└── api/
    └── route.ts        # API route
```

**Pages Router Structure**:
```
pages/
├── _app.tsx            # App wrapper
├── _document.tsx       # HTML document
├── index.tsx           # Home page (/)
├── about.tsx           # /about route
└── api/
    └── hello.ts        # API route
```

### 3. Data Fetching Patterns

#### Server Components (App Router)
```tsx
// app/posts/page.tsx
export default async function PostsPage() {
  // Fetch on server, automatic caching
  const posts = await fetch('https://api.example.com/posts', {
    next: { revalidate: 3600 } // ISR: revalidate every hour
  }).then(res => res.json())

  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>{post.title}</article>
      ))}
    </div>
  )
}
```

#### Client Components (App Router)
```tsx
// components/PostsList.tsx
'use client'
import { useState, useEffect } from 'react'

export default function PostsList() {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(setPosts)
  }, [])

  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>{post.title}</article>
      ))}
    </div>
  )
}
```

### 4. Common Configuration

#### next.config.js Essentials
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization
  images: {
    domains: ['example.com'],
    formats: ['image/avif', 'image/webp'],
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/old-page',
        destination: '/new-page',
        permanent: true,
      },
    ]
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Output (for Docker/static hosting)
  output: 'standalone', // or 'export' for static
}

module.exports = nextConfig
```

---

## Common Troubleshooting

### Build Errors

**Error: "Module not found"**
```bash
# Solution 1: Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build

# Solution 2: Check tsconfig paths
# Ensure baseUrl and paths are configured correctly
```

**Error: "Export encountered errors"**
```bash
# For static export, ensure no dynamic features:
# - No Server Components with dynamic data
# - No API routes
# - No rewrites/redirects
# - No Image Optimization (use unoptimized: true)
```

### Runtime Errors

**Error: "window is not defined"**
```tsx
// ❌ Wrong: Using window in server component
const width = window.innerWidth

// ✅ Solution 1: Use 'use client'
'use client'
import { useState, useEffect } from 'react'

export default function Component() {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    setWidth(window.innerWidth)
  }, [])
}

// ✅ Solution 2: Check if window exists
const width = typeof window !== 'undefined' ? window.innerWidth : 0
```

**Error: "headers() and cookies() can only be called in Server Components"**
```tsx
// ❌ Wrong: Using in client component
'use client'
import { cookies } from 'next/headers'

// ✅ Correct: Use in server component or server action
import { cookies } from 'next/headers'

export default async function ServerComponent() {
  const cookieStore = cookies()
  const theme = cookieStore.get('theme')
  return <div>Theme: {theme?.value}</div>
}
```

---

## Advanced Topics

### Streaming and Suspense
```tsx
// app/page.tsx
import { Suspense } from 'react'
import Posts from './Posts'
import Comments from './Comments'

export default function Page() {
  return (
    <div>
      <Suspense fallback={<div>Loading posts...</div>}>
        <Posts />
      </Suspense>
      <Suspense fallback={<div>Loading comments...</div>}>
        <Comments />
      </Suspense>
    </div>
  )
}
```

### Parallel Routes and Intercepting Routes
```
app/
├── @modal/              # Parallel route slot
│   └── (..)photo/      # Intercepting route
│       └── [id]/
│           └── page.tsx
└── photo/
    └── [id]/
        └── page.tsx
```

### Server Actions (App Router)
```tsx
// app/actions.ts
'use server'

export async function createPost(formData: FormData) {
  const title = formData.get('title')

  // Validate and save to database
  await db.posts.create({ data: { title } })

  // Revalidate and redirect
  revalidatePath('/posts')
  redirect('/posts')
}

// app/new-post/page.tsx
import { createPost } from '../actions'

export default function NewPost() {
  return (
    <form action={createPost}>
      <input name="title" required />
      <button type="submit">Create</button>
    </form>
  )
}
```

---

## Deep Dive Documentation

For detailed guidance, see:
- **[Design Patterns](docs/DESIGN_PATTERNS.md)** - Component patterns, layouts, data fetching strategies
- **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)** - Complete error reference and solutions
- **[Performance Optimization](docs/PERFORMANCE.md)** - Bundle size, caching, Core Web Vitals
- **[Migration Guide](docs/MIGRATION.md)** - Pages Router to App Router migration

## Templates and Examples

### Component Templates
- `resources/templates/server-component.tsx` - Server Component template
- `resources/templates/client-component.tsx` - Client Component template
- `resources/templates/layout.tsx` - Layout template
- `resources/templates/api-route.ts` - API route template

### Configuration Examples
- `resources/examples/next.config.js` - Complete configuration
- `resources/examples/middleware.ts` - Middleware example
- `resources/examples/env.local` - Environment variables

### Validation Scripts
- `scripts/validate-config.js` - Validate next.config.js
- `scripts/analyze-bundle.sh` - Bundle size analysis
- `scripts/check-performance.js` - Performance audit

---

## Quick Reference

### When to Use Server vs Client Components

**Use Server Components for**:
✅ Fetching data
✅ Accessing backend resources
✅ Keeping sensitive info on server (API keys)
✅ Reducing client-side JavaScript

**Use Client Components for**:
✅ Interactivity and event listeners
✅ useState, useEffect, custom hooks
✅ Browser-only APIs (window, localStorage)
✅ Third-party libraries requiring client features

### Performance Checklist
- [ ] Use Next.js `<Image>` component
- [ ] Implement proper caching strategies
- [ ] Code split with dynamic imports
- [ ] Use Server Components by default
- [ ] Optimize fonts with `next/font`
- [ ] Enable compression in production
- [ ] Use ISR for semi-dynamic content
- [ ] Implement Suspense boundaries

---

## Related Skills
- React Component Builder
- TypeScript Configuration
- API Development
- Database Integration
- Deployment Automation

## External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Examples](https://github.com/vercel/next.js/tree/canary/examples)
- [Vercel Deployment](https://vercel.com/docs)
- [Next.js Discord](https://discord.gg/nextjs)

---

**Created**: 2025-01-03
**Next.js Versions**: 13.x, 14.x, 15.x
**Category**: Web Development
**Difficulty**: Intermediate to Advanced
