/**
 * Authentication Flow for Christmas Wishlist App
 *
 * Demonstrates:
 * - Magic link authentication
 * - Social login (Google, Facebook, Apple)
 * - Guest access
 * - Session management
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  provider?: string;
  is_guest?: boolean;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface GuestSession {
  guest_id: string;
  created_at: string;
  expires_at: string;
}

// ============================================================================
// Supabase Client
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================================
// Magic Link Authentication
// ============================================================================

export async function sendMagicLink(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
}

export async function verifyMagicLink(token: string): Promise<User> {
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: 'email',
  });

  if (error) throw error;
  if (!data.user) throw new Error('No user returned');

  return {
    id: data.user.id,
    email: data.user.email!,
    name: data.user.user_metadata?.name,
    avatar_url: data.user.user_metadata?.avatar_url,
  };
}

// ============================================================================
// Social Login
// ============================================================================

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) throw error;
}

export async function signInWithFacebook() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
}

export async function signInWithApple() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
}

// ============================================================================
// Guest Access
// ============================================================================

export function createGuestSession(listId?: string): GuestSession {
  const guestId = `guest_${crypto.randomUUID()}`;
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

  const session: GuestSession = {
    guest_id: guestId,
    created_at: createdAt.toISOString(),
    expires_at: expiresAt.toISOString(),
  };

  localStorage.setItem('guestSession', JSON.stringify(session));

  if (listId) {
    localStorage.setItem('guestListId', listId);
  }

  return session;
}

export function getGuestSession(): GuestSession | null {
  const stored = localStorage.getItem('guestSession');
  if (!stored) return null;

  const session: GuestSession = JSON.parse(stored);

  // Check if expired
  if (new Date(session.expires_at) < new Date()) {
    localStorage.removeItem('guestSession');
    return null;
  }

  return session;
}

export async function convertGuestToUser(guestId: string, email: string): Promise<void> {
  // Send magic link to convert guest to registered user
  await sendMagicLink(email);

  // Store guest ID for migration after login
  sessionStorage.setItem('convertingGuestId', guestId);
}

export async function migrateGuestData(guestId: string, userId: string): Promise<void> {
  // Call backend to transfer guest-created content to user account
  const response = await fetch('/api/auth/migrate-guest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guestId, userId }),
  });

  if (!response.ok) {
    throw new Error('Failed to migrate guest data');
  }

  // Clear guest session
  localStorage.removeItem('guestSession');
  localStorage.removeItem('guestListId');
  sessionStorage.removeItem('convertingGuestId');
}

// ============================================================================
// Session Management
// ============================================================================

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();

  if (!data.user) return null;

  return {
    id: data.user.id,
    email: data.user.email!,
    name: data.user.user_metadata?.name,
    avatar_url: data.user.user_metadata?.avatar_url,
    provider: data.user.app_metadata?.provider,
  };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;

  // Clear any guest session
  localStorage.removeItem('guestSession');
  localStorage.removeItem('guestListId');
}

export async function refreshSession(): Promise<void> {
  const { error } = await supabase.auth.refreshSession();
  if (error) throw error;
}

// ============================================================================
// React Hooks
// ============================================================================

/**
 * Hook: Authentication state
 */
export function useAuth(): AuthState & {
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  continueAsGuest: () => void;
} {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const user = await getCurrentUser();

        if (user) {
          setState({ user, loading: false, error: null });
        } else {
          // Check for guest session
          const guestSession = getGuestSession();
          if (guestSession) {
            setState({
              user: {
                id: guestSession.guest_id,
                email: '',
                is_guest: true,
              },
              loading: false,
              error: null,
            });
          } else {
            setState({ user: null, loading: false, error: null });
          }
        }
      } catch (error) {
        setState({
          user: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Check if converting from guest
          const convertingGuestId = sessionStorage.getItem('convertingGuestId');
          if (convertingGuestId) {
            await migrateGuestData(convertingGuestId, session.user.id);
          }

          setState({
            user: {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.name,
              avatar_url: session.user.user_metadata?.avatar_url,
              provider: session.user.app_metadata?.provider,
            },
            loading: false,
            error: null,
          });
        } else if (event === 'SIGNED_OUT') {
          setState({ user: null, loading: false, error: null });
        }
      }
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      await sendMagicLink(email);
      setState((prev) => ({ ...prev, loading: false }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to send magic link',
      }));
    }
  };

  const handleSignOut = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      await signOut();
      setState({ user: null, loading: false, error: null });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to sign out',
      }));
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      await signInWithGoogle();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to sign in with Google',
      }));
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      await signInWithFacebook();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to sign in with Facebook',
      }));
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      await signInWithApple();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to sign in with Apple',
      }));
    }
  };

  const continueAsGuest = () => {
    const session = createGuestSession();
    setState({
      user: {
        id: session.guest_id,
        email: '',
        is_guest: true,
      },
      loading: false,
      error: null,
    });
  };

  return {
    ...state,
    signIn,
    signOut: handleSignOut,
    signInWithGoogle: handleGoogleSignIn,
    signInWithFacebook: handleFacebookSignIn,
    signInWithApple: handleAppleSignIn,
    continueAsGuest,
  };
}

