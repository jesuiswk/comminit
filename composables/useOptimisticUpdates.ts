import type { Post, PostWithAuthor, Comment, CommentWithAuthor } from '~/types'

/**
 * Composable for optimistic UI updates
 * Provides utilities for optimistic updates to improve perceived performance
 */
export function useOptimisticUpdates() {
  /**
   * Optimistically add a post to the list
   * @param posts - Current posts array
   * @param newPost - New post to add optimistically
   * @param currentUserId - Current user's ID
   * @returns Updated posts array with optimistic post
   */
  function optimisticallyAddPost(
    posts: PostWithAuthor[],
    newPost: { title: string; content: string },
    currentUserId: string,
    currentUserProfile: { username: string }
  ): PostWithAuthor[] {
    const optimisticPost: PostWithAuthor = {
      id: `optimistic-${Date.now()}`,
      title: newPost.title,
      content: newPost.content,
      user_id: currentUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: {
        id: currentUserId,
        username: currentUserProfile.username,
        created_at: new Date().toISOString()
      }
    }

    return [optimisticPost, ...posts]
  }

  /**
   * Remove optimistic post after real creation
   * @param posts - Current posts array
   * @param optimisticId - ID of the optimistic post
   * @param realPost - Real post from server
   * @returns Updated posts array with real post
   */
  function replaceOptimisticPost(
    posts: PostWithAuthor[],
    optimisticId: string,
    realPost: PostWithAuthor
  ): PostWithAuthor[] {
    return posts.map(post => 
      post.id === optimisticId ? realPost : post
    )
  }

  /**
   * Remove optimistic post (if creation failed)
   * @param posts - Current posts array
   * @param optimisticId - ID of the optimistic post to remove
   * @returns Updated posts array without optimistic post
   */
  function removeOptimisticPost(
    posts: PostWithAuthor[],
    optimisticId: string
  ): PostWithAuthor[] {
    return posts.filter(post => post.id !== optimisticId)
  }

  /**
   * Optimistically update a post
   * @param posts - Current posts array
   * @param postId - ID of post to update
   * @param updates - Updates to apply
   * @returns Updated posts array with optimistic update
   */
  function optimisticallyUpdatePost(
    posts: PostWithAuthor[],
    postId: string,
    updates: Partial<Post>
  ): PostWithAuthor[] {
    return posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          ...updates,
          updated_at: new Date().toISOString()
        }
      }
      return post
    })
  }

  /**
   * Optimistically delete a post
   * @param posts - Current posts array
   * @param postId - ID of post to delete
   * @returns Updated posts array without deleted post
   */
  function optimisticallyDeletePost(
    posts: PostWithAuthor[],
    postId: string
  ): PostWithAuthor[] {
    return posts.filter(post => post.id !== postId)
  }

  /**
   * Revert optimistic delete if operation failed
   * @param posts - Current posts array
   * @param deletedPost - Post that was optimistically deleted
   * @returns Updated posts array with restored post
   */
  function revertOptimisticDelete(
    posts: PostWithAuthor[],
    deletedPost: PostWithAuthor
  ): PostWithAuthor[] {
    return [deletedPost, ...posts]
  }

  /**
   * Optimistically add a comment
   * @param comments - Current comments array
   * @param newComment - New comment to add
   * @param currentUserId - Current user's ID
   * @param currentUserProfile - Current user's profile
   * @returns Updated comments array with optimistic comment
   */
  function optimisticallyAddComment(
    comments: CommentWithAuthor[],
    newComment: { content: string; post_id: string; parent_comment_id?: string | null },
    currentUserId: string,
    currentUserProfile: { username: string }
  ): CommentWithAuthor[] {
    const optimisticComment: CommentWithAuthor = {
      id: `optimistic-comment-${Date.now()}`,
      content: newComment.content,
      post_id: newComment.post_id,
      user_id: currentUserId,
      parent_comment_id: newComment.parent_comment_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: {
        id: currentUserId,
        username: currentUserProfile.username,
        created_at: new Date().toISOString()
      }
    }

    return [optimisticComment, ...comments]
  }

  /**
   * Replace optimistic comment with real comment
   * @param comments - Current comments array
   * @param optimisticId - ID of optimistic comment
   * @param realComment - Real comment from server
   * @returns Updated comments array with real comment
   */
  function replaceOptimisticComment(
    comments: CommentWithAuthor[],
    optimisticId: string,
    realComment: CommentWithAuthor
  ): CommentWithAuthor[] {
    return comments.map(comment => 
      comment.id === optimisticId ? realComment : comment
    )
  }

  /**
   * Remove optimistic comment (if creation failed)
   * @param comments - Current comments array
   * @param optimisticId - ID of optimistic comment to remove
   * @returns Updated comments array without optimistic comment
   */
  function removeOptimisticComment(
    comments: CommentWithAuthor[],
    optimisticId: string
  ): CommentWithAuthor[] {
    return comments.filter(comment => comment.id !== optimisticId)
  }

  /**
   * Optimistically update a comment
   * @param comments - Current comments array
   * @param commentId - ID of comment to update
   * @param updates - Updates to apply
   * @returns Updated comments array with optimistic update
   */
  function optimisticallyUpdateComment(
    comments: CommentWithAuthor[],
    commentId: string,
    updates: Partial<Comment>
  ): CommentWithAuthor[] {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          ...updates,
          updated_at: new Date().toISOString()
        }
      }
      return comment
    })
  }

  /**
   * Optimistically delete a comment
   * @param comments - Current comments array
   * @param commentId - ID of comment to delete
   * @returns Updated comments array without deleted comment
   */
  function optimisticallyDeleteComment(
    comments: CommentWithAuthor[],
    commentId: string
  ): CommentWithAuthor[] {
    return comments.filter(comment => comment.id !== commentId)
  }

  /**
   * Create loading state for optimistic operations
   * @param id - ID of item being loaded
   * @param type - Type of operation (create, update, delete)
   * @returns Loading state object
   */
  function createLoadingState(
    id: string,
    type: 'create' | 'update' | 'delete'
  ) {
    return {
      id,
      type,
      isLoading: true,
      timestamp: Date.now()
    }
  }

  /**
   * Clear loading state
   * @param loadingStates - Current loading states array
   * @param id - ID of item to clear
   * @returns Updated loading states array
   */
  function clearLoadingState(
    loadingStates: Array<{ id: string; type: string; isLoading: boolean }>,
    id: string
  ) {
    return loadingStates.filter(state => state.id !== id)
  }

  return {
    // Post operations
    optimisticallyAddPost,
    replaceOptimisticPost,
    removeOptimisticPost,
    optimisticallyUpdatePost,
    optimisticallyDeletePost,
    revertOptimisticDelete,
    
    // Comment operations
    optimisticallyAddComment,
    replaceOptimisticComment,
    removeOptimisticComment,
    optimisticallyUpdateComment,
    optimisticallyDeleteComment,
    
    // Loading states
    createLoadingState,
    clearLoadingState
  }
}