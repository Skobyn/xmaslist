/**
 * Supabase Real-time Implementation for Christmas Wishlist App
 *
 * This file demonstrates how to implement real-time collaboration features
 * using Supabase Realtime with React hooks.
 */

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { useEffect, useState, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

interface WishlistItem {
  id: string;
  list_id: string;
  name: string;
  description: string;
  link?: string;
  price?: number;
  purchased: boolean;
  purchased_by?: string;
  priority: number;
  position: number;
  created_at: string;
  updated_at: string;
  version: number;
}

interface UserPresence {
  user_id: string;
  user_name: string;
  avatar_url: string;
  color: string;
  online_at: string;
  viewing_item?: string;
}

interface RealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  old: any;
  new: any;
  commit_timestamp: string;
}

// ============================================================================
// Supabase Client Setup
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10, // Rate limiting
    },
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// ============================================================================
// Real-time Hooks
// ============================================================================

/**
 * Hook: Subscribe to wishlist items in real-time
 *
 * Usage:
 *   const { items, loading, error } = useRealtimeItems(listId);
 */
export function useRealtimeItems(listId: string) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!listId) return;

    // Initial fetch
    const fetchItems = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('items')
          .select('*')
          .eq('list_id', listId)
          .order('position', { ascending: true });

        if (fetchError) throw fetchError;
        setItems(data || []);
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    fetchItems();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`list:${listId}:items`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items',
          filter: `list_id=eq.${listId}`,
        },
        (payload: RealtimeEvent) => {
          console.log('Real-time event:', payload);

          switch (payload.type) {
            case 'INSERT':
              setItems((current) => {
                // Check if item already exists (prevent duplicates)
                if (current.some((item) => item.id === payload.new.id)) {
                  return current;
                }
                return [...current, payload.new].sort((a, b) => a.position - b.position);
              });
              break;

            case 'UPDATE':
              setItems((current) =>
                current.map((item) =>
                  item.id === payload.new.id ? payload.new : item
                )
              );
              break;

            case 'DELETE':
              setItems((current) =>
                current.filter((item) => item.id === payload.old.id)
              );
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Cleanup
    return () => {
      channel.unsubscribe();
    };
  }, [listId]);

  return { items, loading, error };
}

/**
 * Hook: Manage user presence (who's online)
 *
 * Usage:
 *   const { presence, track } = usePresence(listId, currentUser);
 */
export function usePresence(listId: string, currentUser: { id: string; name: string; avatar: string }) {
  const [presence, setPresence] = useState<UserPresence[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!listId || !currentUser) return;

    const assignedColor = generateUserColor(currentUser.id);

    const presenceChannel = supabase
      .channel(`list:${listId}:presence`, {
        config: {
          presence: {
            key: currentUser.id,
          },
        },
      })
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users = Object.values(state)
          .flat()
          .map((user: any) => user as UserPresence);
        setPresence(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track initial presence
          await presenceChannel.track({
            user_id: currentUser.id,
            user_name: currentUser.name,
            avatar_url: currentUser.avatar,
            color: assignedColor,
            online_at: new Date().toISOString(),
          });
        }
      });

    setChannel(presenceChannel);

    // Heartbeat to maintain presence
    const heartbeat = setInterval(() => {
      if (presenceChannel) {
        presenceChannel.track({
          user_id: currentUser.id,
          user_name: currentUser.name,
          avatar_url: currentUser.avatar,
          color: assignedColor,
          online_at: new Date().toISOString(),
        });
      }
    }, 30000); // Every 30 seconds

    // Cleanup
    return () => {
      clearInterval(heartbeat);
      presenceChannel.unsubscribe();
    };
  }, [listId, currentUser]);

  // Function to track specific activity (e.g., viewing an item)
  const track = useCallback(
    async (activity: Partial<UserPresence>) => {
      if (channel) {
        await channel.track({
          user_id: currentUser.id,
          user_name: currentUser.name,
          avatar_url: currentUser.avatar,
          color: generateUserColor(currentUser.id),
          online_at: new Date().toISOString(),
          ...activity,
        });
      }
    },
    [channel, currentUser]
  );

  return { presence, track };
}

/**
 * Hook: Subscribe to activity feed
 *
 * Usage:
 *   const activities = useActivityFeed(listId);
 */
export function useActivityFeed(listId: string) {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (!listId) return;

    // Initial fetch
    const fetchActivities = async () => {
      const { data } = await supabase
        .from('activity_log')
        .select('*')
        .eq('list_id', listId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) setActivities(data);
    };

    fetchActivities();

    // Subscribe to new activities
    const channel = supabase
      .channel(`list:${listId}:activity`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          setActivities((current) => [payload.new, ...current].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [listId]);

  return activities;
}

// ============================================================================
// CRUD Operations with Optimistic Updates
// ============================================================================

/**
 * Create a new wishlist item with optimistic update
 */
export async function createItem(
  listId: string,
  itemData: Omit<WishlistItem, 'id' | 'created_at' | 'updated_at' | 'version'>
): Promise<WishlistItem> {
  const tempItem: WishlistItem = {
    id: `temp-${Date.now()}`,
    ...itemData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  };

  // Optimistic update handled by useRealtimeItems hook

  const { data, error } = await supabase
    .from('items')
    .insert({
      ...itemData,
      list_id: listId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update item with conflict detection
 */
export async function updateItem(
  itemId: string,
  updates: Partial<WishlistItem>,
  currentVersion: number
): Promise<WishlistItem> {
  const { data, error } = await supabase
    .from('items')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
      version: currentVersion + 1,
    })
    .eq('id', itemId)
    .eq('version', currentVersion) // Optimistic concurrency control
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows updated - version conflict
      throw new Error('CONFLICT: Item was modified by another user');
    }
    throw error;
  }

  return data;
}

