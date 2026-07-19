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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {

      feedback: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          id: string
          lat_full: number | null
          lat_short: number | null
          long_full: number | null
          long_short: number | null
          updated_at: string
        }
        Insert: {
          id: string
          lat_full?: number | null
          lat_short?: number | null
          long_full?: number | null
          long_short?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          lat_full?: number | null
          lat_short?: number | null
          long_full?: number | null
          long_short?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          delivered_at: string | null
          id: string
          receiver_id: string
          seen_at: string | null
          sender_id: string
          sent_at: string | null
          text: string
        }
        Insert: {
          delivered_at?: string | null
          id?: string
          receiver_id: string
          seen_at?: string | null
          sender_id: string
          sent_at?: string | null
          text: string
        }
        Update: {
          delivered_at?: string | null
          id?: string
          receiver_id?: string
          seen_at?: string | null
          sender_id?: string
          sent_at?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_created_at: string
          date_of_birth: string | null
          display_name: string
          email: string
          gender: string | null
          id: string
          optional_profile_completed_at: string | null
          user_name: string
        }
        Insert: {
          account_created_at?: string
          date_of_birth?: string | null
          display_name: string
          email: string
          gender?: string | null
          id?: string
          optional_profile_completed_at?: string | null
          user_name: string
        }
        Update: {
          account_created_at?: string
          date_of_birth?: string | null
          display_name?: string
          email?: string
          gender?: string | null
          id?: string
          optional_profile_completed_at?: string | null
          user_name?: string
        }
        Relationships: []
      }
      profile_basics_drafts: {
        Row: {
          date_of_birth: string | null
          display_name: string | null
          gender: string | null
          id: string
          updated_at: string
          user_name: string | null
        }
        Insert: {
          date_of_birth?: string | null
          display_name?: string | null
          gender?: string | null
          id: string
          updated_at?: string
          user_name?: string | null
        }
        Update: {
          date_of_birth?: string | null
          display_name?: string | null
          gender?: string | null
          id?: string
          updated_at?: string
          user_name?: string | null
        }
        Relationships: []
      }
      social_links: {
        Row: {
          banner_url: string | null
          bio: string | null
          created_at: string
          id: string
          instagram: string | null
          linkedin: string | null
          profile_pic_url: string | null
          updated_at: string
          x_twitter: string | null
        }
        Insert: {
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          id: string
          instagram?: string | null
          linkedin?: string | null
          profile_pic_url?: string | null
          updated_at?: string
          x_twitter?: string | null
        }
        Update: {
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          instagram?: string | null
          linkedin?: string | null
          profile_pic_url?: string | null
          updated_at?: string
          x_twitter?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_links_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
        get_nearby_user_ids: {
          Args: { include_self?: boolean }
          Returns: { user_id: string }[]
        }
        get_my_private_profile: {
          Args: Record<PropertyKey, never>
          Returns: {
            id: string
            display_name: string
            user_name: string
            date_of_birth: string | null
            gender: string | null
            email: string
            account_created_at: string
            expo_push_token: string | null
            notification_enabled: boolean | null
            notification_preferences: Json | null
            last_token_update: string | null
            optional_profile_completed_at: string | null
          }[]
        }
        get_unread_message_counts: {
          Args: Record<PropertyKey, never>
          Returns: {
            sender_id: string
            unread_count: number
          }[]
        }
        mark_messages_delivered: {
          Args: { other_user_id: string }
          Returns: undefined
        }
        mark_messages_read: {
          Args: { other_user_id: string }
          Returns: undefined
        }
        is_user_nearby: {
          Args: { target_user_id: string }
          Returns: boolean
        }
        set_my_location: {
          Args: {
            latitude: number | null
            longitude: number | null
          }
          Returns: undefined
        }
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

