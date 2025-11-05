/**
 * Offline-First PWA Implementation for Christmas Wishlist App
 *
 * This file demonstrates how to implement offline support using:
 * - Service Workers for caching
 * - IndexedDB for local storage (via Dexie.js)
 * - Optimistic updates
 * - Background sync
 */

import Dexie, { Table } from 'dexie';
import { useEffect, useState } from 'react';

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
  priority: number;
  position: number;
  created_at: string;
  updated_at: string;
  sync_status: 'synced' | 'pending' | 'error';
}

interface PendingOperation {
  id?: number;
  type: 'create' | 'update' | 'delete';
  entity: 'item' | 'list' | 'member';
  entity_id?: string;
  data: any;
  timestamp: number;
  retry_count: number;
  error_message?: string;
}

interface CachedList {
  id: string;
  title: string;
  description: string;
  cached_at: number;
}

// ============================================================================
// IndexedDB Setup with Dexie
// ============================================================================

class WishlistDB extends Dexie {
  items!: Table<WishlistItem, string>;
  pending_ops!: Table<PendingOperation, number>;
  cached_lists!: Table<CachedList, string>;

  constructor() {
    super('WishlistDB');

    this.version(1).stores({
      items: 'id, list_id, sync_status, updated_at',
      pending_ops: '++id, type, entity, timestamp',
      cached_lists: 'id, cached_at',
    });
  }
}

export const db = new WishlistDB();

// ============================================================================
// Offline Detection
// ============================================================================

class ConnectionManager {
  private listeners: Set<(online: boolean) => void> = new Set();
  private _isOnline: boolean = navigator.onLine;

  constructor() {
    window.addEventListener('online', () => this.setOnlineStatus(true));
    window.addEventListener('offline', () => this.setOnlineStatus(false));

    // Poll for real connectivity (not just network interface)
    setInterval(() => this.checkRealConnectivity(), 30000);
  }

