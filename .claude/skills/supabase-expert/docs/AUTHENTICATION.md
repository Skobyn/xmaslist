# Supabase Authentication Guide

Complete guide to implementing authentication with Supabase.

## Table of Contents
1. [Auth Methods](#auth-methods)
2. [Email Authentication](#email-authentication)
3. [OAuth Providers](#oauth-providers)
4. [Magic Links](#magic-links)
5. [Phone Authentication](#phone-authentication)
6. [Multi-Factor Authentication](#multi-factor-authentication)
7. [Session Management](#session-management)
8. [Security Best Practices](#security-best-practices)

---

## Auth Methods

Supabase supports multiple authentication methods:

| Method | Use Case | Pros | Cons |
|--------|----------|------|------|
| Email/Password | Traditional apps | Simple, familiar | Requires password management |
| OAuth | Social login | Fast signup, no passwords | Requires provider setup |
| Magic Links | Passwordless | Secure, no passwords | Requires email access |
| Phone/SMS | Mobile-first | Quick, mobile-native | SMS costs |
| SSO | Enterprise | Corporate accounts | Complex setup |

---

## Email Authentication

### Basic Setup

```typescript
// lib/auth.ts
import { supabase } from './supabase'

export async function signUp(email: string, password: string, metadata?: object) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata, // Custom user metadata
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })

  if (error) throw error
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) throw error
}
```

### Email Confirmation

```typescript
// Enable email confirmation in Supabase Dashboard:
// Authentication → Settings → Enable email confirmations

// After signup, user receives email with confirmation link
// Link format: https://your-app.com/auth/callback?token=...&type=signup

// Handle confirmation in your callback route
// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const token = requestUrl.searchParams.get('token')
  const type = requestUrl.searchParams.get('type')
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect based on type
  if (type === 'signup') {
    return NextResponse.redirect(`${requestUrl.origin}/welcome`)
  }

  return NextResponse.redirect(requestUrl.origin)
}
```

### Email Templates

Customize email templates in Supabase Dashboard:
```
Authentication → Email Templates
```

Available templates:
- Confirm signup
- Invite user
- Magic Link
- Password reset
- Email change

---

## OAuth Providers

### Supported Providers

- Google
- GitHub
- GitLab
- Bitbucket
- Azure
- Facebook
- Twitter
- Discord
- Twitch
- Spotify
- Apple
- And more...

### Setup OAuth

#### 1. Configure Provider in Supabase Dashboard

```
Authentication → Providers → [Provider] → Enable
```

Add OAuth credentials from provider's developer console.

#### 2. Implement Sign In

```typescript
// Sign in with Google
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: 'email profile', // Request specific scopes
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) throw error
  return data
}

// Sign in with GitHub
export async function signInWithGitHub() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw error
  return data
}
```

#### 3. Handle OAuth Callback

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
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(`${requestUrl.origin}/login?error=${error.message}`)
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}
```

### Access Provider Data

```typescript
// Get provider-specific data
const { data: { user } } = await supabase.auth.getUser()

if (user) {
  console.log('Provider:', user.app_metadata.provider)
  console.log('Provider ID:', user.user_metadata.provider_id)
  console.log('Avatar:', user.user_metadata.avatar_url)
  console.log('Full name:', user.user_metadata.full_name)
}
```

---

## Magic Links

### Passwordless Authentication

```typescript
export async function signInWithMagicLink(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      shouldCreateUser: true,
    },
  })

  if (error) throw error
}

// User clicks link in email
// Link format: https://your-app.com/auth/callback?token=...&type=magiclink

// Handle in callback route (same as email confirmation)
```

---

## Phone Authentication

### SMS Authentication

```typescript
// Enable Phone Auth in Supabase Dashboard
// Authentication → Providers → Phone → Enable

export async function signInWithPhone(phone: string) {
  const { error } = await supabase.auth.signInWithOtp({
    phone,
  })

  if (error) throw error
}

export async function verifyOtp(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  })

  if (error) throw error
  return data
}
```

### WhatsApp Authentication

```typescript
export async function signInWithWhatsApp(phone: string) {
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      channel: 'whatsapp',
    },
  })

  if (error) throw error
}
```

---

## Multi-Factor Authentication

### Enable MFA

```typescript
// Enroll MFA for user
export async function enrollMFA() {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
  })

  if (error) throw error

  // data contains:
  // - id: Factor ID
  // - type: 'totp'
  // - totp: { qr_code, secret, uri }

  return data
}

// Verify enrollment
export async function verifyMFAEnrollment(factorId: string, code: string) {
  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    code,
  })

  if (error) throw error
  return data
}

// Challenge MFA during sign in
export async function challengeMFA(factorId: string) {
  const { data, error } = await supabase.auth.mfa.challenge({
    factorId,
  })

  if (error) throw error
  return data
}

// Verify MFA challenge
export async function verifyMFAChallenge(factorId: string, code: string) {
  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    code,
  })

  if (error) throw error
  return data
}
```

---

## Session Management

### Get Current User

```typescript
// Client-side
const { data: { user } } = await supabase.auth.getUser()

// Server-side (Next.js)
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function getServerUser() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
```

### Get Session

```typescript
const { data: { session } } = await supabase.auth.getSession()

if (session) {
  console.log('Access token:', session.access_token)
  console.log('Refresh token:', session.refresh_token)
  console.log('Expires at:', session.expires_at)
}
```

### Refresh Session

```typescript
const { data, error } = await supabase.auth.refreshSession()

if (error) {
  // Session expired, redirect to login
  await supabase.auth.signOut()
}
```

### Listen to Auth Changes

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event)
  console.log('Session:', session)

  if (event === 'SIGNED_IN') {
    // User signed in
  } else if (event === 'SIGNED_OUT') {
    // User signed out
  } else if (event === 'TOKEN_REFRESHED') {
    // Token was refreshed
  } else if (event === 'USER_UPDATED') {
    // User metadata updated
  }
})
```

### Auth Context Provider

```typescript
// components/AuthProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

---

## Security Best Practices

### Password Requirements

```typescript
// Enforce strong passwords
export function validatePassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number')
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain a special character')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
```

### Rate Limiting

Configure in Supabase Dashboard:
```
Authentication → Settings → Rate Limits
```

### PKCE Flow

```typescript
// For additional security in OAuth flows
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    skipBrowserRedirect: false,
    scopes: 'email profile',
  },
})
```

### Secure Session Storage

```typescript
// Next.js App Router - Server Components
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const supabase = createServerComponentClient({ cookies })

// Next.js App Router - Route Handlers
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const supabase = createRouteHandlerClient({ cookies })

// Next.js App Router - Server Actions
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const supabase = createServerActionClient({ cookies })
```

### Protect API Routes

```typescript
// app/api/protected/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Protected logic here
  return NextResponse.json({ data: 'Protected data' })
}
```

---

## Testing

### Mock Supabase Auth

```typescript
// __mocks__/supabase.ts
export const mockUser = {
  id: '123',
  email: 'test@example.com',
  user_metadata: {},
  app_metadata: {},
}

export const mockSupabase = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    }),
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
  },
}
```

---

## Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
