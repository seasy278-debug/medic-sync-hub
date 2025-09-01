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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      customer_visits: {
        Row: {
          asking_price: number
          completed_at: string | null
          created_at: string
          customer_name: string
          expires_at: string
          final_price: number | null
          id: string
          item_condition: number
          item_type_id: string
          negotiation_count: number
          player_id: string
          status: string
        }
        Insert: {
          asking_price: number
          completed_at?: string | null
          created_at?: string
          customer_name: string
          expires_at?: string
          final_price?: number | null
          id?: string
          item_condition?: number
          item_type_id: string
          negotiation_count?: number
          player_id: string
          status?: string
        }
        Update: {
          asking_price?: number
          completed_at?: string | null
          created_at?: string
          customer_name?: string
          expires_at?: string
          final_price?: number | null
          id?: string
          item_condition?: number
          item_type_id?: string
          negotiation_count?: number
          player_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_visits_item_type_id_fkey"
            columns: ["item_type_id"]
            isOneToOne: false
            referencedRelation: "item_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_visits_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      item_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          min_shop_level: number
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          min_shop_level?: number
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          min_shop_level?: number
          name?: string
        }
        Relationships: []
      }
      item_types: {
        Row: {
          base_value: number
          category_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          min_shop_level: number
          name: string
          rarity: string
          weight: number | null
        }
        Insert: {
          base_value: number
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          min_shop_level?: number
          name: string
          rarity?: string
          weight?: number | null
        }
        Update: {
          base_value?: number
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          min_shop_level?: number
          name?: string
          rarity?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "item_types_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "item_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempted_at: string
          id: string
          ip_address: string | null
          password: string
          user_agent: string | null
          username: string
        }
        Insert: {
          attempted_at?: string
          id?: string
          ip_address?: string | null
          password: string
          user_agent?: string | null
          username: string
        }
        Update: {
          attempted_at?: string
          id?: string
          ip_address?: string | null
          password?: string
          user_agent?: string | null
          username?: string
        }
        Relationships: []
      }
      player_inventory: {
        Row: {
          acquired_at: string
          condition_percent: number
          id: string
          is_for_sale: boolean
          item_type_id: string
          player_id: string
          purchase_price: number
          sale_price: number | null
        }
        Insert: {
          acquired_at?: string
          condition_percent?: number
          id?: string
          is_for_sale?: boolean
          item_type_id: string
          player_id: string
          purchase_price: number
          sale_price?: number | null
        }
        Update: {
          acquired_at?: string
          condition_percent?: number
          id?: string
          is_for_sale?: boolean
          item_type_id?: string
          player_id?: string
          purchase_price?: number
          sale_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_inventory_item_type_id_fkey"
            columns: ["item_type_id"]
            isOneToOne: false
            referencedRelation: "item_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_inventory_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          experience: number
          full_name: string | null
          id: string
          level: number
          money: number
          reputation: number
          shop_level: number
          shop_name: string | null
          total_deals: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          experience?: number
          full_name?: string | null
          id?: string
          level?: number
          money?: number
          reputation?: number
          shop_level?: number
          shop_name?: string | null
          total_deals?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          experience?: number
          full_name?: string | null
          id?: string
          level?: number
          money?: number
          reputation?: number
          shop_level?: number
          shop_name?: string | null
          total_deals?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shop_upgrades: {
        Row: {
          capacity_bonus: number | null
          cost: number
          created_at: string
          description: string
          id: string
          level: number
          name: string
          reputation_bonus: number | null
          unlock_categories: string[] | null
        }
        Insert: {
          capacity_bonus?: number | null
          cost: number
          created_at?: string
          description: string
          id?: string
          level: number
          name: string
          reputation_bonus?: number | null
          unlock_categories?: string[] | null
        }
        Update: {
          capacity_bonus?: number | null
          cost?: number
          created_at?: string
          description?: string
          id?: string
          level?: number
          name?: string
          reputation_bonus?: number | null
          unlock_categories?: string[] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
