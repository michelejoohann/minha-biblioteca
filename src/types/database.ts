export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      authors: {
        Row: {
          created_at: string
          household_id: string
          id: string
          name: string
          normalized_name: string | null
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          name: string
          normalized_name?: string | null
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          name?: string
          normalized_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "authors_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      copies: {
        Row: {
          acquired_on: string | null
          archived_at: string | null
          condition: string | null
          created_at: string
          edition_id: string
          household_id: string
          id: string
          location_id: string
          notes: string | null
          owner_id: string
          updated_at: string
        }
        Insert: {
          acquired_on?: string | null
          archived_at?: string | null
          condition?: string | null
          created_at?: string
          edition_id: string
          household_id: string
          id?: string
          location_id: string
          notes?: string | null
          owner_id: string
          updated_at?: string
        }
        Update: {
          acquired_on?: string | null
          archived_at?: string | null
          condition?: string | null
          created_at?: string
          edition_id?: string
          household_id?: string
          id?: string
          location_id?: string
          notes?: string | null
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "copies_edition_fk"
            columns: ["household_id", "edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["household_id", "id"]
          },
          {
            foreignKeyName: "copies_household_fk"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copies_location_fk"
            columns: ["household_id", "location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["household_id", "id"]
          },
          {
            foreignKeyName: "copies_owner_fk"
            columns: ["household_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["household_id", "id"]
          },
        ]
      }
      editions: {
        Row: {
          cover_path: string | null
          created_at: string
          edition_label: string | null
          format: string | null
          household_id: string
          id: string
          isbn_10: string | null
          isbn_13: string | null
          publication_year: number | null
          publisher: string | null
          updated_at: string
          work_id: string
        }
        Insert: {
          cover_path?: string | null
          created_at?: string
          edition_label?: string | null
          format?: string | null
          household_id: string
          id?: string
          isbn_10?: string | null
          isbn_13?: string | null
          publication_year?: number | null
          publisher?: string | null
          updated_at?: string
          work_id: string
        }
        Update: {
          cover_path?: string | null
          created_at?: string
          edition_label?: string | null
          format?: string | null
          household_id?: string
          id?: string
          isbn_10?: string | null
          isbn_13?: string | null
          publication_year?: number | null
          publisher?: string | null
          updated_at?: string
          work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "editions_work_fk"
            columns: ["household_id", "work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["household_id", "id"]
          },
        ]
      }
      household_members: {
        Row: {
          created_at: string
          household_id: string
          role: Database["public"]["Enums"]["household_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id: string
          role?: Database["public"]["Enums"]["household_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string
          role?: Database["public"]["Enums"]["household_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      loans: {
        Row: {
          borrower_contact: string | null
          borrower_name: string
          copy_id: string
          created_at: string
          due_on: string | null
          household_id: string
          id: string
          loaned_on: string
          notes: string | null
          returned_on: string | null
          updated_at: string
        }
        Insert: {
          borrower_contact?: string | null
          borrower_name: string
          copy_id: string
          created_at?: string
          due_on?: string | null
          household_id: string
          id?: string
          loaned_on?: string
          notes?: string | null
          returned_on?: string | null
          updated_at?: string
        }
        Update: {
          borrower_contact?: string | null
          borrower_name?: string
          copy_id?: string
          created_at?: string
          due_on?: string | null
          household_id?: string
          id?: string
          loaned_on?: string
          notes?: string | null
          returned_on?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_copy_fk"
            columns: ["household_id", "copy_id"]
            isOneToOne: false
            referencedRelation: "copies"
            referencedColumns: ["household_id", "id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string
          household_id: string
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_parent_household_fk"
            columns: ["household_id", "parent_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["household_id", "id"]
          },
        ]
      }
      owners: {
        Row: {
          created_at: string
          household_id: string
          id: string
          is_active: boolean
          is_collective: boolean
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          is_active?: boolean
          is_collective?: boolean
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          is_active?: boolean
          is_collective?: boolean
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "owners_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reading_statuses: {
        Row: {
          created_at: string
          finished_on: string | null
          household_id: string
          id: string
          reader_owner_id: string
          started_on: string | null
          status: Database["public"]["Enums"]["reading_state"]
          updated_at: string
          work_id: string
        }
        Insert: {
          created_at?: string
          finished_on?: string | null
          household_id: string
          id?: string
          reader_owner_id: string
          started_on?: string | null
          status?: Database["public"]["Enums"]["reading_state"]
          updated_at?: string
          work_id: string
        }
        Update: {
          created_at?: string
          finished_on?: string | null
          household_id?: string
          id?: string
          reader_owner_id?: string
          started_on?: string | null
          status?: Database["public"]["Enums"]["reading_state"]
          updated_at?: string
          work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_statuses_owner_fk"
            columns: ["household_id", "reader_owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["household_id", "id"]
          },
          {
            foreignKeyName: "reading_statuses_work_fk"
            columns: ["household_id", "work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["household_id", "id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          authors: string[]
          created_at: string
          created_by: string
          household_id: string
          id: string
          isbn_10: string | null
          isbn_13: string | null
          normalized_title: string | null
          notes: string | null
          priority: number
          purchased_at: string | null
          status: Database["public"]["Enums"]["wishlist_state"]
          title: string
          updated_at: string
        }
        Insert: {
          authors?: string[]
          created_at?: string
          created_by: string
          household_id: string
          id?: string
          isbn_10?: string | null
          isbn_13?: string | null
          normalized_title?: string | null
          notes?: string | null
          priority?: number
          purchased_at?: string | null
          status?: Database["public"]["Enums"]["wishlist_state"]
          title: string
          updated_at?: string
        }
        Update: {
          authors?: string[]
          created_at?: string
          created_by?: string
          household_id?: string
          id?: string
          isbn_10?: string | null
          isbn_13?: string | null
          normalized_title?: string | null
          notes?: string | null
          priority?: number
          purchased_at?: string | null
          status?: Database["public"]["Enums"]["wishlist_state"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      work_authors: {
        Row: {
          author_id: string
          household_id: string
          position: number
          work_id: string
        }
        Insert: {
          author_id: string
          household_id: string
          position?: number
          work_id: string
        }
        Update: {
          author_id?: string
          household_id?: string
          position?: number
          work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_authors_author_fk"
            columns: ["household_id", "author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["household_id", "id"]
          },
          {
            foreignKeyName: "work_authors_household_fk"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_authors_work_fk"
            columns: ["household_id", "work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["household_id", "id"]
          },
        ]
      }
      works: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          genres: string[]
          household_id: string
          id: string
          language_code: string | null
          normalized_title: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          genres?: string[]
          household_id: string
          id?: string
          language_code?: string | null
          normalized_title?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          genres?: string[]
          household_id?: string
          id?: string
          language_code?: string | null
          normalized_title?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "works_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_manual_book: {
        Args: {
          p_author: string
          p_description?: string
          p_edition_label?: string
          p_genres?: string[]
          p_household_id: string
          p_isbn_10?: string
          p_isbn_13?: string
          p_language_code?: string
          p_location_name: string
          p_notes?: string
          p_owner_id: string
          p_publication_year?: number
          p_publisher?: string
          p_subtitle?: string
          p_title: string
        }
        Returns: string
      }
      search_library_books: {
        Args: {
          p_household_id: string
          p_limit?: number
          p_query?: string
        }
        Returns: {
          authors: string
          copy_id: string
          created_at: string
          genres: string[]
          isbn_10: string | null
          isbn_13: string | null
          location_name: string
          owner_name: string
          publication_year: number | null
          publisher: string | null
          subtitle: string | null
          title: string
        }[]
      }
    }
    Enums: {
      household_role: "admin" | "member"
      reading_state:
        | "unread"
        | "want_to_read"
        | "reading"
        | "read"
        | "abandoned"
      wishlist_state: "wanted" | "purchased" | "removed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      household_role: ["admin", "member"],
      reading_state: ["unread", "want_to_read", "reading", "read", "abandoned"],
      wishlist_state: ["wanted", "purchased", "removed"],
    },
  },
} as const

