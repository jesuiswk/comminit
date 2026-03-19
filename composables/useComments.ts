import type { Database } from '~/types/supabase'
import type { Comment, CommentWithAuthor, CommentForm, ApiResponse } from '~/types'

/**
 * Composable for comment data operations
 * Abstracts Supabase calls for comments
 */
export function useComments() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const { handleSupabaseError, createSuccessResponse, createErrorResponse } = useErrorHandling()

  /**
   * Fetch comments for a specific post
   * @param postId - Post UUID
   * @returns Array of comments with author data
   */
  async function fetchCommentsByPostId(
    postId: string
  ): Promise<ApiResponse<CommentWithAuthor[]>> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, author:profiles(*)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to fetch comments'))
      }

      return createSuccessResponse(data || [])
    } catch (err) {
      console.error('Error fetching comments:', err)
      return createErrorResponse<CommentWithAuthor[]>(err, 'Failed to fetch comments')
    }
  }

  /**
   * Create a new comment
   * @param commentData - Comment form data
   * @returns Created comment
   */
  async function createComment(
    commentData: CommentForm
  ): Promise<ApiResponse<Comment>> {
    if (!user.value) {
      return createErrorResponse<Comment>('User must be logged in')
    }

    try {
      const insertData = {
        post_id: commentData.post_id,
        content: commentData.content.trim(),
        user_id: user.value.id,
        parent_comment_id: commentData.parent_comment_id || null
      }

      const { data, error } = await supabase
        .from('comments')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to create comment'))
      }

      return createSuccessResponse(data)
    } catch (err) {
      console.error('Error creating comment:', err)
      return createErrorResponse<Comment>(err, 'Failed to create comment')
    }
  }

  /**
   * Update an existing comment
   * @param id - Comment UUID
   * @param content - Updated comment content
   * @returns Updated comment
   */
  async function updateComment(
    id: string,
    content: string
  ): Promise<ApiResponse<Comment>> {
    if (!user.value) {
      return createErrorResponse<Comment>('User must be logged in')
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .update({ content: content.trim() })
        .eq('id', id)
        .eq('user_id', user.value.id) // Ensure user owns the comment
        .select()
        .single()

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to update comment'))
      }

      return createSuccessResponse(data)
    } catch (err) {
      console.error('Error updating comment:', err)
      return createErrorResponse<Comment>(err, 'Failed to update comment')
    }
  }

  /**
   * Delete a comment
   * @param id - Comment UUID
   * @returns Success status
   */
  async function deleteComment(id: string): Promise<ApiResponse<boolean>> {
    if (!user.value) {
      return createErrorResponse<boolean>('User must be logged in')
    }

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.value.id) // Ensure user owns the comment

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to delete comment'))
      }

      return createSuccessResponse(true)
    } catch (err) {
      console.error('Error deleting comment:', err)
      return createErrorResponse<boolean>(err, 'Failed to delete comment')
    }
  }

  /**
   * Check if the current user can edit a comment
   * @param commentUserId - The user_id of the comment
   * @returns Boolean indicating edit permission
   */
  function canEditComment(commentUserId: string): boolean {
    return user.value?.id === commentUserId
  }

  return {
    fetchCommentsByPostId,
    createComment,
    updateComment,
    deleteComment,
    canEditComment
  }
}
