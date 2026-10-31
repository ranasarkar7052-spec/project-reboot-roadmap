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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          id: string
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          record_id?: string
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      booking_status_history: {
        Row: {
          booking_id: string
          changed_by: string | null
          created_at: string
          id: string
          reason: string
          status: string
        }
        Insert: {
          booking_id: string
          changed_by?: string | null
          created_at?: string
          id?: string
          reason?: string
          status: string
        }
        Update: {
          booking_id?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          reason?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address: string
          agreed_amount: number | null
          amount_confirmed: boolean
          cancel_reason: string
          category_id: string
          contact_preference: string
          created_at: string
          customer_id: string
          description: string
          id: string
          landmark: string
          latitude: number | null
          longitude: number | null
          photo_url: string
          preferred_date: string
          preferred_time: string
          provider_id: string | null
          reference: string
          status: string
          updated_at: string
          village: string
        }
        Insert: {
          address: string
          agreed_amount?: number | null
          amount_confirmed?: boolean
          cancel_reason?: string
          category_id: string
          contact_preference?: string
          created_at?: string
          customer_id: string
          description: string
          id?: string
          landmark?: string
          latitude?: number | null
          longitude?: number | null
          photo_url?: string
          preferred_date: string
          preferred_time: string
          provider_id?: string | null
          reference?: string
          status?: string
          updated_at?: string
          village: string
        }
        Update: {
          address?: string
          agreed_amount?: number | null
          amount_confirmed?: boolean
          cancel_reason?: string
          category_id?: string
          contact_preference?: string
          created_at?: string
          customer_id?: string
          description?: string
          id?: string
          landmark?: string
          latitude?: number | null
          longitude?: number | null
          photo_url?: string
          preferred_date?: string
          preferred_time?: string
          provider_id?: string | null
          reference?: string
          status?: string
          updated_at?: string
          village?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_policies: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          rate_percentage: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          rate_percentage: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          rate_percentage?: number
          updated_at?: string
        }
        Relationships: []
      }
      commission_records: {
        Row: {
          adjusted_by: string | null
          adjustment_note: string
          agreed_amount: number
          booking_id: string
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          policy_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          adjusted_by?: string | null
          adjustment_note?: string
          agreed_amount: number
          booking_id: string
          commission_amount: number
          commission_rate: number
          created_at?: string
          id?: string
          policy_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          adjusted_by?: string | null
          adjustment_note?: string
          agreed_amount?: number
          booking_id?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          policy_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_records_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_records_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "commission_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          booking_id: string
          complainant_id: string
          created_at: string
          description: string
          id: string
          resolution_note: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          complainant_id: string
          created_at?: string
          description: string
          id?: string
          resolution_note?: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          complainant_id?: string
          created_at?: string
          description?: string
          id?: string
          resolution_note?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_complainant_id_fkey"
            columns: ["complainant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_line: string
          created_at: string
          district: string
          full_name: string
          id: string
          landmark: string
          latitude: number | null
          longitude: number | null
          phone: string
          pin_code: string
          post_office: string
          preferred_language: string
          state: string
          updated_at: string
          village: string
        }
        Insert: {
          address_line?: string
          created_at?: string
          district?: string
          full_name?: string
          id: string
          landmark?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string
          pin_code?: string
          post_office?: string
          preferred_language?: string
          state?: string
          updated_at?: string
          village?: string
        }
        Update: {
          address_line?: string
          created_at?: string
          district?: string
          full_name?: string
          id?: string
          landmark?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string
          pin_code?: string
          post_office?: string
          preferred_language?: string
          state?: string
          updated_at?: string
          village?: string
        }
        Relationships: []
      }
      provider_profiles: {
        Row: {
          category_ids: string[]
          consent_at: string | null
          consent_given: boolean
          contact_number: string
          created_at: string
          experience_years: number
          id: string
          is_available: boolean
          photo_url: string
          qualification_details: string
          reverification_changes: Json
          service_areas: string[]
          updated_at: string
          verification_note: string
          verification_status: string
          verified_at: string | null
          verified_by: string | null
          working_hours: string
        }
        Insert: {
          category_ids?: string[]
          consent_at?: string | null
          consent_given?: boolean
          contact_number?: string
          created_at?: string
          experience_years?: number
          id: string
          is_available?: boolean
          photo_url?: string
          qualification_details?: string
          reverification_changes?: Json
          service_areas?: string[]
          updated_at?: string
          verification_note?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
          working_hours?: string
        }
        Update: {
          category_ids?: string[]
          consent_at?: string | null
          consent_given?: boolean
          contact_number?: string
          created_at?: string
          experience_years?: number
          id?: string
          is_available?: boolean
          photo_url?: string
          qualification_details?: string
          reverification_changes?: Json
          service_areas?: string[]
          updated_at?: string
          verification_note?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
          working_hours?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string
          created_at: string
          customer_id: string
          id: string
          provider_id: string
          rating: number
        }
        Insert: {
          booking_id: string
          comment?: string
          created_at?: string
          customer_id: string
          id?: string
          provider_id: string
          rating: number
        }
        Update: {
          booking_id?: string
          comment?: string
          created_at?: string
          customer_id?: string
          id?: string
          provider_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string
          desc_bn: string
          desc_en: string
          icon_name: string
          id: string
          is_active: boolean
          name_bn: string
          name_en: string
          slug: string
          sort_order: number
          starting_price: number
        }
        Insert: {
          created_at?: string
          desc_bn?: string
          desc_en?: string
          icon_name?: string
          id?: string
          is_active?: boolean
          name_bn: string
          name_en: string
          slug: string
          sort_order?: number
          starting_price?: number
        }
        Update: {
          created_at?: string
          desc_bn?: string
          desc_en?: string
          icon_name?: string
          id?: string
          is_active?: boolean
          name_bn?: string
          name_en?: string
          slug?: string
          sort_order?: number
          starting_price?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_exists: { Args: never; Returns: boolean }
      admin_grant_admin: { Args: { _email: string }; Returns: undefined }
      admin_list_providers: {
        Args: never
        Returns: {
          category_ids: string[]
          consent_at: string
          consent_given: boolean
          contact_number: string
          created_at: string
          experience_years: number
          full_name: string
          id: string
          phone: string
          photo_url: string
          qualification_details: string
          reverification_changes: Json
          service_areas: string[]
          verification_note: string
          verification_status: string
          village: string
        }[]
      }
      admin_review_provider: {
        Args: { _approve: boolean; _note: string; _provider_id: string }
        Returns: undefined
      }
      admin_set_commission_rate: { Args: { _rate: number }; Returns: undefined }
      claim_first_admin: { Args: never; Returns: boolean }
      confirm_booking_amount: {
        Args: { _accept: boolean; _booking_id: string }
        Returns: undefined
      }
      get_booking_contact: {
        Args: { _booking_id: string }
        Returns: {
          name: string
          phone: string
        }[]
      }
      get_booking_party_names: {
        Args: { _booking_ids: string[] }
        Returns: {
          booking_id: string
          customer_name: string
          provider_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_approved_providers: {
        Args: never
        Returns: {
          category_ids: string[]
          experience_years: number
          full_name: string
          id: string
          is_available: boolean
          photo_url: string
          qualification_details: string
          service_areas: string[]
          village: string
          working_hours: string
        }[]
      }
      normalize_phone: { Args: { _p: string }; Returns: string }
      provider_ratings: {
        Args: never
        Returns: {
          avg_rating: number
          provider_id: string
          review_count: number
        }[]
      }
      provider_serves_category: {
        Args: { _cat: string; _uid: string }
        Returns: boolean
      }
      set_booking_amount: {
        Args: { _amount: number; _booking_id: string }
        Returns: undefined
      }
      update_booking_status: {
        Args: { _booking_id: string; _reason?: string; _status: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "provider" | "customer"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "provider", "customer"],
    },
  },
} as const