// ============================================================================
// React Components
// ============================================================================

/**
 * Authentication Flow Component
 */
export function AuthFlow() {
  const {
    user,
    loading,
    error,
    signIn,
    signInWithGoogle,
    signInWithFacebook,
    signInWithApple,
    continueAsGuest,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email);
    setEmailSent(true);
  };

  if (loading) {
    return (
      <div className="auth-container">
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  if (user) {
    return null; // Already authenticated
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Welcome to Christmas Wishlist 🎄</h1>
        <p className="auth-subtitle">Create and share your wishlist with family and friends</p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Magic Link Form */}
        {!emailSent ? (
          <div className="auth-section primary">
            <h2>✉️ Email Me a Link</h2>
            <form onSubmit={handleMagicLinkSubmit}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="email-input"
              />
              <button type="submit" className="btn-primary">
                Send Magic Link
              </button>
            </form>
            <p className="hint">No password needed!</p>
          </div>
        ) : (
          <div className="auth-section success">
            <h2>📬 Check Your Email!</h2>
            <p>We sent a magic link to <strong>{email}</strong></p>
            <p>Click the link to sign in instantly.</p>
            <button
              onClick={() => setEmailSent(false)}
              className="btn-secondary"
            >
              Use Different Email
            </button>
          </div>
        )}

        <div className="divider">
          <span>or</span>
        </div>

        {/* Social Login */}
        <div className="auth-section social">
          <button onClick={signInWithGoogle} className="btn-social google">
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          <button onClick={signInWithFacebook} className="btn-social facebook">
            <FacebookIcon />
            <span>Continue with Facebook</span>
          </button>

          <button onClick={signInWithApple} className="btn-social apple">
            <AppleIcon />
            <span>Continue with Apple</span>
          </button>
        </div>

        <div className="divider">
          <span>or</span>
        </div>

        {/* Guest Access */}
        <div className="auth-section guest">
          <button onClick={continueAsGuest} className="btn-guest">
            Continue as Guest
          </button>
          <p className="hint">Browse without an account</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Guest Upgrade Prompt Component
 */
export function GuestUpgradePrompt() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [upgrading, setUpgrading] = useState(false);

  if (!user?.is_guest) return null;

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpgrading(true);
    try {
      await convertGuestToUser(user.id, email);
      // User will receive magic link
    } catch (error) {
      console.error('Failed to upgrade:', error);
      setUpgrading(false);
    }
  };

  return (
    <div className="guest-upgrade-banner">
      <div className="upgrade-content">
        <h3>💾 Save Your Wishlist!</h3>
        <p>Create an account to access your lists from any device</p>
      </div>
      <form onSubmit={handleUpgrade} className="upgrade-form">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={upgrading}
        />
        <button type="submit" disabled={upgrading}>
          {upgrading ? 'Sending Link...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}

/**
 * Protected Route Component
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

/**
 * User Avatar Component
 */
export function UserAvatar() {
  const { user, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (!user) return null;

  return (
    <div className="user-avatar-container">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="avatar-button"
      >
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.name || 'User'} />
        ) : (
          <div className="avatar-placeholder">
            {user.is_guest ? '👤' : user.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
      </button>

      {showMenu && (
        <div className="avatar-menu">
          <div className="menu-header">
            <p className="user-name">{user.is_guest ? 'Guest' : user.name || user.email}</p>
            {!user.is_guest && <p className="user-email">{user.email}</p>}
          </div>

          {user.is_guest && <GuestUpgradePrompt />}

          <button onClick={signOut} className="menu-item">
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Icon Components
// ============================================================================

function GoogleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default {
  AuthFlow,
  GuestUpgradePrompt,
  ProtectedRoute,
  UserAvatar,
  useAuth,
  sendMagicLink,
  signInWithGoogle,
  signInWithFacebook,
  signInWithApple,
  createGuestSession,
  convertGuestToUser,
};
