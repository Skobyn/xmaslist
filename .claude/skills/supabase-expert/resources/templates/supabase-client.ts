// Supabase Client Templates
// Choose the appropriate client based on your environment

import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// ==============================================
// 1. BASIC CLIENT (Client-side, Browser)
// ==============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// ==============================================
// 2. CLIENT WITH OPTIONS
// ==============================================

export const supabaseWithOptions = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'supabase.auth.token',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-application-name': 'my-app',
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
)

// ==============================================
// 3. SERVER CLIENT (Next.js Server Components)
// ==============================================

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export function createServerClient() {
  return createServerComponentClient<Database>({ cookies })
}

// Usage in Server Component:
// const supabase = createServerClient()
// const { data } = await supabase.from('posts').select('*')

// ==============================================
// 4. ROUTE HANDLER CLIENT (Next.js API Routes)
// ==============================================

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export function createRouteClient() {
  return createRouteHandlerClient<Database>({ cookies })
}

// Usage in API Route:
// const supabase = createRouteClient()
// const { data } = await supabase.from('posts').select('*')

// ==============================================
// 5. SERVER ACTION CLIENT (Next.js Server Actions)
// ==============================================

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'

export function createActionClient() {
  return createServerActionClient<Database>({ cookies })
}

// Usage in Server Action:
// 'use server'
// const supabase = createActionClient()
// await supabase.from('posts').insert({ title: 'New Post' })

// ==============================================
// 6. ADMIN CLIENT (Server-side only, bypasses RLS)
// ==============================================

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ⚠️ WARNING: Service role key bypasses Row Level Security
// Only use server-side, never expose to client
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Usage (server-side only):
// const { data } = await supabaseAdmin
//   .from('users')
//   .select('*') // Bypasses RLS

// ==============================================
// 7. MIDDLEWARE CLIENT (Next.js Middleware)
// ==============================================

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  // Refresh session if expired
  await supabase.auth.getSession()

  return res
}

// ==============================================
// 8. TYPED CLIENT WITH DATABASE TYPES
// ==============================================

// Generate types with:
// npx supabase gen types typescript --project-id your-project-id > database.types.ts

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Usage:
// type Post = Tables<'posts'>
// type NewPost = Inserts<'posts'>
// type UpdatePost = Updates<'posts'>

// ==============================================
// 9. CLIENT WITH CUSTOM FETCH
// ==============================================

export const supabaseWithCustomFetch = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    global: {
      fetch: (url, options = {}) => {
        // Add custom headers, logging, etc.
        console.log('Fetching:', url)
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'X-Custom-Header': 'value',
          },
        })
      },
    },
  }
)

// ==============================================
// 10. CLIENT WITH ERROR HANDLING
// ==============================================

export async function queryWithErrorHandling<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  const { data, error } = await queryFn()

  if (error) {
    console.error('Supabase error:', error)

    // Custom error handling
    if (error.code === 'PGRST301') {
      throw new Error('Resource not found')
    } else if (error.code === '23505') {
      throw new Error('Duplicate entry')
    } else if (error.message.includes('JWT expired')) {
      // Refresh session
      await supabase.auth.refreshSession()
      throw new Error('Session expired, please retry')
    }

    throw new Error(error.message || 'Database error')
  }

  if (!data) {
    throw new Error('No data returned')
  }

  return data
}

// Usage:
// const posts = await queryWithErrorHandling(() =>
//   supabase.from('posts').select('*')
// )

// ==============================================
// 11. CLIENT FACTORY (Environment-aware)
// ==============================================

export function createSupabaseClient() {
  // Server-side
  if (typeof window === 'undefined') {
    return createServerClient()
  }

  // Client-side
  return supabase
}

// ==============================================
// 12. REALTIME CLIENT
// ==============================================

export const supabaseRealtime = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
)

// Usage:
// const channel = supabaseRealtime
//   .channel('posts')
//   .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => {
//     console.log('Change:', payload)
//   })
//   .subscribe()

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

export async function getUserOrThrow() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Not authenticated')
  }

  return user
}

export async function requireAuth() {
  const user = await getUserOrThrow()
  return user
}

export function isAuthenticated() {
  return supabase.auth.getUser().then(({ data: { user } }) => !!user)
}

// ==============================================
// TYPE-SAFE QUERY BUILDER
// ==============================================

export class TypedQuery<T extends keyof Database['public']['Tables']> {
  constructor(private table: T) {}

  async select() {
    return supabase.from(this.table).select('*')
  }

  async insert(data: Inserts<T>) {
    return supabase.from(this.table).insert(data).select()
  }

  async update(id: string, data: Updates<T>) {
    return supabase.from(this.table).update(data).eq('id', id).select()
  }

  async delete(id: string) {
    return supabase.from(this.table).delete().eq('id', id)
  }
}

// Usage:
// const posts = new TypedQuery('posts')
// await posts.insert({ title: 'New Post', content: 'Content' })
