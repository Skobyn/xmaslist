/**
 * TypeScript types for Supabase Database Schema
 * Auto-generated types for the Christmas Wishlist Application
 */

// =====================================================
// ENUMS
// =====================================================

export type ShareRole = 'viewer' | 'editor' | 'admin';
export type ResourceType = 'location' | 'list';
export type PriorityLevel = 'low' | 'medium' | 'high';

// =====================================================
// TABLE TYPES
// =====================================================

export interface User {
  id: string; // UUID
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string; // timestamp
  updated_at: string; // timestamp
}

export interface Location {
  id: string; // UUID
  name: string;
  description: string | null;
  owner_id: string; // UUID
  created_at: string; // timestamp
  updated_at: string; // timestamp
}

export interface LocationMember {
  id: string; // UUID
  location_id: string; // UUID
  user_id: string; // UUID
  role: ShareRole;
  added_at: string; // timestamp
  added_by: string | null; // UUID
}

export interface List {
  id: string; // UUID
  title: string;
  description: string | null;
  location_id: string; // UUID
  owner_id: string; // UUID
  year: number;
  is_active: boolean;
  is_public: boolean;
  guest_access_token: string | null;
  created_at: string; // timestamp
  updated_at: string; // timestamp
}

export interface Item {
  id: string; // UUID
  list_id: string; // UUID
  title: string;
  description: string | null;
  price: number | null; // decimal
  currency: string;
  url: string | null;
  image_url: string | null;
  is_purchased: boolean;
  purchased_by: string | null; // UUID
  purchased_at: string | null; // timestamp
  priority: PriorityLevel;
  quantity: number;
  notes: string | null;
  created_by: string; // UUID
  created_at: string; // timestamp
  updated_at: string; // timestamp
}

export interface Share {
  id: string; // UUID
  resource_type: ResourceType;
  resource_id: string; // UUID
  shared_by: string; // UUID
  shared_with: string; // UUID
  role: ShareRole;
  created_at: string; // timestamp
  expires_at: string | null; // timestamp
}

// =====================================================
// INSERT TYPES (for creating new records)
// =====================================================

export type UserInsert = Omit<User, 'created_at' | 'updated_at'> & {
  created_at?: string;
  updated_at?: string;
};

export type LocationInsert = Omit<Location, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type LocationMemberInsert = Omit<LocationMember, 'id' | 'added_at'> & {
  id?: string;
  added_at?: string;
};

export type ListInsert = Omit<List, 'id' | 'created_at' | 'updated_at' | 'year' | 'is_active' | 'is_public' | 'guest_access_token'> & {
  id?: string;
  year?: number;
  is_active?: boolean;
  is_public?: boolean;
  guest_access_token?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ItemInsert = Omit<Item, 'id' | 'created_at' | 'updated_at' | 'is_purchased' | 'currency' | 'priority' | 'quantity'> & {
  id?: string;
  is_purchased?: boolean;
  currency?: string;
  priority?: PriorityLevel;
  quantity?: number;
  created_at?: string;
  updated_at?: string;
};

export type ShareInsert = Omit<Share, 'id' | 'created_at' | 'role'> & {
  id?: string;
  role?: ShareRole;
  created_at?: string;
};

// =====================================================
// UPDATE TYPES (for updating existing records)
// =====================================================

export type UserUpdate = Partial<Omit<User, 'id' | 'created_at'>>;
export type LocationUpdate = Partial<Omit<Location, 'id' | 'created_at' | 'owner_id'>>;
export type LocationMemberUpdate = Partial<Omit<LocationMember, 'id' | 'location_id' | 'user_id' | 'added_at'>>;
export type ListUpdate = Partial<Omit<List, 'id' | 'created_at' | 'location_id' | 'owner_id'>>;
export type ItemUpdate = Partial<Omit<Item, 'id' | 'created_at' | 'list_id' | 'created_by'>>;
export type ShareUpdate = Partial<Omit<Share, 'id' | 'created_at' | 'resource_type' | 'resource_id' | 'shared_by' | 'shared_with'>>;

// =====================================================
// VIEW TYPES
// =====================================================

export interface ItemWithContext extends Item {
  list_title: string;
  location_id: string;
  location_name: string;
  list_owner_id: string;
  created_by_name: string | null;
  purchased_by_name: string | null;
}

export interface ListWithStats extends List {
  location_name: string;
  owner_name: string | null;
  total_items: number;
  purchased_items: number;
  total_value: number;
  purchased_value: number;
}

// =====================================================
// FUNCTION RETURN TYPES
// =====================================================

export interface ListStats {
  total_items: number;
  purchased_items: number;
  total_value: number;
  purchased_value: number;
  completion_percentage: number;
}

export interface LocationStats {
  total_lists: number;
  total_items: number;
  purchased_items: number;
  total_members: number;
}

export interface SearchItemResult {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  url: string | null;
  image_url: string | null;
  list_id: string;
  list_title: string;
  rank: number;
}

export interface ShareBatchResult {
  email: string;
  success: boolean;
  message: string;
}

export interface AccessibleList extends List {
  owner_name: string | null;
  location_name: string;
  access_level: ShareRole;
}

// =====================================================
// DATABASE SCHEMA TYPE
// =====================================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      locations: {
        Row: Location;
        Insert: LocationInsert;
        Update: LocationUpdate;
      };
      location_members: {
        Row: LocationMember;
        Insert: LocationMemberInsert;
        Update: LocationMemberUpdate;
      };
      lists: {
        Row: List;
        Insert: ListInsert;
        Update: ListUpdate;
      };
      items: {
        Row: Item;
        Insert: ItemInsert;
        Update: ItemUpdate;
      };
      shares: {
        Row: Share;
        Insert: ShareInsert;
        Update: ShareUpdate;
      };
    };
    Views: {
      items_with_context: {
        Row: ItemWithContext;
      };
      lists_with_stats: {
        Row: ListWithStats;
      };
    };
    Functions: {
      has_list_access: {
        Args: {
          list_uuid: string;
          user_uuid?: string;
          min_role?: ShareRole;
        };
        Returns: boolean;
      };
      has_location_access: {
        Args: {
          location_uuid: string;
          user_uuid?: string;
          min_role?: ShareRole;
        };
        Returns: boolean;
      };
      get_list_stats: {
        Args: {
          list_uuid: string;
        };
        Returns: ListStats;
      };
      get_location_stats: {
        Args: {
          location_uuid: string;
        };
        Returns: LocationStats;
      };
      search_items: {
        Args: {
          search_query: string;
          list_uuid?: string;
          user_uuid?: string;
        };
        Returns: SearchItemResult[];
      };
      share_resource_batch: {
        Args: {
          p_resource_type: ResourceType;
          p_resource_id: string;
          p_user_emails: string[];
          p_role?: ShareRole;
          p_expires_at?: string;
        };
        Returns: ShareBatchResult[];
      };
      get_user_accessible_lists: {
        Args: {
          user_uuid?: string;
        };
        Returns: AccessibleList[];
      };
    };
    Enums: {
      share_role: ShareRole;
      resource_type: ResourceType;
      priority_level: PriorityLevel;
    };
  };
}

// =====================================================
// HELPER TYPES
// =====================================================

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
