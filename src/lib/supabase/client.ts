import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Creates a Supabase client for use in Client Components
 *
 * This client automatically handles:
 * - Cookie-based session management
 * - Real-time subscriptions
 * - Client-side authentication
 *
 * @returns Supabase client instance
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Singleton Supabase client instance
 * Use this in Client Components for consistent session management
 */
export const supabase = createClient();
