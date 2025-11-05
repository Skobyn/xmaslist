// Server Component Template
// Default component type in Next.js App Router
// Use for: Data fetching, backend access, SEO optimization

import { Suspense } from 'react'

// Optional: Configure route segment
// export const dynamic = 'force-static' | 'force-dynamic'
// export const revalidate = 3600 // Revalidate every hour
// export const fetchCache = 'force-cache' | 'force-no-store'

interface PageProps {
  params: {
    // Dynamic route params
    id: string
  }
  searchParams: {
    // URL search params
    page?: string
    sort?: string
  }
}

// Main component - runs on server
export default async function ServerComponentTemplate({
  params,
  searchParams
}: PageProps) {
  // ✅ Can directly access backend
  // ✅ Can use async/await
  // ✅ Automatic caching
  // ✅ Reduced JavaScript bundle

  // Fetch data on server
  const data = await fetchData(params.id)

  // Access environment variables (server-only)
  const apiKey = process.env.API_KEY

  return (
    <div>
      <h1>{data.title}</h1>

      {/* Can pass data to client components */}
      <ClientComponent data={data} />

      {/* Use Suspense for streaming */}
      <Suspense fallback={<LoadingSkeleton />}>
        <AsyncContent id={params.id} />
      </Suspense>
    </div>
  )
}

// Helper function (can be in same file or imported)
async function fetchData(id: string) {
  const res = await fetch(`https://api.example.com/data/${id}`, {
    // Configure caching
    next: {
      revalidate: 3600, // ISR: Revalidate every hour
      tags: ['data'] // For on-demand revalidation
    }
  })

  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }

  return res.json()
}

// Async component for streaming
async function AsyncContent({ id }: { id: string }) {
  // This will stream in after initial page load
  const content = await fetchSlowData(id)
  return <div>{content}</div>
}

async function fetchSlowData(id: string) {
  // Simulated slow fetch
  await new Promise(resolve => setTimeout(resolve, 2000))
  return 'Streamed content'
}

// Loading component
function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  )
}

// Client component (if needed for interactivity)
'use client' // This would typically be in a separate file
import { useState } from 'react'

function ClientComponent({ data }: { data: any }) {
  const [count, setCount] = useState(0)

  return (
    <button onClick={() => setCount(count + 1)}>
      Clicks: {count}
    </button>
  )
}

// Export metadata (for SEO)
export async function generateMetadata({ params }: PageProps) {
  const data = await fetchData(params.id)

  return {
    title: data.title,
    description: data.description,
    openGraph: {
      title: data.title,
      description: data.description,
      images: [data.image],
    },
  }
}

// For static generation: generate all possible params
export async function generateStaticParams() {
  const items = await fetchAllItems()

  return items.map((item) => ({
    id: item.id,
  }))
}

async function fetchAllItems() {
  // Fetch all possible IDs for static generation
  return []
}
