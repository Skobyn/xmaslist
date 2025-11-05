# Next.js Design Patterns

Proven patterns and best practices for building scalable Next.js applications.

## Table of Contents
1. [Component Patterns](#component-patterns)
2. [Layout Patterns](#layout-patterns)
3. [Data Fetching Patterns](#data-fetching-patterns)
4. [State Management Patterns](#state-management-patterns)
5. [Authentication Patterns](#authentication-patterns)
6. [Error Handling Patterns](#error-handling-patterns)
7. [File Organization](#file-organization)

---

## Component Patterns

### Server Component by Default

**Pattern**: Start with Server Components, add 'use client' only when needed

```tsx
// ✅ Server Component (default in app/)
// No 'use client' needed
export default async function ProductList() {
  const products = await db.products.findMany()

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

**When to use Client Components**:
```tsx
'use client'

// Need interactivity
export function InteractiveButton() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}

// Need browser APIs
export function WindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateSize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  return <div>{size.width} x {size.height}</div>
}
```

### Composition Pattern

**Pattern**: Compose Server and Client Components strategically

```tsx
// app/page.tsx (Server Component)
import ProductList from './ProductList' // Server
import AddToCartButton from './AddToCartButton' // Client

export default async function Page() {
  const products = await getProducts()

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>
          <h2>{product.name}</h2>
          <p>{product.description}</p>
          {/* Pass server data to client component */}
          <AddToCartButton productId={product.id} />
        </div>
      ))}
    </div>
  )
}
```

```tsx
// AddToCartButton.tsx (Client Component)
'use client'

export default function AddToCartButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    setLoading(true)
    await addToCart(productId)
    setLoading(false)
  }

  return (
    <button onClick={handleAdd} disabled={loading}>
      {loading ? 'Adding...' : 'Add to Cart'}
    </button>
  )
}
```

### Children Prop Pattern

**Pattern**: Wrap client components around server content

```tsx
// ClientWrapper.tsx (Client Component)
'use client'

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && children}
    </div>
  )
}

// page.tsx (Server Component)
export default async function Page() {
  const data = await fetchData()

  return (
    <ClientWrapper>
      {/* This remains a server component */}
      <ServerContent data={data} />
    </ClientWrapper>
  )
}
```

---

## Layout Patterns

### Root Layout

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'My App',
  description: 'App description',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
```

### Nested Layouts

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        {children}
      </div>
    </div>
  )
}
```

### Template Pattern (Re-renders on Navigation)

```tsx
// app/template.tsx
'use client'

export default function Template({ children }: { children: React.ReactNode }) {
  // This re-renders on every route change
  // Useful for animations or resetting state
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {children}
    </motion.div>
  )
}
```

### Parallel Routes

```tsx
// app/layout.tsx
export default function Layout({
  children,
  modal, // Parallel route
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <>
      {children}
      {modal}
    </>
  )
}

// app/@modal/(.)photo/[id]/page.tsx - Intercepted route
export default function PhotoModal({ params }: { params: { id: string } }) {
  return (
    <div className="modal">
      <Image src={`/photos/${params.id}`} alt="Photo" />
    </div>
  )
}
```

---

## Data Fetching Patterns

### Static Data Fetching (SSG)

```tsx
// app/posts/[id]/page.tsx
export async function generateStaticParams() {
  const posts = await getPosts()

  return posts.map((post) => ({
    id: post.id,
  }))
}

export default async function Post({ params }: { params: { id: string } }) {
  const post = await getPost(params.id)

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  )
}
```

### Incremental Static Regeneration (ISR)

```tsx
export default async function Page() {
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 }, // Revalidate every hour
  }).then(res => res.json())

  return <div>{data.content}</div>
}
```

### Dynamic Server Rendering

```tsx
// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function Page() {
  const data = await fetch('https://api.example.com/data', {
    cache: 'no-store', // No caching
  }).then(res => res.json())

  return <div>{data.content}</div>
}
```

### Streaming with Suspense

```tsx
// app/page.tsx
import { Suspense } from 'react'
import { Posts } from './Posts'
import { Comments } from './Comments'

export default function Page() {
  return (
    <div>
      <h1>Dashboard</h1>

      <Suspense fallback={<PostsSkeleton />}>
        <Posts />
      </Suspense>

      <Suspense fallback={<CommentsSkeleton />}>
        <Comments />
      </Suspense>
    </div>
  )
}

