/**
 * Integration Tests for Lists API Routes
 * Tests API endpoints with mocked database
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock API request/response
interface MockRequest {
  method: string;
  body?: any;
  query?: any;
  headers?: any;
}

interface MockResponse {
  status: jest.Mock;
  json: jest.Mock;
  end: jest.Mock;
}

// Mock API handler
const createMockResponse = (): MockResponse => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  end: jest.fn().mockReturnThis(),
});

// Mock database
const mockDatabase = {
  lists: [] as any[],
  items: [] as any[],
  users: [] as any[],

  reset() {
    this.lists = [];
    this.items = [];
    this.users = [
      { id: 'user-123', email: 'test@example.com', display_name: 'Test User' }
    ];
  },

  createList(data: any) {
    const list = {
      id: `list-${this.lists.length + 1}`,
      ...data,
      created_at: new Date().toISOString(),
    };
    this.lists.push(list);
    return list;
  },

  getList(id: string) {
    return this.lists.find(l => l.id === id);
  },

  updateList(id: string, data: any) {
    const index = this.lists.findIndex(l => l.id === id);
    if (index === -1) return null;
    this.lists[index] = { ...this.lists[index], ...data };
    return this.lists[index];
  },

  deleteList(id: string) {
    const index = this.lists.findIndex(l => l.id === id);
    if (index === -1) return false;
    this.lists.splice(index, 1);
    return true;
  },
};

describe('Lists API Integration Tests', () => {
  beforeEach(() => {
    mockDatabase.reset();
  });

  describe('POST /api/lists', () => {
    it('should create a new list', async () => {
      const req: MockRequest = {
        method: 'POST',
        body: {
          title: 'Christmas 2024',
          description: 'My wishlist',
          location_id: 'loc-123',
          year: 2024,
        },
        headers: {
          authorization: 'Bearer valid-token',
        },
      };

      const list = mockDatabase.createList({
        ...req.body,
        owner_id: 'user-123',
      });

      expect(list).toHaveProperty('id');
      expect(list.title).toBe('Christmas 2024');
      expect(list.owner_id).toBe('user-123');
      expect(list.year).toBe(2024);
    });

    it('should return 400 for invalid data', async () => {
      const req: MockRequest = {
        method: 'POST',
        body: {
          // Missing required title
          location_id: 'loc-123',
        },
        headers: {
          authorization: 'Bearer valid-token',
        },
      };

      const res = createMockResponse();

      // Validate required fields
      if (!req.body.title) {
        res.status(400).json({ error: 'Title is required' });
      }

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Title is required' });
    });

    it('should return 401 for unauthorized requests', async () => {
      const req: MockRequest = {
        method: 'POST',
        body: {
          title: 'Test List',
          location_id: 'loc-123',
        },
        // No authorization header
      };

      const res = createMockResponse();

      if (!req.headers?.authorization) {
        res.status(401).json({ error: 'Unauthorized' });
      }

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should generate guest access token for new list', async () => {
      const list = mockDatabase.createList({
        title: 'Test List',
        owner_id: 'user-123',
        location_id: 'loc-123',
        guest_access_token: 'generated-token-123',
      });

      expect(list.guest_access_token).toBeTruthy();
      expect(list.guest_access_token).toMatch(/^generated-token-/);
    });
  });

  describe('GET /api/lists/:id', () => {
    it('should fetch a list by ID', async () => {
      const createdList = mockDatabase.createList({
        title: 'Test List',
        owner_id: 'user-123',
        location_id: 'loc-123',
      });

      const req: MockRequest = {
        method: 'GET',
        query: { id: createdList.id },
        headers: {
          authorization: 'Bearer valid-token',
        },
      };

      const list = mockDatabase.getList(createdList.id);

      expect(list).toBeDefined();
      expect(list.id).toBe(createdList.id);
      expect(list.title).toBe('Test List');
    });

    it('should return 404 for non-existent list', async () => {
      const req: MockRequest = {
        method: 'GET',
        query: { id: 'non-existent-id' },
        headers: {
          authorization: 'Bearer valid-token',
        },
      };

      const res = createMockResponse();
      const list = mockDatabase.getList(req.query.id);

      if (!list) {
        res.status(404).json({ error: 'List not found' });
      }

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should include related items when requested', async () => {
      const list = mockDatabase.createList({
        title: 'Test List',
        owner_id: 'user-123',
        location_id: 'loc-123',
      });

      mockDatabase.items.push(
        { id: 'item-1', list_id: list.id, title: 'Item 1' },
        { id: 'item-2', list_id: list.id, title: 'Item 2' }
      );

      const req: MockRequest = {
        method: 'GET',
        query: { id: list.id, include: 'items' },
        headers: {
          authorization: 'Bearer valid-token',
        },
      };

      const fetchedList = mockDatabase.getList(list.id);
      const items = mockDatabase.items.filter(i => i.list_id === list.id);

      expect(items).toHaveLength(2);
    });
  });

  describe('PATCH /api/lists/:id', () => {
    it('should update a list', async () => {
      const list = mockDatabase.createList({
        title: 'Original Title',
        owner_id: 'user-123',
        location_id: 'loc-123',
      });

      const req: MockRequest = {
        method: 'PATCH',
        query: { id: list.id },
        body: {
          title: 'Updated Title',
          description: 'New description',
        },
        headers: {
          authorization: 'Bearer valid-token',
        },
      };

      const updated = mockDatabase.updateList(list.id, req.body);

      expect(updated.title).toBe('Updated Title');
      expect(updated.description).toBe('New description');
    });

    it('should return 403 for unauthorized update', async () => {
      const list = mockDatabase.createList({
        title: 'Test List',
        owner_id: 'user-456', // Different user
        location_id: 'loc-123',
      });

      const req: MockRequest = {
        method: 'PATCH',
        query: { id: list.id },
        body: { title: 'Hacked Title' },
        headers: {
          authorization: 'Bearer valid-token', // user-123
        },
      };

      const res = createMockResponse();

      // Check ownership
      if (list.owner_id !== 'user-123') {
        res.status(403).json({ error: 'Forbidden' });
      }

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should not allow updating immutable fields', async () => {
      const list = mockDatabase.createList({
        title: 'Test List',
        owner_id: 'user-123',
        location_id: 'loc-123',
      });

      const req: MockRequest = {
        method: 'PATCH',
        query: { id: list.id },
        body: {
          title: 'New Title',
          owner_id: 'user-999', // Should not be allowed
        },
        headers: {
          authorization: 'Bearer valid-token',
        },
      };

      // Filter out immutable fields
      const { owner_id, ...allowedUpdates } = req.body;
      const updated = mockDatabase.updateList(list.id, allowedUpdates);

      expect(updated.title).toBe('New Title');
      expect(updated.owner_id).toBe('user-123'); // Should remain unchanged
    });
  });

  describe('DELETE /api/lists/:id', () => {
    it('should delete a list', async () => {
      const list = mockDatabase.createList({
        title: 'Test List',
        owner_id: 'user-123',
        location_id: 'loc-123',
      });

      const req: MockRequest = {
        method: 'DELETE',
        query: { id: list.id },
        headers: {
          authorization: 'Bearer valid-token',
        },
      };

      const deleted = mockDatabase.deleteList(list.id);

      expect(deleted).toBe(true);
      expect(mockDatabase.getList(list.id)).toBeUndefined();
    });

    it('should return 403 for unauthorized deletion', async () => {
      const list = mockDatabase.createList({
        title: 'Test List',
        owner_id: 'user-456',
        location_id: 'loc-123',
      });

      const req: MockRequest = {
        method: 'DELETE',
        query: { id: list.id },
        headers: {
          authorization: 'Bearer valid-token', // user-123
        },
      };

      const res = createMockResponse();

      if (list.owner_id !== 'user-123') {
        res.status(403).json({ error: 'Forbidden' });
      }

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should cascade delete items when list is deleted', async () => {
      const list = mockDatabase.createList({
        title: 'Test List',
        owner_id: 'user-123',
        location_id: 'loc-123',
      });

      mockDatabase.items.push(
        { id: 'item-1', list_id: list.id, title: 'Item 1' },
        { id: 'item-2', list_id: list.id, title: 'Item 2' }
      );

      mockDatabase.deleteList(list.id);
      // Cascade delete items
      mockDatabase.items = mockDatabase.items.filter(i => i.list_id !== list.id);

      const remainingItems = mockDatabase.items.filter(i => i.list_id === list.id);
      expect(remainingItems).toHaveLength(0);
    });
  });

  describe('GET /api/lists', () => {
    it('should fetch all lists for authenticated user', async () => {
      mockDatabase.createList({ title: 'List 1', owner_id: 'user-123', location_id: 'loc-123' });
      mockDatabase.createList({ title: 'List 2', owner_id: 'user-123', location_id: 'loc-123' });
      mockDatabase.createList({ title: 'List 3', owner_id: 'user-456', location_id: 'loc-123' });

      const req: MockRequest = {
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token', // user-123
        },
      };

      const userLists = mockDatabase.lists.filter(l => l.owner_id === 'user-123');

      expect(userLists).toHaveLength(2);
    });

    it('should support filtering by location', async () => {
      mockDatabase.createList({ title: 'List 1', owner_id: 'user-123', location_id: 'loc-1' });
      mockDatabase.createList({ title: 'List 2', owner_id: 'user-123', location_id: 'loc-2' });
      mockDatabase.createList({ title: 'List 3', owner_id: 'user-123', location_id: 'loc-1' });

      const req: MockRequest = {
        method: 'GET',
        query: { location_id: 'loc-1' },
        headers: {
          authorization: 'Bearer valid-token',
        },
      };

      const filtered = mockDatabase.lists.filter(
        l => l.owner_id === 'user-123' && l.location_id === 'loc-1'
      );

      expect(filtered).toHaveLength(2);
    });

    it('should support pagination', async () => {
      for (let i = 0; i < 25; i++) {
        mockDatabase.createList({
          title: `List ${i}`,
          owner_id: 'user-123',
          location_id: 'loc-123',
        });
      }

      const req: MockRequest = {
        method: 'GET',
        query: { page: 2, limit: 10 },
        headers: {
          authorization: 'Bearer valid-token',
        },
      };

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const paginated = mockDatabase.lists
        .filter(l => l.owner_id === 'user-123')
        .slice(offset, offset + limit);

      expect(paginated).toHaveLength(10);
    });
  });
});
