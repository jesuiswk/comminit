import type { Database } from '~/types/supabase'
import type { ApiResponse } from '~/types'

interface LikeStatus {
  liked: boolean
  count: number
}

interface LikeCount {
  post_id?: string
  comment_id?: string
  count: number
}

/**
 * Composable for likes operations
 * Provides functionality for liking/unliking posts and comments
 * Uses the `likes` table and associated RPC functions
 */
export function useLikes() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const { handleSupabaseError, createSuccessResponse, createErrorResponse } = useErrorHandling()

  /**
   * Toggle like on a post
   * @param postId - Post ID
   * @returns Like status after toggle (liked boolean)
   */
  async function togglePostLike(postId: string): Promise<ApiResponse<LikeStatus>> {
    if (!user.value) {
      return createErrorResponse<LikeStatus>('User must be logged in')
    }

    try {
      // Use the secure toggle_like RPC (uses auth.uid() internally)
      const { data, error } = await supabase.rpc('toggle_like', {
        p_post_id: postId,
        p_comment_id: null
      })

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to toggle like'))
      }

      // data is true if liked, false if unliked
      const liked = data === true

      // Get updated like count
      const countResponse = await getPostLikeCount(postId)
      const count = countResponse.data || 0

      return createSuccessResponse({ liked, count })
    } catch (err) {
      console.error('Error toggling post like:', err)
      return createErrorResponse<LikeStatus>(err, 'Failed to toggle like')
    }
  }

  /**
   * Toggle like on a comment
   * @param commentId - Comment ID
   * @returns Like status after toggle (liked boolean)
   */
  async function toggleCommentLike(commentId: string): Promise<ApiResponse<LikeStatus>> {
    if (!user.value) {
      return createErrorResponse<LikeStatus>('User must be logged in')
    }

    try {
      // Use the secure toggle_like RPC (uses auth.uid() internally)
      const { data, error } = await supabase.rpc('toggle_like', {
        p_post_id: null,
        p_comment_id: commentId
      })

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to toggle like'))
      }

      // data is true if liked, false if unliked
      const liked = data === true

      // Get updated like count
      const countResponse = await getCommentLikeCount(commentId)
      const count = countResponse.data || 0

      return createSuccessResponse({ liked, count })
    } catch (err) {
      console.error('Error toggling comment like:', err)
      return createErrorResponse<LikeStatus>(err, 'Failed to toggle like')
    }
  }

  /**
   * Get like count for a post
   * @param postId - Post ID
   * @returns Like count
   */
  async function getPostLikeCount(postId: string): Promise<ApiResponse<number>> {
    try {
      const { data, error } = await supabase.rpc('get_like_count', {
        target_post_id: postId,
        target_comment_id: null
      })

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to get like count'))
      }

      const count = typeof data === 'number' ? data : 0
      return createSuccessResponse(count)
    } catch (err) {
      console.error('Error getting post like count:', err)
      return createErrorResponse<number>(err, 'Failed to get like count')
    }
  }

  /**
   * Get like count for a comment
   * @param commentId - Comment ID
   * @returns Like count
   */
  async function getCommentLikeCount(commentId: string): Promise<ApiResponse<number>> {
    try {
      const { data, error } = await supabase.rpc('get_like_count', {
        target_post_id: null,
        target_comment_id: commentId
      })

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to get like count'))
      }

      const count = typeof data === 'number' ? data : 0
      return createSuccessResponse(count)
    } catch (err) {
      console.error('Error getting comment like count:', err)
      return createErrorResponse<number>(err, 'Failed to get like count')
    }
  }

  /**
   * Check if current user has liked a post
   * @param postId - Post ID
   * @returns Whether user has liked the post
   */
  async function hasLikedPost(postId: string): Promise<ApiResponse<boolean>> {
    if (!user.value) {
      return createSuccessResponse(false)
    }

    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.value.id)
        .eq('post_id', postId)
        .maybeSingle()

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to check like status'))
      }

      return createSuccessResponse(data !== null)
    } catch (err) {
      console.error('Error checking post like status:', err)
      return createErrorResponse<boolean>(err, 'Failed to check like status')
    }
  }

  /**
   * Check if current user has liked a comment
   * @param commentId - Comment ID
   * @returns Whether user has liked the comment
   */
  async function hasLikedComment(commentId: string): Promise<ApiResponse<boolean>> {
    if (!user.value) {
      return createSuccessResponse(false)
    }

    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.value.id)
        .eq('comment_id', commentId)
        .maybeSingle()

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to check like status'))
      }

      return createSuccessResponse(data !== null)
    } catch (err) {
      console.error('Error checking comment like status:', err)
      return createErrorResponse<boolean>(err, 'Failed to check like status')
    }
  }

  /**
   * Get like counts for multiple posts
   * @param postIds - Array of Post IDs
   * @returns Record of post ID to like count
   */
  async function getPostLikeCounts(postIds: string[]): Promise<ApiResponse<Record<string, number>>> {
    try {
      if (postIds.length === 0) {
        return createSuccessResponse({})
      }

      const { data, error } = await supabase
        .from('likes')
        .select('post_id')
        .in('post_id', postIds)

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to get like counts'))
      }

      // Count likes per post
      const counts: Record<string, number> = {}
      postIds.forEach(id => {
        counts[id] = 0
      })

      data?.forEach(like => {
        if (like.post_id && like.post_id in counts) {
          counts[like.post_id]++
        }
      })

      return createSuccessResponse(counts)
    } catch (err) {
      console.error('Error getting post like counts:', err)
      return createErrorResponse<Record<string, number>>(err, 'Failed to get like counts')
    }
  }

  /**
   * Get like status (liked + count) for a post
   * @param postId - Post ID
   * @returns Like status with liked boolean and count
   */
  async function getPostLikeStatus(postId: string): Promise<ApiResponse<LikeStatus>> {
    try {
      const [countResponse, likedResponse] = await Promise.all([
        getPostLikeCount(postId),
        hasLikedPost(postId)
      ])

      if (countResponse.error) {
        return createErrorResponse<LikeStatus>(countResponse.error.message)
      }

      if (likedResponse.error) {
        return createErrorResponse<LikeStatus>(likedResponse.error.message)
      }

      return createSuccessResponse({
        liked: likedResponse.data || false,
        count: countResponse.data || 0
      })
    } catch (err) {
      console.error('Error getting post like status:', err)
      return createErrorResponse<LikeStatus>(err, 'Failed to get like status')
    }
  }

  /**
   * Get like status (liked + count) for a comment
   * @param commentId - Comment ID
   * @returns Like status with liked boolean and count
   */
  async function getCommentLikeStatus(commentId: string): Promise<ApiResponse<LikeStatus>> {
    try {
      const [countResponse, likedResponse] = await Promise.all([
        getCommentLikeCount(commentId),
        hasLikedComment(commentId)
      ])

      if (countResponse.error) {
        return createErrorResponse<LikeStatus>(countResponse.error.message)
      }

      if (likedResponse.error) {
        return createErrorResponse<LikeStatus>(likedResponse.error.message)
      }

      return createSuccessResponse({
        liked: likedResponse.data || false,
        count: countResponse.data || 0
      })
    } catch (err) {
      console.error('Error getting comment like status:', err)
      return createErrorResponse<LikeStatus>(err, 'Failed to get like status')
    }
  }

  /**
   * Get most liked posts (for trending/featured content)
   * @param limit - Maximum number of posts to return
   * @returns Array of post IDs with like counts
   */
  async function getMostLikedPosts(limit: number = 10): Promise<ApiResponse<LikeCount[]>> {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('post_id')
        .not('post_id', 'is', null)

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to get most liked posts'))
      }

      // Count likes per post
      const countMap: Record<string, number> = {}
      data?.forEach(like => {
        if (like.post_id) {
          countMap[like.post_id] = (countMap[like.post_id] || 0) + 1
        }
      })

      // Sort by count and limit
      const result: LikeCount[] = Object.entries(countMap)
        .map(([post_id, count]) => ({ post_id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)

      return createSuccessResponse(result)
    } catch (err) {
      console.error('Error getting most liked posts:', err)
      return createErrorResponse<LikeCount[]>(err, 'Failed to get most liked posts')
    }
  }

  // Legacy aliases for backward compatibility
  const toggleLike = togglePostLike
  const getLikeCount = getPostLikeCount
  const hasLiked = hasLikedPost
  const getLikeCounts = getPostLikeCounts
  const getLikeStatus = getPostLikeStatus

  return {
    // Post likes
    togglePostLike,
    getPostLikeCount,
    hasLikedPost,
    getPostLikeCounts,
    getPostLikeStatus,
    
    // Comment likes
    toggleCommentLike,
    getCommentLikeCount,
    hasLikedComment,
    getCommentLikeStatus,
    
    // Trending
    getMostLikedPosts,
    
    // Legacy aliases
    toggleLike,
    getLikeCount,
    hasLiked,
    getLikeCounts,
    getLikeStatus
  }
}
