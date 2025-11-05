'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
  initialSession?: Session | null;
}

export function AuthProvider({ children, initialSession = null }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null);
  const [session, setSession] = useState<Session | null>(initialSession);
  const [loading, setLoading] = useState(!initialSession);
  const router = useRouter();

  useEffect(() => {
    // Initialize session from server if not provided
    if (!initialSession) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth Event]', event, session?.user?.email || 'No user');

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle different auth events
      switch (event) {
        case 'SIGNED_IN':
          console.log('[Auth] User signed in');
          router.refresh();
          break;
        case 'SIGNED_OUT':
          console.log('[Auth] User signed out');
          router.push('/');
          router.refresh();
          break;
        case 'TOKEN_REFRESHED':
          console.log('[Auth] Token refreshed');
          router.refresh();
          break;
        case 'USER_UPDATED':
          console.log('[Auth] User updated');
          router.refresh();
          break;
      }
    });

    return () => subscription.unsubscribe();
  }, [initialSession, router]);

  // Tab focus/visibility session refresh
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('[Auth] Tab focused, checking session...');
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // Force refresh if token is close to expiry (within 5 minutes)
          const expiresAt = session.expires_at;
          const now = Math.floor(Date.now() / 1000);
          const timeUntilExpiry = expiresAt ? expiresAt - now : 0;

          if (timeUntilExpiry < 300) { // 5 minutes
            console.log('[Auth] Token expiring soon, refreshing...');
            const { data, error } = await supabase.auth.refreshSession();
            if (error) {
              console.error('[Auth] Refresh failed:', error);
            } else {
              console.log('[Auth] Session refreshed successfully');
            }
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}