  private async checkRealConnectivity() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeout);
      this.setOnlineStatus(response.ok);
    } catch {
      this.setOnlineStatus(false);
    }
  }

  private setOnlineStatus(online: boolean) {
    if (this._isOnline !== online) {
      this._isOnline = online;
      this.listeners.forEach((fn) => fn(online));

      if (online) {
        this.onReconnect();
      }
    }
  }

  private async onReconnect() {
    console.log('Back online! Syncing...');
    await syncManager.syncAll();
  }

  get isOnline() {
    return this._isOnline;
  }

  subscribe(fn: (online: boolean) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const connectionManager = new ConnectionManager();

// ============================================================================
// Optimistic Update Manager
// ============================================================================

class OptimisticUpdateManager {
  /**
   * Create item with optimistic update
   */
  async createItem(item: Omit<WishlistItem, 'id' | 'created_at' | 'updated_at' | 'sync_status'>) {
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const newItem: WishlistItem = {
      ...item,
      id: tempId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    // 1. Store in IndexedDB immediately
    await db.items.add(newItem);

    // 2. Queue for sync
    await db.pending_ops.add({
      type: 'create',
      entity: 'item',
      data: newItem,
      timestamp: Date.now(),
      retry_count: 0,
    });

    // 3. Attempt sync if online
    if (connectionManager.isOnline) {
      this.syncPendingOperations();
    }

    return newItem;
  }

  /**
   * Update item with optimistic update
   */
  async updateItem(itemId: string, updates: Partial<WishlistItem>) {
    // 1. Apply to local DB immediately
    await db.items.update(itemId, {
      ...updates,
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
    });

    // 2. Queue for sync
    await db.pending_ops.add({
      type: 'update',
      entity: 'item',
      entity_id: itemId,
      data: updates,
      timestamp: Date.now(),
      retry_count: 0,
    });

    // 3. Attempt sync
    if (connectionManager.isOnline) {
      this.syncPendingOperations();
    }
  }

  /**
   * Delete item with optimistic update
   */
  async deleteItem(itemId: string) {
    // 1. Mark as deleted locally (soft delete)
    await db.items.update(itemId, {
      sync_status: 'pending',
    });

    // 2. Queue for sync
    await db.pending_ops.add({
      type: 'delete',
      entity: 'item',
      entity_id: itemId,
      data: { id: itemId },
      timestamp: Date.now(),
      retry_count: 0,
    });

    // 3. Attempt sync
    if (connectionManager.isOnline) {
      this.syncPendingOperations();
    }
  }

  /**
   * Sync all pending operations
   */
  async syncPendingOperations() {
    const pending = await db.pending_ops.orderBy('timestamp').toArray();

    for (const op of pending) {
      try {
        await this.syncOperation(op);
      } catch (error) {
        console.error('Sync failed for operation:', op, error);

        // Retry logic
        if (op.retry_count < 3) {
          await db.pending_ops.update(op.id!, {
            retry_count: op.retry_count + 1,
            error_message: error instanceof Error ? error.message : 'Unknown error',
          });
        } else {
          // Mark as error after 3 retries
          if (op.entity_id) {
            await db.items.update(op.entity_id, {
              sync_status: 'error',
            });
          }
        }
      }
    }
  }

  /**
   * Sync single operation
   */
  private async syncOperation(op: PendingOperation) {
    let result;

    switch (op.type) {
      case 'create':
        result = await this.syncCreate(op);
        break;
      case 'update':
        result = await this.syncUpdate(op);
        break;
      case 'delete':
        result = await this.syncDelete(op);
        break;
    }

    // Remove from pending queue
    await db.pending_ops.delete(op.id!);

    return result;
  }

  private async syncCreate(op: PendingOperation) {
    const response = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(op.data),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const serverItem = await response.json();

    // Update local item with server ID
    await db.items.delete(op.data.id); // Remove temp ID
    await db.items.add({
      ...serverItem,
      sync_status: 'synced',
    });

    return serverItem;
  }

  private async syncUpdate(op: PendingOperation) {
    const response = await fetch(`/api/items/${op.entity_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(op.data),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const serverItem = await response.json();

    // Update local item
    await db.items.update(op.entity_id!, {
      ...serverItem,
      sync_status: 'synced',
    });

    return serverItem;
  }

  private async syncDelete(op: PendingOperation) {
    const response = await fetch(`/api/items/${op.entity_id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    // Remove from local DB
    await db.items.delete(op.entity_id!);
  }
}

export const optimisticManager = new OptimisticUpdateManager();

// ============================================================================
// Sync Manager (Background Sync)
// ============================================================================

class SyncManager {
  async syncAll() {
    console.log('Starting full sync...');

    try {
      // 1. Sync pending operations
      await optimisticManager.syncPendingOperations();

      // 2. Fetch fresh data from server
      await this.refreshFromServer();

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }

  async refreshFromServer() {
    // Get all cached list IDs
    const cachedLists = await db.cached_lists.toArray();

    for (const list of cachedLists) {
      try {
        const response = await fetch(`/api/lists/${list.id}/items`);
        if (!response.ok) continue;

        const serverItems = await response.json();

        // Merge server data with local data
        for (const serverItem of serverItems) {
          const localItem = await db.items.get(serverItem.id);

          if (!localItem || localItem.sync_status === 'synced') {
            // Server data is newer or local doesn't exist
            await db.items.put({
              ...serverItem,
              sync_status: 'synced',
            });
          }
          // If local has pending changes, keep local version
        }

        // Update cache timestamp
        await db.cached_lists.update(list.id, {
          cached_at: Date.now(),
        });
      } catch (error) {
        console.error(`Failed to refresh list ${list.id}:`, error);
      }
    }
  }

  async registerBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      try {
        await registration.sync.register('sync-wishlist');
        console.log('Background sync registered');
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  }
}

export const syncManager = new SyncManager();

// ============================================================================
// Cache Manager
// ============================================================================

class CacheManager {
  async cacheList(listId: string, items: WishlistItem[]) {
    // Store items in IndexedDB
    await db.items.bulkPut(
      items.map((item) => ({
        ...item,
        sync_status: 'synced',
      }))
    );

    // Mark list as cached
    await db.cached_lists.put({
      id: listId,
      title: '', // Populate from list data
      description: '',
      cached_at: Date.now(),
    });
  }

  async getCachedItems(listId: string): Promise<WishlistItem[]> {
    return await db.items.where({ list_id: listId }).toArray();
  }

  async clearCache() {
    await db.items.clear();
    await db.cached_lists.clear();
  }

  async getCacheSize(): Promise<number> {
    const itemCount = await db.items.count();
    const opCount = await db.pending_ops.count();
    return itemCount + opCount;
  }
}

export const cacheManager = new CacheManager();

// ============================================================================
// React Hooks
// ============================================================================

/**
 * Hook: Monitor online status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(connectionManager.isOnline);

  useEffect(() => {
    return connectionManager.subscribe(setIsOnline);
  }, []);

  return isOnline;
}

/**
 * Hook: Get items from cache with automatic sync
 */
export function useOfflineItems(listId: string) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (!listId) return;

    // Load from cache immediately
    const loadFromCache = async () => {
      const cached = await cacheManager.getCachedItems(listId);
      setItems(cached);
      setLoading(false);
    };

    loadFromCache();

    // Sync with server if online
    if (isOnline) {
      const syncWithServer = async () => {
        setSyncing(true);
        try {
          await syncManager.refreshFromServer();
          const updated = await cacheManager.getCachedItems(listId);
          setItems(updated);
        } catch (error) {
          console.error('Sync failed:', error);
        } finally {
          setSyncing(false);
        }
      };

      syncWithServer();
    }

    // Watch for changes in IndexedDB
    const watchChanges = async () => {
      db.items.hook('creating', () => {
        loadFromCache();
      });
      db.items.hook('updating', () => {
        loadFromCache();
      });
      db.items.hook('deleting', () => {
        loadFromCache();
      });
    };

    watchChanges();
  }, [listId, isOnline]);

  return { items, loading, syncing };
}

/**
 * Hook: Get pending operations count
 */
export function usePendingOperations() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const updateCount = async () => {
      const pending = await db.pending_ops.count();
      setCount(pending);
    };

    updateCount();

    // Poll for changes
    const interval = setInterval(updateCount, 5000);
    return () => clearInterval(interval);
  }, []);

  return count;
}

