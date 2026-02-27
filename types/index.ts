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
  created_at: string
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
  updated_at?: string
  author?: Profile
}

export interface PostWithAuthor extends Post {
  author: Profile
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

export interface CommentWithAuthor extends Comment {
  author: Profile
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
