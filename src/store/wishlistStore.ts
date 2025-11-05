/**
 * Wishlist Store - Zustand State Management
 * Global state for wishlist application with persistence
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  WishlistItem,
  WishList,
  Location,
  User,
  WishlistFilters,
  SortOption,
} from '@/types/wishlist';

// ============================================================================
// Store State Interface
// ============================================================================

interface WishlistState {
  // User State
  user: User | null;
  isAuthenticated: boolean;

  // Data State
  locations: Location[];
  lists: WishList[];
  items: WishlistItem[];

  // UI State
  selectedLocation: Location | null;
  selectedList: WishList | null;
  selectedItem: WishlistItem | null;

  // Modal State
  isAuthDialogOpen: boolean;
  isAddLocationDialogOpen: boolean;
  isAddListDialogOpen: boolean;
  isAddItemDialogOpen: boolean;
  isItemModalOpen: boolean;

  // Filter and Sort State
  filters: WishlistFilters;
  sortBy: SortOption;

  // Loading State
  isLoading: boolean;
  error: string | null;

  // ============================================================================
  // User Actions
  // ============================================================================

  setUser: (user: User | null) => void;
  logout: () => void;

  // ============================================================================
  // Location Actions
  // ============================================================================

  setLocations: (locations: Location[]) => void;
  addLocation: (location: Location) => void;
  updateLocation: (id: string, updates: Partial<Location>) => void;
  deleteLocation: (id: string) => void;
  setSelectedLocation: (location: Location | null) => void;

  // ============================================================================
  // List Actions
  // ============================================================================

  setLists: (lists: WishList[]) => void;
  addList: (list: WishList) => void;
  updateList: (id: string, updates: Partial<WishList>) => void;
  deleteList: (id: string) => void;
  setSelectedList: (list: WishList | null) => void;

  // ============================================================================
  // Item Actions
  // ============================================================================

  setItems: (items: WishlistItem[]) => void;
  addItem: (item: WishlistItem) => void;
  updateItem: (id: string, updates: Partial<WishlistItem>) => void;
  deleteItem: (id: string) => void;
  toggleItemPurchased: (id: string) => void;
  setSelectedItem: (item: WishlistItem | null) => void;
  reorderItems: (startIndex: number, endIndex: number) => void;

  // ============================================================================
  // Modal Actions
  // ============================================================================

  openAuthDialog: () => void;
  closeAuthDialog: () => void;
  openAddLocationDialog: () => void;
  closeAddLocationDialog: () => void;
  openAddListDialog: () => void;
  closeAddListDialog: () => void;
  openAddItemDialog: () => void;
  closeAddItemDialog: () => void;
  openItemModal: (item: WishlistItem) => void;
  closeItemModal: () => void;

  // ============================================================================
  // Filter and Sort Actions
  // ============================================================================

  setFilters: (filters: Partial<WishlistFilters>) => void;
  resetFilters: () => void;
  setSortBy: (sortBy: SortOption) => void;

  // ============================================================================
  // Loading Actions
  // ============================================================================

  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // ============================================================================
  // Computed Values
  // ============================================================================

  getFilteredItems: () => WishlistItem[];
  getListStatistics: (listId: string) => {
    totalItems: number;
    purchasedItems: number;
    totalValue: number;
    purchasedValue: number;
  };
}

// ============================================================================
// Initial State
// ============================================================================

const initialFilters: WishlistFilters = {
  search: '',
  category: undefined,
  priceRange: undefined,
  priority: 'all',
  purchased: undefined,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useWishlistStore = create<WishlistState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial State
        user: null,
        isAuthenticated: false,
        locations: [],
        lists: [],
        items: [],
        selectedLocation: null,
        selectedList: null,
        selectedItem: null,
        isAuthDialogOpen: false,
        isAddLocationDialogOpen: false,
        isAddListDialogOpen: false,
        isAddItemDialogOpen: false,
        isItemModalOpen: false,
        filters: initialFilters,
        sortBy: 'date',
        isLoading: false,
        error: null,

        // ========================================================================
        // User Actions
        // ========================================================================

        setUser: (user) =>
          set((state) => {
            state.user = user;
            state.isAuthenticated = !!user;
          }),

        logout: () =>
          set((state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.locations = [];
            state.lists = [];
            state.items = [];
          }),

        // ========================================================================
        // Location Actions
        // ========================================================================

        setLocations: (locations) =>
          set((state) => {
            state.locations = locations;
          }),

        addLocation: (location) =>
          set((state) => {
            state.locations.push(location);
          }),

        updateLocation: (id, updates) =>
          set((state) => {
            const location = state.locations.find((l) => l.id === id);
            if (location) {
              Object.assign(location, updates);
            }
          }),

        deleteLocation: (id) =>
          set((state) => {
            state.locations = state.locations.filter((l) => l.id !== id);
            if (state.selectedLocation?.id === id) {
              state.selectedLocation = null;
            }
          }),

        setSelectedLocation: (location) =>
          set({ selectedLocation: location }),

        // ========================================================================
        // List Actions
        // ========================================================================

        setLists: (lists) =>
          set((state) => {
            state.lists = lists;
          }),

        addList: (list) =>
          set((state) => {
            state.lists.push(list);
          }),

        updateList: (id, updates) =>
          set((state) => {
            const list = state.lists.find((l) => l.id === id);
            if (list) {
              Object.assign(list, updates);
            }
          }),

        deleteList: (id) =>
          set((state) => {
            state.lists = state.lists.filter((l) => l.id !== id);
            if (state.selectedList?.id === id) {
              state.selectedList = null;
            }
          }),

        setSelectedList: (list) => set({ selectedList: list }),

        // ========================================================================
        // Item Actions
        // ========================================================================

        setItems: (items) =>
          set((state) => {
            state.items = items;
          }),

        addItem: (item) =>
          set((state) => {
            state.items.push(item);
          }),

        updateItem: (id, updates) =>
          set((state) => {
            const item = state.items.find((i) => i.id === id);
            if (item) {
              Object.assign(item, updates);
            }
          }),

        deleteItem: (id) =>
          set((state) => {
            state.items = state.items.filter((i) => i.id !== id);
            if (state.selectedItem?.id === id) {
              state.selectedItem = null;
            }
          }),

        toggleItemPurchased: (id) =>
          set((state) => {
            const item = state.items.find((i) => i.id === id);
            if (item) {
              item.is_purchased = !item.is_purchased;
              if (item.is_purchased) {
                item.purchased_at = new Date().toISOString();
                item.purchased_by = state.user?.id;
              } else {
                item.purchased_at = undefined;
                item.purchased_by = undefined;
              }
            }
          }),

        setSelectedItem: (item) => set({ selectedItem: item }),

        reorderItems: (startIndex, endIndex) =>
          set((state) => {
            const [removed] = state.items.splice(startIndex, 1);
            state.items.splice(endIndex, 0, removed);
          }),

        // ========================================================================
        // Modal Actions
        // ========================================================================

        openAuthDialog: () => set({ isAuthDialogOpen: true }),
        closeAuthDialog: () => set({ isAuthDialogOpen: false }),
        openAddLocationDialog: () => set({ isAddLocationDialogOpen: true }),
        closeAddLocationDialog: () => set({ isAddLocationDialogOpen: false }),
        openAddListDialog: () => set({ isAddListDialogOpen: true }),
        closeAddListDialog: () => set({ isAddListDialogOpen: false }),
        openAddItemDialog: () => set({ isAddItemDialogOpen: true }),
        closeAddItemDialog: () => set({ isAddItemDialogOpen: false }),

        openItemModal: (item) =>
          set({
            selectedItem: item,
            isItemModalOpen: true,
          }),

        closeItemModal: () =>
          set({
            selectedItem: null,
            isItemModalOpen: false,
          }),

        // ========================================================================
        // Filter and Sort Actions
        // ========================================================================

        setFilters: (filters) =>
          set((state) => {
            state.filters = { ...state.filters, ...filters };
          }),

        resetFilters: () =>
          set({
            filters: initialFilters,
          }),

        setSortBy: (sortBy) => set({ sortBy }),

        // ========================================================================
        // Loading Actions
        // ========================================================================

        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),

        // ========================================================================
        // Computed Values
        // ========================================================================

        getFilteredItems: () => {
          const { items, filters, sortBy } = get();
          let filtered = [...items];

          // Apply search filter
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(
              (item) =>
                item.title.toLowerCase().includes(searchLower) ||
                item.description?.toLowerCase().includes(searchLower)
            );
          }

          // Apply category filter
          if (filters.category) {
            filtered = filtered.filter((item) => item.category === filters.category);
          }

          // Apply price range filter
          if (filters.priceRange) {
            filtered = filtered.filter(
              (item) =>
                item.price !== undefined &&
                item.price >= filters.priceRange![0] &&
                item.price <= filters.priceRange![1]
            );
          }

          // Apply priority filter
          if (filters.priority && filters.priority !== 'all') {
            filtered = filtered.filter((item) => item.priority === filters.priority);
          }

          // Apply purchased filter
          if (filters.purchased !== undefined) {
            filtered = filtered.filter((item) => item.is_purchased === filters.purchased);
          }

          // Apply sorting
          filtered.sort((a, b) => {
            switch (sortBy) {
              case 'date':
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              case 'price-asc':
                return (a.price || 0) - (b.price || 0);
              case 'price-desc':
                return (b.price || 0) - (a.price || 0);
              case 'priority': {
                const priorities = { high: 3, medium: 2, low: 1 };
                return priorities[b.priority] - priorities[a.priority];
              }
              case 'title':
                return a.title.localeCompare(b.title);
              default:
                return 0;
            }
          });

          return filtered;
        },

        getListStatistics: (listId) => {
          const items = get().items.filter((item) => item.list_id === listId);

          return {
            totalItems: items.length,
            purchasedItems: items.filter((item) => item.is_purchased).length,
            totalValue: items.reduce((sum, item) => sum + (item.price || 0), 0),
            purchasedValue: items
              .filter((item) => item.is_purchased)
              .reduce((sum, item) => sum + (item.price || 0), 0),
          };
        },
      })),
      {
        name: 'wishlist-storage',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          filters: state.filters,
          sortBy: state.sortBy,
        }),
      }
    )
  )
);

// ============================================================================
// Selector Hooks (for optimized re-renders)
// ============================================================================

export const useUser = () => useWishlistStore((state) => state.user);
export const useIsAuthenticated = () => useWishlistStore((state) => state.isAuthenticated);
export const useLocations = () => useWishlistStore((state) => state.locations);
export const useLists = () => useWishlistStore((state) => state.lists);
export const useItems = () => useWishlistStore((state) => state.items);
export const useFilteredItems = () => useWishlistStore((state) => state.getFilteredItems());
export const useSelectedLocation = () => useWishlistStore((state) => state.selectedLocation);
export const useSelectedList = () => useWishlistStore((state) => state.selectedList);
export const useSelectedItem = () => useWishlistStore((state) => state.selectedItem);
