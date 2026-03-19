export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          created_at: string
          avatar_url: string | null
        }
        Insert: {
          id: string
          username: string
          created_at?: string
          avatar_url?: string | null
        }
        Update: {
          id?: string
          username?: string
          created_at?: string
          avatar_url?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      reactions: {
        Row: {
          id: string
          user_id: string
          post_id: string
          reaction_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          reaction_type?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          reaction_type?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_post_id_fkey"
            columns: ["post_id"]
            referencedRelation: "posts"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          content: string | null
          data: Json | null
          read: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          content?: string | null
          data?: Json | null
          read?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          content?: string | null
          data?: Json | null
          read?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      post_reaction_stats: {
        Row: {
          post_id: string
          title: string
          post_author_id: string
          reaction_type: string
          reaction_count: number
          user_ids: string[]
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["post_author_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      get_post_reaction_count: {
        Args: {
          post_id_param: string
          reaction_type_param?: string
        }
        Returns: unknown
      }
      has_user_reacted_to_post: {
        Args: {
          post_id_param: string
          reaction_type_param?: string
        }
        Returns: unknown
      }
      ensure_profiles_exist: {
        Args: Record<string, never>
        Returns: unknown
      }
      toggle_post_reaction: {
        Args: {
          post_id_param: string
          reaction_type_param?: string
        }
        Returns: unknown
      }
      create_notification: {
        Args: {
          p_user_id: string
          p_type: string
          p_title: string
          p_content?: string
          p_data?: Json
        }
        Returns: unknown
      }
      mark_notifications_as_read: {
        Args: {
          p_user_id: string
        }
        Returns: unknown
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
