# Next.js Troubleshooting Guide

Complete reference for debugging and resolving Next.js issues.

## Table of Contents
1. [Hydration Errors](#hydration-errors)
2. [Build Errors](#build-errors)
3. [Runtime Errors](#runtime-errors)
4. [Routing Issues](#routing-issues)
5. [Image Optimization Issues](#image-optimization-issues)
6. [API Route Problems](#api-route-problems)
7. [Deployment Issues](#deployment-issues)
8. [Performance Problems](#performance-problems)

---

## Hydration Errors

### Error: "Text content does not match server-rendered HTML"

**Symptoms**:
```
Warning: Text content did not match. Server: "..." Client: "..."
```

**Common Causes**:
1. Using browser-only APIs in server components
2. Timestamps or random values without proper handling
3. Different rendering logic between server and client
4. Browser extensions modifying HTML

**Solutions**:

#### Solution 1: Suppress Hydration Warning (use sparingly)
```tsx
<div suppressHydrationWarning>
  {typeof window === 'undefined' ? 'Server' : 'Client'}
</div>
```

#### Solution 2: Client-Side Only Rendering
```tsx
'use client'
import { useState, useEffect } from 'react'

export default function TimeComponent() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null // or return <Skeleton />
  }

  return <div>{new Date().toLocaleString()}</div>
}
```

#### Solution 3: Dynamic Import with ssr: false
```tsx
import dynamic from 'next/dynamic'

const DynamicComponent = dynamic(
  () => import('./BrowserOnlyComponent'),
  { ssr: false }
)

export default function Page() {
  return <DynamicComponent />
}
```

### Error: "Hydration failed because the initial UI does not match"

**Cause**: Nested HTML elements in invalid positions (e.g., `<p>` inside `<p>`)

**Solution**:
```tsx
// ❌ Wrong: Nested invalid HTML
<p>
  <div>Content</div> {/* div cannot be child of p */}
</p>

// ✅ Correct: Valid HTML structure
<div>
  <p>Content</p>
</div>
```

---

## Build Errors

### Error: "Module not found: Can't resolve '...'"

**Diagnostics**:
```bash
# Check if module is installed
npm ls package-name

# Check import path
# Ensure case-sensitivity matches actual file
```

**Solutions**:

#### Solution 1: Clear cache and reinstall
```bash
rm -rf .next
rm -rf node_modules
rm package-lock.json
npm install
npm run build
```

#### Solution 2: Fix import paths
```tsx
// ❌ Wrong: Case mismatch
import Component from './component' // file is Component.tsx

// ✅ Correct: Match exact case
import Component from './Component'
```

#### Solution 3: Configure path aliases
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"]
    }
  }
}
```

### Error: "Error: Failed to load SWC binary"

**Cause**: Platform-specific SWC binary missing or corrupted

**Solution**:
```bash
# Remove node_modules and reinstall
rm -rf node_modules
npm install

# If using Yarn
yarn cache clean
rm -rf node_modules
yarn install

# If using pnpm
pnpm store prune
rm -rf node_modules
pnpm install
```

### Error: "Export 'default' was not found in '...'"

**Cause**: Incorrect import/export syntax

**Solution**:
```tsx
// ❌ Wrong: Expecting default export
import Component from './Component'

// Component.tsx has:
export const Component = () => <div />

// ✅ Solution 1: Use named import
import { Component } from './Component'

// ✅ Solution 2: Change to default export
export default function Component() {
  return <div />
}
```

---

## Runtime Errors

### Error: "window is not defined"

**Cause**: Accessing browser APIs in server-side code

**Solutions**:

#### Solution 1: Use 'use client' directive
```tsx
'use client'

export default function ClientComponent() {
  const width = window.innerWidth // ✅ Safe in client component
  return <div>Width: {width}</div>
}
```

#### Solution 2: Check for window existence
```tsx
export default function Component() {
  const width = typeof window !== 'undefined' ? window.innerWidth : 0
  return <div>Width: {width}</div>
}
```

#### Solution 3: Use useEffect
```tsx
'use client'
import { useState, useEffect } from 'react'

export default function Component() {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    setWidth(window.innerWidth)

    const handleResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return <div>Width: {width}</div>
}
```

### Error: "document is not defined"

Same solutions as "window is not defined" - access document only in client components or after mounting.

### Error: "localStorage is not defined"

**Solution**: Create a safe wrapper
```tsx
// lib/storage.ts
export const storage = {
  get: (key: string) => {
    if (typeof window === 'undefined') return null
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },

  set: (key: string, value: string) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(key, value)
    } catch {
      // Handle quota exceeded or other errors
    }
  }
}
```

### Error: "Attempted to call cookies()/headers() outside of a Server Component"

**Cause**: Using Next.js server-only functions in client components

**Solution**:
```tsx
// ❌ Wrong: Using in client component
'use client'
import { cookies } from 'next/headers'

// ✅ Solution: Pass data from server component
// layout.tsx (Server Component)
import { cookies } from 'next/headers'
import ClientComponent from './ClientComponent'

export default function Layout() {
  const theme = cookies().get('theme')?.value
  return <ClientComponent theme={theme} />
}

// ClientComponent.tsx
'use client'
export default function ClientComponent({ theme }: { theme?: string }) {
  return <div data-theme={theme}>Content</div>
}
```

---

## Routing Issues

### Issue: 404 on Refresh (Deployment)

**Cause**: Server not configured for SPA-style routing

**Solutions**:

#### Vercel
```json
// vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

#### Nginx
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

#### Apache
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Issue: Dynamic Routes Not Working

**Check**:
```
app/
├── [slug]/          # ✅ Correct dynamic route
│   └── page.tsx
├── [[...slug]]/     # ✅ Optional catch-all
│   └── page.tsx
└── [...slug]/       # ✅ Catch-all
    └── page.tsx
```

**Common mistakes**:
```
app/
├── {slug}/          # ❌ Wrong: Use [] not {}
├── [slug.tsx]       # ❌ Wrong: File should be page.tsx inside [slug]/
└── [slug-page].tsx  # ❌ Wrong: Use folder structure
```

### Issue: Middleware Not Running

**Check middleware.ts location**:
```
project-root/
├── middleware.ts    # ✅ Root level (next to app/ or pages/)
└── app/
    └── middleware.ts # ❌ Wrong location
```

**Check middleware config**:
```ts
// middleware.ts
export function middleware(request: NextRequest) {
  // Your logic
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

---

## Image Optimization Issues

### Issue: Images Not Loading

**Check next.config.js**:
```js
module.exports = {
  images: {
    domains: ['example.com'], // Add external domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.example.com',
        pathname: '/images/**',
      },
    ],
  },
}
```

### Issue: "Invalid src prop"

**Solutions**:
```tsx
// ❌ Wrong: Missing width/height
<Image src="/photo.jpg" alt="Photo" />

// ✅ Correct: Static import or width/height
import photo from './photo.jpg'
<Image src={photo} alt="Photo" />

// OR

<Image
  src="/photo.jpg"
  alt="Photo"
  width={500}
  height={300}
/>

// ✅ For fill images
<div style={{ position: 'relative', height: '400px' }}>
  <Image
    src="/photo.jpg"
    alt="Photo"
    fill
    style={{ objectFit: 'cover' }}
  />
</div>
```

### Issue: "Protocol 'data' is not allowed"

**Solution**: Enable data URLs if needed
```js
// next.config.js
module.exports = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}
```

---

## API Route Problems

### Error: "API resolved without sending a response"

**Cause**: Missing return statement or response

**Solution**:
```ts
// ❌ Wrong: No response sent
export default function handler(req, res) {
  const data = getData()
  // Missing res.json(data)
}

