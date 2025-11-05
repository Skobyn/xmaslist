/**
 * Unit Tests for Supabase Database Helper Functions
 * Tests database operations, queries, and error handling
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  },
  storage: {
    from: jest.fn(),
  },
};

// Database helper functions
class DatabaseHelpers {
  constructor(private supabase: any) {}

  async createList(userId: string, locationId: string, data: any) {
    const { data: list, error } = await this.supabase
      .from('lists')
      .insert({
        ...data,
        owner_id: userId,
        location_id: locationId,
      })
      .select()
      .single();

    if (error) throw error;
    return list;
  }

  async getListWithItems(listId: string, userId: string) {
    const { data: list, error } = await this.supabase
      .from('lists')
      .select(`
        *,
        items (*),
        location (*),
        owner:users (*)
      `)
      .eq('id', listId)
      .single();

    if (error) throw error;
    return list;
  }

  async addItemToList(listId: string, userId: string, itemData: any) {
    const { data: item, error } = await this.supabase
      .from('items')
      .insert({
        ...itemData,
        list_id: listId,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return item;
  }

  async purchaseItem(itemId: string, userId: string) {
    const { data: item, error } = await this.supabase
      .from('items')
      .update({
        is_purchased: true,
        purchased_by: userId,
        purchased_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return item;
  }

  async createShare(resourceType: string, resourceId: string, sharedBy: string, sharedWith: string, role: string) {
    const { data: share, error } = await this.supabase
      .from('shares')
      .insert({
        resource_type: resourceType,
        resource_id: resourceId,
        shared_by: sharedBy,
        shared_with: sharedWith,
        role: role,
      })
      .select()
      .single();

    if (error) throw error;
    return share;
  }
}

describe('Supabase Database Helpers', () => {
  let helpers: DatabaseHelpers;
  let mockFrom: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom = jest.fn();
    helpers = new DatabaseHelpers({ ...mockSupabase, from: mockFrom });
  });

  describe('createList', () => {
    it('should create a new list successfully', async () => {
      const mockList = {
        id: 'list-123',
        title: 'My Wishlist',
        owner_id: 'user-123',
        location_id: 'loc-123',
      };

      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockList, error: null }),
      });

      const result = await helpers.createList('user-123', 'loc-123', {
        title: 'My Wishlist',
      });

      expect(result).toEqual(mockList);
      expect(mockFrom).toHaveBeenCalledWith('lists');
    });

    it('should throw error if list creation fails', async () => {
      const mockError = new Error('Database error');

      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      });

      await expect(
        helpers.createList('user-123', 'loc-123', { title: 'Test' })
      ).rejects.toThrow('Database error');
    });

    it('should include owner_id and location_id in insert', async () => {
      const insertMock = jest.fn().mockReturnThis();

      mockFrom.mockReturnValue({
        insert: insertMock,
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: {}, error: null }),
      });

      await helpers.createList('user-123', 'loc-123', { title: 'Test' });

      expect(insertMock).toHaveBeenCalledWith({
        title: 'Test',
        owner_id: 'user-123',
        location_id: 'loc-123',
      });
    });
  });

  describe('getListWithItems', () => {
    it('should fetch list with nested relationships', async () => {
      const mockList = {
        id: 'list-123',
        title: 'My Wishlist',
        items: [
          { id: 'item-1', title: 'Item 1' },
          { id: 'item-2', title: 'Item 2' },
        ],
        location: { id: 'loc-123', name: "Mom's House" },
        owner: { id: 'user-123', display_name: 'John' },
      };

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockList, error: null }),
      });

      const result = await helpers.getListWithItems('list-123', 'user-123');

      expect(result).toEqual(mockList);
      expect(result.items).toHaveLength(2);
      expect(result.location).toBeDefined();
      expect(result.owner).toBeDefined();
    });

    it('should throw error if list not found', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('List not found')
        }),
      });

      await expect(
        helpers.getListWithItems('invalid-id', 'user-123')
      ).rejects.toThrow('List not found');
    });
  });

  describe('addItemToList', () => {
    it('should add item to list successfully', async () => {
      const mockItem = {
        id: 'item-123',
        title: 'Headphones',
        price: 99.99,
        list_id: 'list-123',
        created_by: 'user-123',
      };

      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockItem, error: null }),
      });

      const result = await helpers.addItemToList('list-123', 'user-123', {
        title: 'Headphones',
        price: 99.99,
      });

      expect(result).toEqual(mockItem);
      expect(result.list_id).toBe('list-123');
      expect(result.created_by).toBe('user-123');
    });

    it('should validate required fields', async () => {
      const insertMock = jest.fn().mockReturnThis();

      mockFrom.mockReturnValue({
        insert: insertMock,
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: {}, error: null }),
      });

      await helpers.addItemToList('list-123', 'user-123', {
        title: 'Test Item',
        price: 29.99,
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          list_id: 'list-123',
          created_by: 'user-123',
          title: 'Test Item',
          price: 29.99,
        })
      );
    });
  });

  describe('purchaseItem', () => {
    it('should mark item as purchased', async () => {
      const mockItem = {
        id: 'item-123',
        is_purchased: true,
        purchased_by: 'user-456',
        purchased_at: expect.any(String),
      };

      const updateMock = jest.fn().mockReturnThis();

      mockFrom.mockReturnValue({
        update: updateMock,
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockItem, error: null }),
      });

      const result = await helpers.purchaseItem('item-123', 'user-456');

      expect(result.is_purchased).toBe(true);
      expect(result.purchased_by).toBe('user-456');
      expect(result.purchased_at).toBeDefined();
    });

    it('should update purchased_at with current timestamp', async () => {
      const updateMock = jest.fn().mockReturnThis();

      mockFrom.mockReturnValue({
        update: updateMock,
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: {}, error: null }),
      });

      await helpers.purchaseItem('item-123', 'user-456');

      const updateCall = updateMock.mock.calls[0][0];
      expect(updateCall).toHaveProperty('purchased_at');
      expect(new Date(updateCall.purchased_at).getTime()).toBeGreaterThan(Date.now() - 1000);
    });
  });

  describe('createShare', () => {
    it('should create share with correct permissions', async () => {
      const mockShare = {
        id: 'share-123',
        resource_type: 'list',
        resource_id: 'list-123',
        shared_by: 'user-123',
        shared_with: 'user-456',
        role: 'editor',
      };

      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockShare, error: null }),
      });

      const result = await helpers.createShare(
        'list',
        'list-123',
        'user-123',
        'user-456',
        'editor'
      );

      expect(result).toEqual(mockShare);
      expect(result.role).toBe('editor');
    });

    it('should handle different resource types', async () => {
      const insertMock = jest.fn().mockReturnThis();

      mockFrom.mockReturnValue({
        insert: insertMock,
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: {}, error: null }),
      });

      await helpers.createShare('location', 'loc-123', 'user-1', 'user-2', 'viewer');

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          resource_type: 'location',
          resource_id: 'loc-123',
        })
      );
    });

    it('should handle different role types', async () => {
      const roles = ['viewer', 'editor', 'admin'];

      for (const role of roles) {
        const insertMock = jest.fn().mockReturnThis();

        mockFrom.mockReturnValue({
          insert: insertMock,
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: {}, error: null }),
        });

        await helpers.createShare('list', 'list-123', 'user-1', 'user-2', role);

        expect(insertMock).toHaveBeenCalledWith(
          expect.objectContaining({ role })
        );
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFrom.mockReturnValue({
        insert: jest.fn().mockRejectedValue(new Error('Network error')),
      });

      await expect(
        helpers.createList('user-123', 'loc-123', { title: 'Test' })
      ).rejects.toThrow();
    });

    it('should handle constraint violations', async () => {
      const constraintError = new Error('Unique constraint violation');

      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: constraintError }),
      });

      await expect(
        helpers.createList('user-123', 'loc-123', { title: 'Test' })
      ).rejects.toThrow('Unique constraint violation');
    });

    it('should handle permission errors', async () => {
      const permissionError = new Error('Insufficient permissions');

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: permissionError }),
      });

      await expect(
        helpers.getListWithItems('list-123', 'user-123')
      ).rejects.toThrow('Insufficient permissions');
    });
  });
});
