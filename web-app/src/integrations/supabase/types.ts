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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      affiliate_clicks: {
        Row: {
          affiliate_network: string | null
          clicked_at: string
          conversion_value: number | null
          converted: boolean | null
          id: string
          listing_id: string | null
          product_id: string | null
          store: string
          user_id: string | null
        }
        Insert: {
          affiliate_network?: string | null
          clicked_at?: string
          conversion_value?: number | null
          converted?: boolean | null
          id?: string
          listing_id?: string | null
          product_id?: string | null
          store: string
          user_id?: string | null
        }
        Update: {
          affiliate_network?: string | null
          clicked_at?: string
          conversion_value?: number | null
          converted?: boolean | null
          id?: string
          listing_id?: string | null
          product_id?: string | null
          store?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "product_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          category: string | null
          created_at: string
          deal_price: number
          deal_score: number | null
          discount_percent: number | null
          expires_at: string | null
          id: string
          is_limited_time: boolean | null
          original_price: number
          product_image: string | null
          product_name: string
          store: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          deal_price: number
          deal_score?: number | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          is_limited_time?: boolean | null
          original_price: number
          product_image?: string | null
          product_name: string
          store: string
        }
        Update: {
          category?: string | null
          created_at?: string
          deal_price?: number
          deal_score?: number | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          is_limited_time?: boolean | null
          original_price?: number
          product_image?: string | null
          product_name?: string
          store?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          created_at: string
          current_price: number
          id: string
          notification_sent: boolean | null
          target_price: number
          triggered: boolean | null
          triggered_at: string | null
          user_id: string
          watchlist_id: string | null
        }
        Insert: {
          created_at?: string
          current_price: number
          id?: string
          notification_sent?: boolean | null
          target_price: number
          triggered?: boolean | null
          triggered_at?: string | null
          user_id: string
          watchlist_id?: string | null
        }
        Update: {
          created_at?: string
          current_price?: number
          id?: string
          notification_sent?: boolean | null
          target_price?: number
          triggered?: boolean | null
          triggered_at?: string | null
          user_id?: string
          watchlist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_alerts_watchlist_id_fkey"
            columns: ["watchlist_id"]
            isOneToOne: false
            referencedRelation: "watchlists"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          id: string
          listing_id: string
          price: number
          product_id: string
          recorded_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          price: number
          product_id: string
          recorded_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          price?: number
          product_id?: string
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "product_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_listings: {
        Row: {
          affiliate_network: string | null
          affiliate_url: string | null
          created_at: string
          current_price: number
          id: string
          is_available: boolean | null
          last_checked_at: string | null
          original_price: number | null
          product_id: string
          seller_name: string | null
          seller_rating: number | null
          store: string
          store_url: string | null
          updated_at: string
        }
        Insert: {
          affiliate_network?: string | null
          affiliate_url?: string | null
          created_at?: string
          current_price: number
          id?: string
          is_available?: boolean | null
          last_checked_at?: string | null
          original_price?: number | null
          product_id: string
          seller_name?: string | null
          seller_rating?: number | null
          store: string
          store_url?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_network?: string | null
          affiliate_url?: string | null
          created_at?: string
          current_price?: number
          id?: string
          is_available?: boolean | null
          last_checked_at?: string | null
          original_price?: number | null
          product_id?: string
          seller_name?: string | null
          seller_rating?: number | null
          store?: string
          store_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_listings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category: string | null
          created_at: string
          id: string
          image_url: string | null
          name: string
          specs: Json | null
          subcategory: string | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          specs?: Json | null
          subcategory?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          specs?: Json | null
          subcategory?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          deals_captured: number | null
          display_name: string | null
          email: string | null
          id: string
          products_tracked: number | null
          total_savings: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deals_captured?: number | null
          display_name?: string | null
          email?: string | null
          id?: string
          products_tracked?: number | null
          total_savings?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deals_captured?: number | null
          display_name?: string | null
          email?: string | null
          id?: string
          products_tracked?: number | null
          total_savings?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seller_data: {
        Row: {
          delivery_score: number | null
          id: string
          positive_ratings: number | null
          return_score: number | null
          seller_name: string
          store: string
          total_ratings: number | null
          trust_score: number | null
          updated_at: string
          verified: boolean | null
        }
        Insert: {
          delivery_score?: number | null
          id?: string
          positive_ratings?: number | null
          return_score?: number | null
          seller_name: string
          store: string
          total_ratings?: number | null
          trust_score?: number | null
          updated_at?: string
          verified?: boolean | null
        }
        Update: {
          delivery_score?: number | null
          id?: string
          positive_ratings?: number | null
          return_score?: number | null
          seller_name?: string
          store?: string
          total_ratings?: number | null
          trust_score?: number | null
          updated_at?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      watchlists: {
        Row: {
          alert_price: number | null
          created_at: string
          current_price: number
          id: string
          product_image: string | null
          product_name: string
          product_url: string | null
          store: string
          trend: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_price?: number | null
          created_at?: string
          current_price: number
          id?: string
          product_image?: string | null
          product_name: string
          product_url?: string | null
          store: string
          trend?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_price?: number | null
          created_at?: string
          current_price?: number
          id?: string
          product_image?: string | null
          product_name?: string
          product_url?: string | null
          store?: string
          trend?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_products: {
        Args: { result_limit?: number; search_query: string }
        Returns: {
          brand: string
          category: string
          id: string
          image_url: string
          name: string
          similarity: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
