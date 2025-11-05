/**
 * Database type definitions for Supabase
 *
 * This file should be generated from your Supabase schema using:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
 *
 * For now, this is a placeholder template
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // Define your database tables here
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
        };
      };
    };
    Views: {
      // Define your database views here
    };
    Functions: {
      // Define your database functions here
    };
    Enums: {
      // Define your database enums here
    };
  };
}
