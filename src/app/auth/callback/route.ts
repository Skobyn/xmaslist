import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Auth Callback Route
 * Handles magic link authentication callback from Supabase.
 *
 * Supports both supported magic-link flows:
 *  - PKCE flow:      ?code=...                  -> exchangeCodeForSession
 *  - OTP/token_hash: ?token_hash=...&type=...   -> verifyOtp
 *
 * The token_hash flow is required for cross-device sign-in (e.g. requesting the
 * link on a desktop and opening it on a phone), where the PKCE code verifier
 * cookie isn't available to exchange the code.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Where to send the user after a successful sign-in (defaults to home).
  const next = searchParams.get('next') ?? '/';

  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, request.url));
  const redirectWithError = (message: string) =>
    redirectTo(`/?error=${encodeURIComponent(message)}`);

  // Handle errors surfaced by Supabase in the redirect.
  if (error) {
    console.error('Auth callback error:', error, errorDescription);
    return redirectWithError(errorDescription || error);
  }

  if (code || (tokenHash && type)) {
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Handle cookie setting errors in middleware
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              // Handle cookie removal errors in middleware
            }
          },
        },
      }
    );

    // PKCE flow (same-device): exchange the code for a session.
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError);
        return redirectWithError(exchangeError.message);
      }
    } else if (tokenHash && type) {
      // OTP flow (works cross-device): verify the token hash directly.
      const { error: verifyError } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });

      if (verifyError) {
        console.error('Error verifying OTP token:', verifyError);
        return redirectWithError(verifyError.message);
      }
    }

    return redirectTo(next);
  }

  // No code or token_hash present — nothing to exchange. Surface a clear error
  // instead of silently redirecting to a logged-out home page.
  console.error('Auth callback called without a code or token_hash parameter');
  return redirectWithError('Invalid or expired magic link. Please request a new one.');
}
