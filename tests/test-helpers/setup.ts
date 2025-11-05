/**
 * Test Setup Helpers
 * Utilities for test data generation and setup
 */

export const generateMockUser = (overrides = {}) => ({
  id: `user-${Math.random().toString(36).substr(2, 9)}`,
  email: `user-${Math.random().toString(36).substr(2, 5)}@example.com`,
  display_name: 'Test User',
  avatar_url: null,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const generateMockLocation = (userId: string, overrides = {}) => ({
  id: `loc-${Math.random().toString(36).substr(2, 9)}`,
  name: "Test Location",
  description: "Test location description",
  owner_id: userId,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const generateMockList = (locationId: string, userId: string, overrides = {}) => ({
  id: `list-${Math.random().toString(36).substr(2, 9)}`,
  title: "Test Wishlist",
  description: "Test wishlist description",
  location_id: locationId,
  owner_id: userId,
  year: new Date().getFullYear(),
  is_active: true,
  is_public: false,
  guest_access_token: `token-${Math.random().toString(36).substr(2, 16)}`,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const generateMockItem = (listId: string, userId: string, overrides = {}) => ({
  id: `item-${Math.random().toString(36).substr(2, 9)}`,
  list_id: listId,
  title: "Test Item",
  description: "Test item description",
  price: 29.99,
  currency: "USD",
  url: "https://example.com/product",
  image_url: "https://example.com/image.jpg",
  is_purchased: false,
  purchased_by: null,
  purchased_at: null,
  priority: "medium",
  created_by: userId,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const generateMockShare = (resourceId: string, sharedBy: string, sharedWith: string, overrides = {}) => ({
  id: `share-${Math.random().toString(36).substr(2, 9)}`,
  resource_type: "list",
  resource_id: resourceId,
  shared_by: sharedBy,
  shared_with: sharedWith,
  role: "viewer",
  created_at: new Date().toISOString(),
  expires_at: null,
  ...overrides,
});

export const createTestDatabase = () => {
  const users: any[] = [];
  const locations: any[] = [];
  const lists: any[] = [];
  const items: any[] = [];
  const shares: any[] = [];

  return {
    users,
    locations,
    lists,
    items,
    shares,

    addUser: (userData = {}) => {
      const user = generateMockUser(userData);
      users.push(user);
      return user;
    },

    addLocation: (userId: string, locationData = {}) => {
      const location = generateMockLocation(userId, locationData);
      locations.push(location);
      return location;
    },

    addList: (locationId: string, userId: string, listData = {}) => {
      const list = generateMockList(locationId, userId, listData);
      lists.push(list);
      return list;
    },

    addItem: (listId: string, userId: string, itemData = {}) => {
      const item = generateMockItem(listId, userId, itemData);
      items.push(item);
      return item;
    },

    addShare: (resourceId: string, sharedBy: string, sharedWith: string, shareData = {}) => {
      const share = generateMockShare(resourceId, sharedBy, sharedWith, shareData);
      shares.push(share);
      return share;
    },

    reset: () => {
      users.length = 0;
      locations.length = 0;
      lists.length = 0;
      items.length = 0;
      shares.length = 0;
    },
  };
};

export const waitFor = (condition: () => boolean, timeout = 5000, interval = 100): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, interval);
      }
    };

    check();
  });
};
