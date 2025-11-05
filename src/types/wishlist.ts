/**
 * TypeScript type definitions for the Christmas Wishlist application
 * Based on the REST API specification and frontend requirements
 */

// ============================================================================
// Core Domain Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  email_verified: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Location {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  owner?: User;
  member_count?: number;
  list_count?: number;
  is_archived: boolean;
  created_at: string;
  updated_at?: string;
  members?: LocationMember[];
  lists?: WishList[];
}

export interface LocationMember {
  user_id: string;
  user: User;
  role: 'viewer' | 'editor' | 'admin';
  added_at: string;
}

export interface WishList {
  id: string;
  title: string;
  description?: string;
  location_id: string;
  location?: Location;
  owner_id: string;
  owner?: User;
  year: number;
  is_active: boolean;
  is_public: boolean;
  guest_access_token?: string;
  theme_color?: string;
  item_count?: number;
  purchased_count?: number;
  total_value?: number;
  created_at: string;
  updated_at?: string;
  items?: WishlistItem[];
  statistics?: ListStatistics;
}

export interface WishlistItem {
  id: string;
  list_id: string;
  title: string;
  description?: string;
  price?: number;
  currency: string;
  url?: string;
  image_url?: string;
  thumbnail_url?: string;
  is_purchased: boolean;
  purchased_by?: string;
  purchased_at?: string;
  priority: ItemPriority;
  quantity: number;
  category?: string;
  tags?: string[];
  added_at?: number;
  created_by?: string;
  created_by_user?: User;
  created_at: string;
  updated_at?: string;
  specifications?: Record<string, string>;
  notes?: string;
}

export interface Share {
  id: string;
  resource_type: 'location' | 'list';
  resource_id: string;
  shared_by: string;
  shared_with: string;
  shared_with_user?: User;
  role: ShareRole;
  created_at: string;
  expires_at?: string;
}

export interface ListStatistics {
  total_items: number;
  purchased_items: number;
  total_value: number;
  purchased_value: number;
}

// ============================================================================
// Enums and Constants
// ============================================================================

export type ItemPriority = 'low' | 'medium' | 'high';

export type ShareRole = 'viewer' | 'editor' | 'admin';

export type SortOption = 'date' | 'price-asc' | 'price-desc' | 'priority' | 'title';

export const ITEM_PRIORITIES: ItemPriority[] = ['low', 'medium', 'high'];

export const SHARE_ROLES: ShareRole[] = ['viewer', 'editor', 'admin'];

// ============================================================================
// Filter and Search Types
// ============================================================================

export interface WishlistFilters {
  search: string;
  category?: string;
  priceRange?: [number, number];
  priority?: ItemPriority | 'all';
  purchased?: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationResponse;
  links?: {
    self: string;
    first: string;
    prev?: string;
    next?: string;
    last: string;
  };
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  display_name: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface CreateLocationRequest {
  name: string;
  description?: string;
}

export interface UpdateLocationRequest {
  name?: string;
  description?: string;
  is_archived?: boolean;
}

export interface CreateListRequest {
  title: string;
  description?: string;
  location_id: string;
  year: number;
  is_public?: boolean;
  theme_color?: string;
}

export interface UpdateListRequest {
  title?: string;
  description?: string;
  is_active?: boolean;
  is_public?: boolean;
  theme_color?: string;
}

export interface CreateItemRequest {
  list_id: string;
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  url?: string;
  priority?: ItemPriority;
  quantity?: number;
  category?: string;
  tags?: string[];
}

export interface UpdateItemRequest {
  title?: string;
  description?: string;
  price?: number;
  priority?: ItemPriority;
  quantity?: number;
  url?: string;
  notes?: string;
}

export interface CreateShareRequest {
  resource_type: 'location' | 'list';
  resource_id: string;
  shared_with: string;
  role: ShareRole;
  expires_at?: string;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface ModalState {
  isOpen: boolean;
  item: WishlistItem | null;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  isValid: boolean;
}

// ============================================================================
// Error Types
// ============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

export interface ApiErrorResponse {
  error: ApiError;
}

// ============================================================================
// WebSocket Event Types
// ============================================================================

export type WebSocketEventType =
  | 'item_created'
  | 'item_updated'
  | 'item_deleted'
  | 'item_purchased'
  | 'list_updated'
  | 'share_created'
  | 'share_deleted';

export interface WebSocketEvent<T = unknown> {
  event: WebSocketEventType;
  resource: string;
  data: T;
  timestamp: string;
}

// ============================================================================
// Component Prop Types
// ============================================================================

export interface LocationCardProps {
  location: Location;
  onSelect?: (location: Location) => void;
  onEdit?: (location: Location) => void;
  onDelete?: (location: Location) => void;
}

export interface ItemCardProps {
  item: WishlistItem;
  onViewDetails?: (item: WishlistItem) => void;
  onEdit?: (item: WishlistItem) => void;
  onDelete?: (item: WishlistItem) => void;
  onPurchase?: (item: WishlistItem) => void;
  showActions?: boolean;
}

export interface ItemModalProps {
  item: WishlistItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (item: WishlistItem) => void;
  onDelete?: (item: WishlistItem) => void;
  onPurchase?: (item: WishlistItem) => void;
}

export interface AddItemFormProps {
  listId: string;
  onSubmit: (item: CreateItemRequest) => Promise<void>;
  onCancel: () => void;
  initialUrl?: string;
}

export interface LocationGridProps {
  locations: Location[];
  onLocationSelect?: (location: Location) => void;
  isLoading?: boolean;
}

export interface HeaderProps {
  user?: User;
  onLogout?: () => void;
}

export interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: User) => void;
  defaultMode?: 'login' | 'register';
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;
