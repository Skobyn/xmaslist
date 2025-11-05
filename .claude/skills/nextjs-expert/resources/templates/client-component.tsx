// Client Component Template
// Use for: Interactivity, hooks, browser APIs, event handlers

'use client' // REQUIRED at top of file

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface ClientComponentProps {
  // Props passed from server component
  initialData?: any
  onUpdate?: (data: any) => void
}

export default function ClientComponentTemplate({
  initialData,
  onUpdate,
}: ClientComponentProps) {
  // ✅ Can use React hooks
  // ✅ Can use browser APIs (window, document, localStorage)
  // ✅ Can handle events (onClick, onChange)
  // ✅ Interactive features

  // State management
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs
  const inputRef = useRef<HTMLInputElement>(null)

  // Next.js navigation hooks
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Effects
  useEffect(() => {
    // Browser-only code
    if (typeof window !== 'undefined') {
      console.log('Client-side only')

      // Access browser APIs
      const width = window.innerWidth
      const stored = localStorage.getItem('key')
    }
  }, [])

  useEffect(() => {
    // Effect with dependencies
    if (initialData) {
      setData(initialData)
    }
  }, [initialData])

  // Event handlers
  const handleClick = useCallback(() => {
    setLoading(true)

    // Fetch data client-side
    fetch('/api/endpoint')
      .then(res => res.json())
      .then(data => {
        setData(data)
        onUpdate?.(data)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [onUpdate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setData(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to submit')

      const result = await response.json()
      console.log('Success:', result)

      // Navigate programmatically
      router.push('/success')
      // or router.refresh() to refresh server components
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleNavigation = () => {
    // Update URL search params
    const params = new URLSearchParams(searchParams)
    params.set('filter', 'active')
    router.push(`${pathname}?${params.toString()}`)
  }

  // Render loading state
  if (loading) {
    return <div>Loading...</div>
  }

  // Render error state
  if (error) {
    return (
      <div className="text-red-500">
        <p>Error: {error}</p>
        <button onClick={() => setError(null)}>Try Again</button>
      </div>
    )
  }

  return (
    <div className="client-component">
      <h2>Client Component</h2>

      {/* Form with event handlers */}
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={data}
          onChange={handleChange}
          placeholder="Enter text"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>

      {/* Interactive buttons */}
      <button onClick={handleClick}>
        Fetch Data
      </button>

      <button onClick={handleNavigation}>
        Update URL
      </button>

      <button onClick={() => router.back()}>
        Go Back
      </button>

      {/* Display data */}
      {data && (
        <div>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

// Example: Custom hook in client component
function useLocalStorage(key: string, initialValue: any) {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(error)
      return initialValue
    }
  })

  const setValue = (value: any) => {
    try {
      setStoredValue(value)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value))
      }
    } catch (error) {
      console.error(error)
    }
  }

  return [storedValue, setValue]
}

// Example: Browser API usage
function useBrowserAPI() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)

    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  return dimensions
}
