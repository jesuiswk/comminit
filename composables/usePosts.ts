import type { Database } from '~/types/supabase'
import type { Post, PostWithAuthor, PostForm, ApiResponse, PaginationParams, PaginatedResponse } from '~/types'

/**
 * Composable for post data operations
 * Abstracts Supabase calls for posts
 */
export function usePosts() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const { handleSupabaseError, createSuccessResponse, createErrorResponse } = useErrorHandling()

  /**
   * Fetch posts with author information and pagination
   * @param params - Pagination parameters
   * @returns Paginated posts response
   */
  async function fetchPosts(
    params: PaginationParams = {}
  ): Promise<ApiResponse<PaginatedResponse<PostWithAuthor>>> {
    try {
      const page = params.page || 1
      const limit = params.limit || 20
      const offset = (page - 1) * limit
      const orderBy = params.orderBy || 'created_at'
      const ascending = params.ascending ?? false

      // First, get total count
      const { count, error: countError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        return createErrorResponse(handleSupabaseError(countError, 'Failed to count posts'))
      }

      // Then fetch paginated data with author info
      let query = supabase
        .from('posts')
        .select('*, author:profiles(*)')
        .order(orderBy, { ascending })
        .range(offset, offset + limit - 1)

      const { data, error } = await query

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to fetch posts'))
      }

      const total = count || 0
      const totalPages = Math.ceil(total / limit)

      const paginatedResponse: PaginatedResponse<PostWithAuthor> = {
        data: data || [],
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }

      return createSuccessResponse(paginatedResponse)
    } catch (err) {
      console.error('Error fetching posts:', err)
      return createErrorResponse<PaginatedResponse<PostWithAuthor>>(err, 'Failed to fetch posts')
    }
  }

  /**
   * Fetch a single post by ID with author information
   * @param id - Post UUID
   * @returns Post with author data
   */
  async function fetchPostById(id: string): Promise<ApiResponse<PostWithAuthor>> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, author:profiles(*)')
        .eq('id', id)
        .single()

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to fetch post'))
      }

      return createSuccessResponse(data)
    } catch (err) {
      console.error('Error fetching post:', err)
      return createErrorResponse<PostWithAuthor>(err, 'Failed to fetch post')
    }
  }

  /**
   * Ensure user has a profile, create one if missing
   * Uses the centralized useUserProfile composable
   * @returns Boolean indicating if profile exists or was created
   */
  async function ensureUserProfile(): Promise<boolean> {
    const { ensureUserProfile: ensureProfile } = useUserProfile()
    const result = await ensureProfile()
    return !!result.data
  }

  /**
   * Create a new post
   * @param postData - Post form data
   * @returns Created post
   */
  async function createPost(postData: PostForm): Promise<ApiResponse<Post>> {
    if (!user.value) {
      return createErrorResponse<Post>('User must be logged in')
    }

    try {
      // Ensure user has a profile before creating post
      const hasProfile = await ensureUserProfile()
      if (!hasProfile) {
        return createErrorResponse<Post>('Cannot create post: user profile setup failed')
      }

      const { data, error } = await supabase
        .from('posts')
        .insert({
          title: postData.title.trim(),
          content: postData.content.trim(),
          user_id: user.value.id
        })
        .select()
        .single()

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to create post'))
      }

      return createSuccessResponse(data)
    } catch (err) {
      console.error('Error creating post:', err)
      return createErrorResponse<Post>(err, 'Failed to create post')
    }
  }

  /**
   * Update an existing post
   * @param id - Post UUID
   * @param postData - Updated post data
   * @returns Updated post
   */
  async function updatePost(
    id: string, 
    postData: Partial<PostForm>
  ): Promise<ApiResponse<Post>> {
    if (!user.value) {
      return createErrorResponse<Post>('User must be logged in')
    }

    try {
      const updates: Record<string, string> = {}
      if (postData.title !== undefined) updates.title = postData.title.trim()
      if (postData.content !== undefined) updates.content = postData.content.trim()

      const { data, error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.value.id) // Ensure user owns the post
        .select()
        .single()

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to update post'))
      }

      return createSuccessResponse(data)
    } catch (err) {
      console.error('Error updating post:', err)
      return createErrorResponse<Post>(err, 'Failed to update post')
    }
  }

  /**
   * Delete a post
   * @param id - Post UUID
   * @returns Success status
   */
  async function deletePost(id: string): Promise<ApiResponse<boolean>> {
    if (!user.value) {
      return createErrorResponse<boolean>('User must be logged in')
    }

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.value.id) // Ensure user owns the post

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to delete post'))
      }

      return createSuccessResponse(true)
    } catch (err) {
      console.error('Error deleting post:', err)
      return createErrorResponse<boolean>(err, 'Failed to delete post')
    }
  }

  /**
   * Check if the current user can edit a post
   * @param postUserId - The user_id of the post
   * @returns Boolean indicating edit permission
   */
  function canEditPost(postUserId: string): boolean {
    return user.value?.id === postUserId
  }

  return {
    fetchPosts,
    fetchPostById,
    createPost,
    updatePost,
    deletePost,
    canEditPost
  }
}