// ============================================================================
// Service Worker Registration
// ============================================================================

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered:', registration);

      // Register for background sync
      await syncManager.registerBackgroundSync();

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
}

// ============================================================================
// React Component Example
// ============================================================================

export function OfflineWishlistItems({ listId }: { listId: string }) {
  const { items, loading, syncing } = useOfflineItems(listId);
  const isOnline = useOnlineStatus();
  const pendingCount = usePendingOperations();

  const handleAddItem = async (name: string) => {
    await optimisticManager.createItem({
      list_id: listId,
      name,
      description: '',
      purchased: false,
      priority: 3,
      position: items.length,
    });
  };

  const handleTogglePurchased = async (itemId: string, purchased: boolean) => {
    await optimisticManager.updateItem(itemId, { purchased: !purchased });
  };

  const handleDelete = async (itemId: string) => {
    await optimisticManager.deleteItem(itemId);
  };

  return (
    <div>
      {/* Offline indicator */}
      {!isOnline && (
        <div className="offline-banner">
          <span>You're offline</span>
          {pendingCount > 0 && (
            <span>{pendingCount} changes will sync when you reconnect</span>
          )}
        </div>
      )}

      {/* Syncing indicator */}
      {syncing && (
        <div className="sync-indicator">
          <span>Syncing...</span>
        </div>
      )}

      {/* Items list */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {items.map((item) => (
            <div key={item.id} className={`item ${item.sync_status}`}>
              <h3>{item.name}</h3>
              {item.sync_status === 'pending' && <span className="badge">Syncing...</span>}
              {item.sync_status === 'error' && <span className="badge error">Sync Error</span>}
              <button onClick={() => handleTogglePurchased(item.id, item.purchased)}>
                {item.purchased ? 'Unmark' : 'Mark Purchased'}
              </button>
              <button onClick={() => handleDelete(item.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}

      {/* Add item form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem('itemName') as HTMLInputElement;
          handleAddItem(input.value);
          input.value = '';
        }}
      >
        <input name="itemName" placeholder="Add item..." required />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default {
  db,
  connectionManager,
  optimisticManager,
  syncManager,
  cacheManager,
  registerServiceWorker,
  useOnlineStatus,
  useOfflineItems,
  usePendingOperations,
};