// ✅ Correct: Always send response
export default function handler(req, res) {
  const data = getData()
  return res.status(200).json(data)
}

// ✅ Correct: Handle errors
export default function handler(req, res) {
  try {
    const data = getData()
    return res.status(200).json(data)
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
```

### Error: "API route method not allowed"

**Solution**: Check HTTP method
```ts
// pages/api/users.ts
export default function handler(req, res) {
  if (req.method === 'POST') {
    // Handle POST
  } else if (req.method === 'GET') {
    // Handle GET
  } else {
    // Method not allowed
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
```

### App Router API Routes

```ts
// app/api/hello/route.ts
import { NextRequest, NextResponse } from 'next/server'

// GET handler
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Hello' })
}

// POST handler
export async function POST(request: NextRequest) {
  const body = await request.json()
  return NextResponse.json({ received: body })
}
```

---

## Deployment Issues

### Issue: Environment Variables Not Working

**Check**:
1. Variables must be prefixed with `NEXT_PUBLIC_` for client access
2. Restart dev server after changing .env files
3. On Vercel, add via dashboard Settings → Environment Variables

```bash
# .env.local
DATABASE_URL=postgresql://...     # Server-only
NEXT_PUBLIC_API_URL=https://...  # Client-accessible
```

```tsx
// Server component
const dbUrl = process.env.DATABASE_URL // ✅ Works

// Client component
const apiUrl = process.env.NEXT_PUBLIC_API_URL // ✅ Works
const dbUrl = process.env.DATABASE_URL // ❌ undefined
```

### Issue: Build Succeeds Locally but Fails on Vercel

**Check**:
1. Node version compatibility
2. Build command in package.json
3. Output mode in next.config.js

```json
// package.json
{
  "engines": {
    "node": ">=18.17.0"
  }
}
```

### Issue: Static Export Errors

**Limitations of Static Export**:
- ❌ No API routes
- ❌ No Server Components with dynamic data
- ❌ No Image Optimization (use `unoptimized: true`)
- ❌ No rewrites/redirects
- ❌ No ISR

**Configuration**:
```js
// next.config.js
module.exports = {
  output: 'export',
  images: {
    unoptimized: true,
  },
}
```

---

## Performance Problems

### Issue: Large Bundle Size

**Diagnose**:
```bash
npm run build

# Analyze bundle
npm install @next/bundle-analyzer
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

**Solutions**:
1. Use dynamic imports for large components
2. Check for duplicate dependencies
3. Use tree-shakeable imports
4. Enable SWC minification

### Issue: Slow Page Loads

**Use Next.js Speed Insights**:
```tsx
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
```

**Optimize**:
1. Use Server Components by default
2. Implement proper image optimization
3. Use font optimization with `next/font`
4. Enable caching strategies
5. Use Suspense and streaming

---

## Getting More Help

If issues persist:
1. Check [Next.js GitHub Issues](https://github.com/vercel/next.js/issues)
2. Search [Next.js Discussions](https://github.com/vercel/next.js/discussions)
3. Ask in [Next.js Discord](https://discord.gg/nextjs)
4. Review [Vercel Docs](https://vercel.com/docs)

## Debugging Tips

**Enable verbose logging**:
```bash
NODE_OPTIONS='--inspect' next dev
```

**Check Next.js info**:
```bash
npx next info
```

**Clear all caches**:
```bash
rm -rf .next
rm -rf node_modules/.cache
npm run dev
```
