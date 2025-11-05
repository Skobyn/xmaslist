# Next.js Performance Optimization

Complete guide to optimizing Next.js applications for maximum performance and Core Web Vitals.

## Table of Contents
1. [Core Web Vitals](#core-web-vitals)
2. [Image Optimization](#image-optimization)
3. [Font Optimization](#font-optimization)
4. [Bundle Optimization](#bundle-optimization)
5. [Caching Strategies](#caching-strategies)
6. [Code Splitting](#code-splitting)
7. [Rendering Strategies](#rendering-strategies)
8. [Database Optimization](#database-optimization)

---

## Core Web Vitals

### Measuring Performance

```tsx
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
```

### Largest Contentful Paint (LCP)

**Target**: < 2.5s

**Optimize**:
```tsx
import Image from 'next/image'

export default function Hero() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero"
      width={1920}
      height={1080}
      priority // Load immediately for LCP
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  )
}
```

### First Input Delay (FID) / Interaction to Next Paint (INP)

**Target**: < 100ms

**Optimize**:
```tsx
// Use Server Components to reduce JavaScript
export default async function Page() {
  const data = await fetchData()
  return <ServerContent data={data} />
}

// Code split heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false,
})
```

### Cumulative Layout Shift (CLS)

**Target**: < 0.1

**Optimize**:
```tsx
// Always specify dimensions
<Image
  src="/image.jpg"
  width={500}
  height={300}
  alt="Image"
/>

// Reserve space for dynamic content
<div style={{ minHeight: '200px' }}>
  <DynamicContent />
</div>

// Use CSS aspect-ratio
<div style={{ aspectRatio: '16/9' }}>
  <video src="/video.mp4" />
</div>
```

---

## Image Optimization

### Using next/image

```tsx
import Image from 'next/image'

// Local images (automatically optimized)
import photo from './photo.jpg'

export default function Gallery() {
  return (
    <>
      {/* Static import */}
      <Image
        src={photo}
        alt="Photo"
        placeholder="blur" // Automatic blur-up
      />

      {/* Remote image */}
      <Image
        src="https://example.com/photo.jpg"
        alt="Photo"
        width={800}
        height={600}
        quality={85} // 1-100, default 75
        loading="lazy" // or "eager" for above-fold
      />

      {/* Fill container */}
      <div style={{ position: 'relative', width: '100%', height: '400px' }}>
        <Image
          src="/photo.jpg"
          alt="Photo"
          fill
          style={{ objectFit: 'cover' }}
          sizes="100vw"
        />
      </div>
    </>
  )
}
```

### Responsive Images

```tsx
<Image
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw,
         (max-width: 1200px) 50vw,
         33vw"
/>
```

### Image Configuration

```js
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    domains: ['example.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.example.com',
      },
    ],
  },
}
```

---

## Font Optimization

### Using next/font

```tsx
// app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
})

export default function RootLayout({ children }) {
  return (
    <html className={`${inter.variable} ${robotoMono.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

### Local Fonts

```tsx
import localFont from 'next/font/local'

const myFont = localFont({
  src: [
    {
      path: './fonts/MyFont-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/MyFont-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-my-font',
  display: 'swap',
})
```

### Preloading Fonts

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <link
          rel="preload"
          href="/fonts/MyFont.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

---

## Bundle Optimization

### Analyzing Bundle Size

```bash
# Install analyzer
npm install @next/bundle-analyzer

# Analyze
ANALYZE=true npm run build
```

```js
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // Your config
})
```

### Tree Shaking

```tsx
// ❌ Bad: Imports entire library
import _ from 'lodash'
const result = _.debounce(fn, 300)

// ✅ Good: Import only what you need
import debounce from 'lodash/debounce'
const result = debounce(fn, 300)

// ✅ Better: Use tree-shakeable library
import { debounce } from 'lodash-es'
```

### Removing Unused Dependencies

```bash
# Find unused dependencies
npx depcheck

# Remove unused
npm uninstall unused-package
```

---

## Caching Strategies

### Fetch Caching

```tsx
// Cache indefinitely (default)
const data = await fetch('https://api.example.com/data')

// Revalidate every hour (ISR)
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 3600 },
})

// No caching
const data = await fetch('https://api.example.com/data', {
  cache: 'no-store',
})

// Revalidate on-demand
const data = await fetch('https://api.example.com/data', {
  next: { tags: ['posts'] },
})

// Later, trigger revalidation
import { revalidateTag } from 'next/cache'
revalidateTag('posts')
```

### Route Segment Config

```tsx
// app/posts/page.tsx

// Force static rendering
export const dynamic = 'force-static'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Revalidate every hour
export const revalidate = 3600

// Cache fetch requests
export const fetchCache = 'force-cache'

// Set runtime
export const runtime = 'edge' // or 'nodejs'
```

### Header and Cookie Caching

```tsx
import { headers, cookies } from 'next/headers'

export default async function Page() {
  // Reading headers opts route into dynamic rendering
  const headersList = headers()
  const userAgent = headersList.get('user-agent')

  // Reading cookies opts route into dynamic rendering
  const cookieStore = cookies()
  const theme = cookieStore.get('theme')

  return <div>...</div>
}
```

---

## Code Splitting

### Dynamic Imports

```tsx
import dynamic from 'next/dynamic'

// Component-level code splitting
const DynamicComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
  ssr: false, // Disable SSR for this component
})

export default function Page() {
  return (
    <div>
      <DynamicComponent />
    </div>
  )
}
```

### Named Exports

```tsx
// components/Charts.tsx
export function LineChart() { /* ... */ }
export function BarChart() { /* ... */ }

// app/page.tsx
const LineChart = dynamic(
  () => import('./Charts').then(mod => mod.LineChart),
  { ssr: false }
)
```

### External Libraries

```tsx
// Load heavy library only when needed
const loadHeavyLibrary = async () => {
  const { default: heavyLibrary } = await import('heavy-library')
  return heavyLibrary
}

export default function Component() {
  const handleClick = async () => {
    const lib = await loadHeavyLibrary()
    lib.doSomething()
  }

  return <button onClick={handleClick}>Use Heavy Library</button>
}
```

---

## Rendering Strategies

### Static Generation (SSG)

**Best for**: Marketing pages, blogs, documentation

```tsx
// Automatically static if no dynamic functions used
export default async function Page() {
  const data = await fetch('https://api.example.com/data')
  return <div>{data.content}</div>
}
```

### Incremental Static Regeneration (ISR)

**Best for**: E-commerce, news sites, frequently updated content

```tsx
export const revalidate = 3600 // Revalidate every hour

export default async function Page() {
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 },
  })
  return <div>{data.content}</div>
}
```

### Server-Side Rendering (SSR)

**Best for**: Personalized pages, real-time data

```tsx
export const dynamic = 'force-dynamic'

export default async function Page() {
  const data = await fetch('https://api.example.com/data', {
    cache: 'no-store',
  })
  return <div>{data.content}</div>
}
```

### Client-Side Rendering (CSR)

**Best for**: Interactive dashboards, admin panels

```tsx
'use client'
import { useState, useEffect } from 'react'

export default function Dashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(setData)
  }, [])

  if (!data) return <Loading />
  return <div>{/* Render dashboard */}</div>
}
```

### Streaming with Suspense

**Best for**: Pages with slow data fetching

```tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      <Header />
      <Suspense fallback={<LoadingProducts />}>
        <Products />
      </Suspense>
      <Suspense fallback={<LoadingReviews />}>
        <Reviews />
      </Suspense>
      <Footer />
    </div>
  )
}
```

---

## Database Optimization

### Connection Pooling

```ts
// lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Query Optimization

```ts
// ❌ Bad: N+1 query problem
const posts = await db.post.findMany()
for (const post of posts) {
  post.author = await db.user.findUnique({ where: { id: post.authorId } })
}

// ✅ Good: Include relations
const posts = await db.post.findMany({
  include: {
    author: true,
  },
})

// ✅ Better: Select only needed fields
const posts = await db.post.findMany({
  select: {
    id: true,
    title: true,
    author: {
      select: {
        name: true,
        avatar: true,
      },
    },
  },
})
```

### Pagination

```ts
// Cursor-based pagination (efficient for large datasets)
export async function getPosts(cursor?: string) {
  return db.post.findMany({
    take: 20,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
  })
}

// Offset-based pagination (simpler, less efficient)
export async function getPosts(page: number = 1, perPage: number = 20) {
  const skip = (page - 1) * perPage

  const [posts, total] = await Promise.all([
    db.post.findMany({
      take: perPage,
      skip,
      orderBy: { createdAt: 'desc' },
    }),
    db.post.count(),
  ])

  return { posts, total, page, perPage }
}
```

---

## Performance Checklist

### Initial Load
- [ ] Use Server Components by default
- [ ] Optimize images with next/image
- [ ] Use next/font for fonts
- [ ] Implement code splitting
- [ ] Enable compression
- [ ] Minimize third-party scripts

### Rendering
- [ ] Use appropriate rendering strategy (SSG/ISR/SSR/CSR)
- [ ] Implement Suspense for streaming
- [ ] Use React.memo for expensive components
- [ ] Avoid unnecessary re-renders

### Caching
- [ ] Configure fetch caching
- [ ] Use ISR where appropriate
- [ ] Implement CDN caching
- [ ] Cache API responses

### Bundle
- [ ] Analyze bundle size
- [ ] Remove unused dependencies
- [ ] Tree-shake imports
- [ ] Use dynamic imports for heavy components

### Database
- [ ] Use connection pooling
- [ ] Optimize queries (avoid N+1)
- [ ] Implement pagination
- [ ] Use database indexes

### Monitoring
- [ ] Set up performance monitoring
- [ ] Track Core Web Vitals
- [ ] Monitor bundle size over time
- [ ] Set up error tracking

---

## Tools and Resources

### Analysis Tools
- [Vercel Speed Insights](https://vercel.com/docs/speed-insights)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest](https://www.webpagetest.org/)
- [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)

### Documentation
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web.dev](https://web.dev/)
- [Core Web Vitals](https://web.dev/vitals/)

### Monitoring
- [Vercel Analytics](https://vercel.com/analytics)
- [Sentry Performance](https://sentry.io/for/performance/)
- [New Relic](https://newrelic.com/)
