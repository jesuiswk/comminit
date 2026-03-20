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
          bio: string | null
          website: string | null
          location: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          username: string
          created_at?: string
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
          location?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          username?: string
          created_at?: string
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
          location?: string | null
          updated_at?: string | null
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
          updated_at: string | null
          draft: boolean
          category: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          created_at?: string
          updated_at?: string | null
          draft?: boolean
          category?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          created_at?: string
          updated_at?: string | null
          draft?: boolean
          category?: string | null
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
          parent_comment_id: string | null
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          created_at?: string
          parent_comment_id?: string | null
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          created_at?: string
          parent_comment_id?: string | null
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
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            referencedRelation: "comments"
            referencedColumns: ["id"]
          }
        ]
      }
      likes: {
        Row: {
          id: string
          user_id: string
          post_id: string | null
          comment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id?: string | null
          comment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string | null
          comment_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_comment_id_fkey"
            columns: ["comment_id"]
            referencedRelation: "comments"
            referencedColumns: ["id"]
          }
        ]
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
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
      search_queries: {
        Row: {
          id: string
          query: string
          user_id: string | null
          search_type: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          query: string
          user_id?: string | null
          search_type?: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          query?: string
          user_id?: string | null
          search_type?: string
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_queries_user_id_fkey"
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
      user_stats: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          created_at: string
          updated_at: string | null
          bio: string | null
          website: string | null
          location: string | null
          follower_count: number
          following_count: number
          post_count: number
          comment_count: number
        }
        Relationships: []
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
      // New likes system functions
      toggle_like: {
        Args: {
          p_post_id?: string | null
          p_comment_id?: string | null
        }
        Returns: boolean
      }
      get_like_count: {
        Args: {
          target_post_id?: string | null
          target_comment_id?: string | null
        }
        Returns: number
      }
      has_user_liked: {
        Args: {
          p_post_id?: string | null
          p_comment_id?: string | null
        }
        Returns: boolean
      }
      // New follows system functions
      toggle_follow: {
        Args: {
          p_following_id: string
        }
        Returns: boolean
      }
      is_following: {
        Args: {
          p_following_id: string
        }
        Returns: boolean
      }
      get_follower_count: {
        Args: {
          p_user_id: string
        }
        Returns: number
      }
      get_following_count: {
        Args: {
          p_user_id: string
        }
        Returns: number
      }
      get_followers: {
        Args: {
          p_user_id: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id: string
          username: string
          avatar_url: string | null
          created_at: string
          follow_created_at: string
        }[]
      }
      get_following: {
        Args: {
          p_user_id: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id: string
          username: string
          avatar_url: string | null
          created_at: string
          follow_created_at: string
        }[]
      }
      get_mutual_follows: {
        Args: {
          p_user_id: string
        }
        Returns: {
          id: string
          username: string
          avatar_url: string | null
          created_at: string
        }[]
      }
      // Search tracking functions
      log_search_query: {
        Args: {
          p_query: string
          p_user_id?: string | null
          p_search_type?: string
        }
        Returns: string | null
      }
      get_trending_searches: {
        Args: {
          p_limit?: number
          p_days?: number
        }
        Returns: {
          query: string
          search_count: number
          last_searched: string
        }[]
      }
      get_trending_searches_by_type: {
        Args: {
          p_search_type: string
          p_limit?: number
          p_days?: number
        }
        Returns: {
          query: string
          search_count: number
          last_searched: string
        }[]
      }
      get_user_recent_searches: {
        Args: {
          p_user_id: string
          p_limit?: number
        }
        Returns: {
          query: string
          search_type: string
          searched_at: string
        }[]
      }
      clear_old_search_queries: {
        Args: {
          p_days_to_keep?: number
        }
        Returns: number
      }
      // Draft management functions
      save_post_as_draft: {
        Args: {
          p_title: string
          p_content: string
          p_user_id: string
        }
        Returns: string | null
      }
      update_draft_post: {
        Args: {
          p_post_id: string
          p_title: string
          p_content: string
          p_user_id: string
        }
        Returns: boolean
      }
      publish_draft: {
        Args: {
          p_post_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      get_user_drafts: {
        Args: {
          p_user_id: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id: string
          title: string
          content: string
          created_at: string
          updated_at: string
        }[]
      }
      count_user_drafts: {
        Args: {
          p_user_id: string
        }
        Returns: number
      }
      delete_draft: {
        Args: {
          p_post_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      cleanup_old_drafts: {
        Args: {
          p_days_to_keep?: number
        }
        Returns: number
      }
      // Category management functions
      get_post_categories: {
        Args: Record<string, never>
        Returns: {
          category: string
          post_count: number
        }[]
      }
      get_posts_by_category: {
        Args: {
          p_category: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id: string
          user_id: string
          title: string
          content: string
          created_at: string
          updated_at: string
          draft: boolean
          category: string
          author_id: string
          author_username: string
          author_avatar_url: string | null
        }[]
      }
      count_posts_by_category: {
        Args: {
          p_category: string
        }
        Returns: number
      }
      get_popular_categories: {
        Args: {
          p_limit?: number
        }
        Returns: {
          category: string
          post_count: number
        }[]
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
