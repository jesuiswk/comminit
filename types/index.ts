/**
 * Type definitions for the Comminit application
 */

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string
  email: string
  user_metadata: {
    username: string
  }
  created_at: string
}

export interface Profile {
  id: string
  username: string
  avatar_url?: string | null
  created_at: string
  updated_at?: string | null
  bio?: string | null
  website?: string | null
  location?: string | null
}

// ============================================================================
// Post Types
// ============================================================================

export interface Post {
  id: string
  user_id: string
  title: string
  content: string
  created_at: string
  updated_at?: string | null
  draft?: boolean
  author?: Profile
  category?: string | null
}

export interface PostWithAuthor extends Omit<Post, 'author'> {
  author: Partial<Profile>
}

// ============================================================================
// Comment Types
// ============================================================================

export interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  updated_at?: string
  parent_comment_id?: string | null
  author?: Profile
}

export interface CommentWithAuthor extends Omit<Comment, 'author'> {
  author: Partial<Profile>
}

// ============================================================================
// Form Input Types
// ============================================================================

export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  username: string
  email: string
  password: string
}

export interface PostForm {
  title: string
  content: string
  category?: string | null
}

export interface CommentForm {
  content: string
  post_id: string
  parent_comment_id?: string | null
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiError {
  message: string
  code?: string
  details?: unknown
}

export interface ApiResponse<T> {
  data: T | null
  error: ApiError | null
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult<T> {
  success: boolean
  data?: T
  error?: string
  errors?: Record<string, string>
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  content?: string | null
  data?: any
  read: boolean
  created_at: string
  updated_at?: string | null
}

export type NotificationType = 'comment' | 'like' | 'follow' | 'system' | 'mention'

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationParams {
  page?: number
  limit?: number
  orderBy?: string
  ascending?: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// ============================================================================
// Search Types
// ============================================================================

export interface SearchParams {
  query: string
  type?: 'posts' | 'users' | 'comments'
  page?: number
  limit?: number
}

// ============================================================================
// Component Prop Types
// ============================================================================

export interface PostCardProps {
  post: PostWithAuthor
}

export interface CommentProps {
  comment: CommentWithAuthor
  onReply?: (commentId: string) => void
  onEdit?: (comment: Comment) => void
  onDelete?: (commentId: string) => void
}

// ============================================================================
// Route Meta Types
// ============================================================================

declare module '#app' {
  interface PageMeta {
    guestOnly?: boolean
  }
}

export {}