// Posts.tsx - Slow data fetch
export async function Posts() {
  await new Promise(resolve => setTimeout(resolve, 2000))
  const posts = await getPosts()

  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
```

### Parallel Data Fetching

```tsx
export default async function Page() {
  // Start fetches in parallel
  const userPromise = getUser()
  const postsPromise = getPosts()
  const commentsPromise = getComments()

  // Wait for all
  const [user, posts, comments] = await Promise.all([
    userPromise,
    postsPromise,
    commentsPromise,
  ])

  return (
    <div>
      <UserProfile user={user} />
      <Posts posts={posts} />
      <Comments comments={comments} />
    </div>
  )
}
```

### Deduplication

```tsx
// Next.js automatically deduplicates identical fetch requests
// These will only make ONE request:

async function getPost(id: string) {
  return fetch(`https://api.example.com/posts/${id}`)
}

export default async function Page() {
  const post1 = await getPost('1') // Request 1
  const post2 = await getPost('1') // Deduplicated (same request)

  return <div>{post1.title}</div>
}
```

---

## State Management Patterns

### URL State (Search Params)

```tsx
// app/search/page.tsx
import { Suspense } from 'react'

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string }
}) {
  return (
    <Suspense fallback={<Loading />}>
      <SearchResults query={searchParams.q} page={searchParams.page} />
    </Suspense>
  )
}

// Update URL with useRouter
'use client'
import { useRouter, useSearchParams } from 'next/navigation'

export function SearchForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSearch = (query: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('q', query)
    router.push(`/search?${params.toString()}`)
  }

  return <input onChange={(e) => handleSearch(e.target.value)} />
}
```

### Context Pattern

```tsx
// app/providers.tsx
'use client'

import { createContext, useContext, useState } from 'react'

const ThemeContext = createContext<{
  theme: string
  setTheme: (theme: string) => void
}>({
  theme: 'light',
  setTheme: () => {},
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState('light')

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)

// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### Zustand Pattern

```tsx
// lib/store.ts
import { create } from 'zustand'

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  })),
}))

// components/Cart.tsx
'use client'
import { useCartStore } from '@/lib/store'

export function Cart() {
  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((state) => state.removeItem)

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>
          {item.name}
          <button onClick={() => removeItem(item.id)}>Remove</button>
        </div>
      ))}
    </div>
  )
}
```

---

## Authentication Patterns

### Server Component Auth Check

```tsx
// app/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return <div>Welcome, {session.user.name}</div>
}
```

### Middleware Auth

```tsx
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/dashboard/:path*',
}
```

### Server Actions with Auth

```tsx
// app/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'

export async function createPost(formData: FormData) {
  const session = await getServerSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const title = formData.get('title') as string

  await db.posts.create({
    data: {
      title,
      authorId: session.user.id,
    },
  })

  revalidatePath('/posts')
}
```

---

## Error Handling Patterns

### Error Boundary

```tsx
// app/dashboard/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

### Not Found

```tsx
// app/posts/[id]/not-found.tsx
export default function NotFound() {
  return (
    <div>
      <h2>Post Not Found</h2>
      <p>Could not find the requested post.</p>
      <Link href="/posts">View all posts</Link>
    </div>
  )
}

// app/posts/[id]/page.tsx
import { notFound } from 'next/navigation'

export default async function Post({ params }: { params: { id: string } }) {
  const post = await getPost(params.id)

  if (!post) {
    notFound()
  }

  return <article>{post.content}</article>
}
```

### Global Error

```tsx
// app/global-error.tsx
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}
```

---

## File Organization

### Feature-Based Structure

```
app/
├── (auth)/              # Route group (doesn't affect URL)
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
├── (dashboard)/         # Route group
│   ├── layout.tsx       # Shared layout
│   ├── dashboard/
│   │   └── page.tsx
│   └── settings/
│       └── page.tsx
├── api/
│   ├── posts/
│   │   └── route.ts
│   └── users/
│       └── route.ts
└── _components/         # Underscore = not a route
    ├── Header.tsx
    └── Footer.tsx

lib/                     # Utilities
├── db.ts
├── auth.ts
└── utils.ts

components/              # Shared components
├── ui/
│   ├── Button.tsx
│   └── Input.tsx
└── features/
    ├── posts/
    └── users/
```

### Domain-Driven Structure

```
src/
├── app/                 # Next.js app directory
│   ├── (public)/
│   ├── (protected)/
│   └── api/
├── features/            # Feature modules
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types.ts
│   ├── posts/
│   └── users/
├── components/          # Shared components
│   └── ui/
└── lib/                 # Shared utilities
    ├── db/
    ├── api/
    └── utils/
```

---

## Best Practices Summary

### ✅ Do's
- Use Server Components by default
- Fetch data as close to where it's needed as possible
- Use Suspense for streaming and loading states
- Implement proper error boundaries
- Use TypeScript for type safety
- Optimize images with next/image
- Use next/font for font optimization
- Implement proper caching strategies

### ❌ Don'ts
- Don't use 'use client' unnecessarily
- Don't fetch data in client components when you can use server
- Don't ignore hydration warnings
- Don't hardcode sensitive data
- Don't skip image optimization
- Don't ignore Core Web Vitals
- Don't use outdated patterns from Pages Router in App Router
