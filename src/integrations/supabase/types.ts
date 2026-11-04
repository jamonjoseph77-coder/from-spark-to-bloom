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
      admin_users: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content: {
        Row: {
          artwork_url: string | null
          content_type: string
          created_at: string
          genre: string | null
          id: string
          is_published: boolean
          publisher_name: string | null
          release_year: number | null
          synopsis: string | null
          title: string
          trailer_url: string | null
          updated_at: string
        }
        Insert: {
          artwork_url?: string | null
          content_type: string
          created_at?: string
          genre?: string | null
          id?: string
          is_published?: boolean
          publisher_name?: string | null
          release_year?: number | null
          synopsis?: string | null
          title: string
          trailer_url?: string | null
          updated_at?: string
        }
        Update: {
          artwork_url?: string | null
          content_type?: string
          created_at?: string
          genre?: string | null
          id?: string
          is_published?: boolean
          publisher_name?: string | null
          release_year?: number | null
          synopsis?: string | null
          title?: string
          trailer_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      creator_short_submissions: {
        Row: {
          created_at: string
          description: string
          duration_seconds: number | null
          headline: string
          id: string
          poster_path: string | null
          publisher_name: string
          review_note: string
          reviewed_at: string | null
          status: string
          title_id: string | null
          user_id: string
          video_path: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string
          duration_seconds?: number | null
          headline: string
          id?: string
          poster_path?: string | null
          publisher_name: string
          review_note?: string
          reviewed_at?: string | null
          status?: string
          title_id?: string | null
          user_id: string
          video_path?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          duration_seconds?: number | null
          headline?: string
          id?: string
          poster_path?: string | null
          publisher_name?: string
          review_note?: string
          reviewed_at?: string | null
          status?: string
          title_id?: string | null
          user_id?: string
          video_path?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_short_submissions_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
      discover_clip_comments: {
        Row: {
          author_id: string
          body: string
          clip_id: string
          created_at: string
          id: string
          status: string
        }
        Insert: {
          author_id: string
          body: string
          clip_id: string
          created_at?: string
          id?: string
          status?: string
        }
        Update: {
          author_id?: string
          body?: string
          clip_id?: string
          created_at?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "discover_clip_comments_clip_id_fkey"
            columns: ["clip_id"]
            isOneToOne: false
            referencedRelation: "discover_clips"
            referencedColumns: ["id"]
          },
        ]
      }
      discover_clip_reactions: {
        Row: {
          clip_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          clip_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          clip_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discover_clip_reactions_clip_id_fkey"
            columns: ["clip_id"]
            isOneToOne: false
            referencedRelation: "discover_clips"
            referencedColumns: ["id"]
          },
        ]
      }
      discover_clip_saves: {
        Row: {
          clip_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          clip_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          clip_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discover_clip_saves_clip_id_fkey"
            columns: ["clip_id"]
            isOneToOne: false
            referencedRelation: "discover_clips"
            referencedColumns: ["id"]
          },
        ]
      }
      discover_clips: {
        Row: {
          created_at: string
          description: string
          download_allowed: boolean
          duration_seconds: number | null
          headline: string
          id: string
          is_published: boolean
          kind: string
          poster_url: string
          publisher_name: string
          sort_order: number
          title_id: string | null
          updated_at: string
          video_url: string
          views_count: number
        }
        Insert: {
          created_at?: string
          description?: string
          download_allowed?: boolean
          duration_seconds?: number | null
          headline?: string
          id?: string
          is_published?: boolean
          kind?: string
          poster_url?: string
          publisher_name?: string
          sort_order?: number
          title_id?: string | null
          updated_at?: string
          video_url?: string
          views_count?: number
        }
        Update: {
          created_at?: string
          description?: string
          download_allowed?: boolean
          duration_seconds?: number | null
          headline?: string
          id?: string
          is_published?: boolean
          kind?: string
          poster_url?: string
          publisher_name?: string
          sort_order?: number
          title_id?: string | null
          updated_at?: string
          video_url?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "discover_clips_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
      discover_content_comments: {
        Row: {
          author_id: string
          body: string
          content_key: string
          created_at: string
          id: string
          status: string
        }
        Insert: {
          author_id: string
          body: string
          content_key: string
          created_at?: string
          id?: string
          status?: string
        }
        Update: {
          author_id?: string
          body?: string
          content_key?: string
          created_at?: string
          id?: string
          status?: string
        }
        Relationships: []
      }
      discover_content_reactions: {
        Row: {
          content_key: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content_key: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content_key?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      discover_content_shares: {
        Row: {
          content_key: string
          content_title: string
          content_url: string
          created_at: string
          id: string
          image_url: string
          message: string
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content_key: string
          content_title: string
          content_url: string
          created_at?: string
          id?: string
          image_url?: string
          message?: string
          recipient_id: string
          sender_id: string
        }
        Update: {
          content_key?: string
          content_title?: string
          content_url?: string
          created_at?: string
          id?: string
          image_url?: string
          message?: string
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      episodes: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: string
          number: number
          playback_url: string
          season_id: string
          synopsis: string
          thumbnail_url: string
          title: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          number: number
          playback_url?: string
          season_id: string
          synopsis?: string
          thumbnail_url?: string
          title?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          number?: number
          playback_url?: string
          season_id?: string
          synopsis?: string
          thumbnail_url?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "episodes_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      favourites: {
        Row: {
          added_at: string
          content_id: string | null
          created_at: string
          title_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          content_id?: string | null
          created_at?: string
          title_id: string
          user_id?: string
        }
        Update: {
          added_at?: string
          content_id?: string | null
          created_at?: string
          title_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favourites_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favourites_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      letterbox_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          post_id: string
          status: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          post_id: string
          status?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          post_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "letterbox_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "letterbox_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      letterbox_posts: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          image_url: string | null
          status: string
          title_id: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          image_url?: string | null
          status?: string
          title_id?: string | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          image_url?: string | null
          status?: string
          title_id?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "letterbox_posts_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
      letterbox_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "letterbox_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "letterbox_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string
          created_at: string
          href: string
          id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string
          created_at?: string
          href?: string
          id?: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string
          created_at?: string
          href?: string
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string
          created_at: string
          display_name: string
          id: string
          is_discoverable: boolean
          share_watching_activity: boolean
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          display_name?: string
          id: string
          is_discoverable?: boolean
          share_watching_activity?: boolean
          updated_at?: string
          user_id: string
          username?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          display_name?: string
          id?: string
          is_discoverable?: boolean
          share_watching_activity?: boolean
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      publisher_follows: {
        Row: {
          created_at: string
          followed_at: string
          publisher_id: string | null
          publisher_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          followed_at?: string
          publisher_id?: string | null
          publisher_name: string
          user_id?: string
        }
        Update: {
          created_at?: string
          followed_at?: string
          publisher_id?: string | null
          publisher_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publisher_follows_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publishers"
            referencedColumns: ["id"]
          },
        ]
      }
      publishers: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_verified: boolean
          logo_url: string | null
          name: string
          publisher_type: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean
          logo_url?: string | null
          name: string
          publisher_type: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean
          logo_url?: string | null
          name?: string
          publisher_type?: string
          website_url?: string | null
        }
        Relationships: []
      }
      seasons: {
        Row: {
          created_at: string
          id: string
          name: string
          number: number
          title_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          number: number
          title_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          number?: number
          title_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasons_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_accounts: {
        Row: {
          created_at: string
          description: string
          id: string
          logo_url: string | null
          owner_id: string
          studio_name: string
          updated_at: string
          verification_status: string
          verified_at: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          logo_url?: string | null
          owner_id: string
          studio_name: string
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          logo_url?: string | null
          owner_id?: string
          studio_name?: string
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      titles: {
        Row: {
          availability: string
          backdrop_url: string
          created_at: string
          duration_minutes: number | null
          genre: string
          id: string
          is_featured: boolean
          is_published: boolean
          playback_url: string
          poster_url: string
          publisher: string
          release_date: string | null
          release_year: number | null
          subtitle_url: string
          synopsis: string
          title: string
          trailer_url: string
          type: string
          updated_at: string
        }
        Insert: {
          availability?: string
          backdrop_url?: string
          created_at?: string
          duration_minutes?: number | null
          genre?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          playback_url?: string
          poster_url?: string
          publisher?: string
          release_date?: string | null
          release_year?: number | null
          subtitle_url?: string
          synopsis?: string
          title: string
          trailer_url?: string
          type: string
          updated_at?: string
        }
        Update: {
          availability?: string
          backdrop_url?: string
          created_at?: string
          duration_minutes?: number | null
          genre?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          playback_url?: string
          poster_url?: string
          publisher?: string
          release_date?: string | null
          release_year?: number | null
          subtitle_url?: string
          synopsis?: string
          title?: string
          trailer_url?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      watch_parties: {
        Row: {
          created_at: string
          host_id: string
          id: string
          invite_code: string
          name: string
          scheduled_at: string | null
          status: string
          title_id: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          host_id?: string
          id?: string
          invite_code?: string
          name: string
          scheduled_at?: string | null
          status?: string
          title_id: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          host_id?: string
          id?: string
          invite_code?: string
          name?: string
          scheduled_at?: string | null
          status?: string
          title_id?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_parties_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_party_members: {
        Row: {
          joined_at: string
          party_id: string
          role: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          party_id: string
          role?: string
          user_id?: string
        }
        Update: {
          joined_at?: string
          party_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_party_members_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "watch_parties"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_party_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          party_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          party_id: string
          user_id?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          party_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_party_messages_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "watch_parties"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_progress: {
        Row: {
          completed: boolean
          content_id: string
          duration_seconds: number
          position_seconds: number
          title_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          content_id: string
          duration_seconds?: number
          position_seconds?: number
          title_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          content_id?: string
          duration_seconds?: number
          position_seconds?: number
          title_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watch_progress_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlist: {
        Row: {
          added_at: string
          content_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          content_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          content_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlist_items: {
        Row: {
          created_at: string
          title_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          title_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          title_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_items_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cinema_create_notification: {
        Args: {
          p_actor_id: string
          p_body: string
          p_href: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      is_cinema_admin: { Args: never; Returns: boolean }
      is_party_host: { Args: { p_party_id: string }; Returns: boolean }
      is_party_member: { Args: { p_party_id: string }; Returns: boolean }
      join_watch_party: { Args: { p_invite_code: string }; Returns: string }
      record_discover_clip_view: {
        Args: { p_clip_id: string }
        Returns: number
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
    Enums: {},
  },
} as const