/**
 * Mark item as purchased with reservation
 */
export async function markAsPurchased(
  itemId: string,
  userId: string
): Promise<void> {
  // First, try to reserve the item
  const { data: reservation, error: reservationError } = await supabase
    .from('purchase_reservations')
    .insert({
      item_id: itemId,
      reserved_by: userId,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min
    })
    .select()
    .single();

  if (reservationError) {
    // Check if already reserved by someone else
    const { data: existing } = await supabase
      .from('purchase_reservations')
      .select('*, users(name)')
      .eq('item_id', itemId)
      .single();

    if (existing) {
      throw new Error(`Item already reserved by ${existing.users.name}`);
    }
    throw reservationError;
  }

  // Mark as purchased
  const { error: updateError } = await supabase
    .from('items')
    .update({
      purchased: true,
      purchased_by: userId,
      purchased_at: new Date().toISOString(),
    })
    .eq('id', itemId);

  if (updateError) {
    // Rollback reservation
    await supabase
      .from('purchase_reservations')
      .delete()
      .eq('id', reservation.id);
    throw updateError;
  }

  // Log activity
  await supabase.from('activity_log').insert({
    list_id: reservation.list_id,
    user_id: userId,
    action: 'item_purchased',
    entity_type: 'item',
    entity_id: itemId,
  });
}

/**
 * Delete item
 */
export async function deleteItem(itemId: string): Promise<void> {
  const { error } = await supabase.from('items').delete().eq('id', itemId);

  if (error) throw error;
}

// ============================================================================
// Sharing & Permissions
// ============================================================================

/**
 * Create a share link
 */
export async function createShareLink(
  listId: string,
  permissions: 'viewer' | 'editor' = 'viewer',
  expiresInDays?: number
): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { error } = await supabase.from('share_links').insert({
    list_id: listId,
    token,
    permissions,
    expires_at: expiresAt,
  });

  if (error) throw error;

  return `${window.location.origin}/list/${listId}?token=${token}`;
}

/**
 * Create invite code
 */
export async function createInviteCode(
  listId: string,
  permissions: 'viewer' | 'editor' = 'viewer'
): Promise<string> {
  const code = generateInviteCode();

  const { error } = await supabase.from('invitations').insert({
    list_id: listId,
    code,
    default_permissions: permissions,
  });

  if (error) throw error;

  return code;
}

/**
 * Join list with invite code
 */
export async function joinWithInviteCode(
  code: string,
  userId: string
): Promise<void> {
  // Verify code
  const { data: invitation, error: codeError } = await supabase
    .from('invitations')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('active', true)
    .single();

  if (codeError || !invitation) {
    throw new Error('Invalid or expired invite code');
  }

  // Check if already member
  const { data: existing } = await supabase
    .from('list_members')
    .select()
    .eq('list_id', invitation.list_id)
    .eq('user_id', userId)
    .single();

  if (existing) {
    throw new Error('You are already a member of this list');
  }

  // Add as member
  const { error: memberError } = await supabase.from('list_members').insert({
    list_id: invitation.list_id,
    user_id: userId,
    permission: invitation.default_permissions,
  });

  if (memberError) throw memberError;

  // Increment use count
  await supabase
    .from('invitations')
    .update({ use_count: invitation.use_count + 1 })
    .eq('id', invitation.id);
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateUserColor(userId: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
  ];

  // Generate consistent color based on user ID
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
  return Array(6)
    .fill(0)
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join('');
}

// ============================================================================
// React Component Example
// ============================================================================

/**
 * Example: Wishlist Items Component with Real-time Updates
 */
export function WishlistItems({ listId, currentUser }: { listId: string; currentUser: any }) {
  const { items, loading, error } = useRealtimeItems(listId);
  const { presence } = usePresence(listId, currentUser);
  const activities = useActivityFeed(listId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {/* Presence indicators */}
      <div className="presence-bar">
        {presence.map((user) => (
          <div key={user.user_id} className="avatar" style={{ borderColor: user.color }}>
            <img src={user.avatar_url} alt={user.user_name} />
            <span className="status-dot" />
          </div>
        ))}
      </div>

      {/* Items list */}
      <div className="items-list">
        {items.map((item) => (
          <div key={item.id} className="item-card">
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            {item.purchased && <span className="badge">Purchased</span>}
          </div>
        ))}
      </div>

      {/* Activity feed */}
      <div className="activity-feed">
        {activities.map((activity) => (
          <div key={activity.id} className="activity-item">
            {activity.action}
          </div>
        ))}
      </div>
    </div>
  );
}

export default {
  useRealtimeItems,
  usePresence,
  useActivityFeed,
  createItem,
  updateItem,
  deleteItem,
  markAsPurchased,
  createShareLink,
  createInviteCode,
  joinWithInviteCode,
};
