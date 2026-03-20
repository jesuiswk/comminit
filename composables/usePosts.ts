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

      // Combine count and data into single query
      // Only fetch published posts (draft = false) by default
      const { data, error, count } = await supabase
        .from('posts')
        .select('*, author:profiles(*)', { count: 'exact' })
        .eq('draft', false) // Only published posts
        .order(orderBy, { ascending })
        .range(offset, offset + limit - 1)

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

      const postDataToInsert: any = {
        title: postData.title.trim(),
        content: postData.content.trim(),
        user_id: user.value.id
      }

      // Only add category if provided
      if (postData.category !== undefined) {
        postDataToInsert.category = postData.category?.trim() || null
      }

      const { data, error } = await supabase
        .from('posts')
        .insert(postDataToInsert)
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
      const updates: Record<string, any> = {}
      if (postData.title !== undefined) updates.title = postData.title.trim()
      if (postData.content !== undefined) updates.content = postData.content.trim()
      if (postData.category !== undefined) updates.category = postData.category?.trim() || null

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

  /**
   * Save a post as draft
   * @param postData - Post form data
   * @returns Draft post ID or null if failed
   */
  async function saveDraft(postData: PostForm): Promise<ApiResponse<string | null>> {
    if (!user.value) {
      return createErrorResponse<string | null>('User must be logged in')
    }

    try {
      // Ensure user has a profile before saving draft
      const hasProfile = await ensureUserProfile()
      if (!hasProfile) {
        return createErrorResponse<string | null>('Cannot save draft: user profile setup failed')
      }

      const { data, error } = await supabase
        .rpc('save_post_as_draft', {
          p_title: postData.title.trim(),
          p_content: postData.content.trim(),
          p_user_id: user.value.id
        })

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to save draft'))
      }

      return createSuccessResponse(data)
    } catch (err) {
      console.error('Error saving draft:', err)
      return createErrorResponse<string | null>(err, 'Failed to save draft')
    }
  }

  /**
   * Update a draft post
   * @param draftId - Draft post ID
   * @param postData - Updated post data
   * @returns Success status
   */
  async function updateDraft(
    draftId: string,
    postData: PostForm
  ): Promise<ApiResponse<boolean>> {
    if (!user.value) {
      return createErrorResponse<boolean>('User must be logged in')
    }

    try {
      const { data, error } = await supabase
        .rpc('update_draft_post', {
          p_post_id: draftId,
          p_title: postData.title.trim(),
          p_content: postData.content.trim(),
          p_user_id: user.value.id
        })

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to update draft'))
      }

      return createSuccessResponse(data)
    } catch (err) {
      console.error('Error updating draft:', err)
      return createErrorResponse<boolean>(err, 'Failed to update draft')
    }
  }

  /**
   * Publish a draft post
   * @param draftId - Draft post ID
   * @returns Success status
   */
  async function publishDraft(draftId: string): Promise<ApiResponse<boolean>> {
    if (!user.value) {
      return createErrorResponse<boolean>('User must be logged in')
    }

    try {
      const { data, error } = await supabase
        .rpc('publish_draft', {
          p_post_id: draftId,
          p_user_id: user.value.id
        })

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to publish draft'))
      }

      return createSuccessResponse(data)
    } catch (err) {
      console.error('Error publishing draft:', err)
      return createErrorResponse<boolean>(err, 'Failed to publish draft')
    }
  }

  /**
   * Get user's draft posts
   * @param limit - Maximum number of drafts to fetch
   * @param offset - Offset for pagination
   * @returns List of draft posts
   */
  async function getUserDrafts(
    limit: number = 20,
    offset: number = 0
  ): Promise<ApiResponse<Array<{
    id: string
    title: string
    content: string
    created_at: string
    updated_at: string
  }>>> {
    if (!user.value) {
      return createErrorResponse('User must be logged in')
    }

    try {
      const { data, error } = await supabase
        .rpc('get_user_drafts', {
          p_user_id: user.value.id,
          p_limit: limit,
          p_offset: offset
        })

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to fetch drafts'))
      }

      return createSuccessResponse(data || [])
    } catch (err) {
      console.error('Error fetching drafts:', err)
      return createErrorResponse(err, 'Failed to fetch drafts')
    }
  }

  /**
   * Count user's draft posts
   * @returns Number of draft posts
   */
  async function countUserDrafts(): Promise<ApiResponse<number>> {
    if (!user.value) {
      return createErrorResponse<number>('User must be logged in')
    }

    try {
      const { data, error } = await supabase
        .rpc('count_user_drafts', {
          p_user_id: user.value.id
        })

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to count drafts'))
      }

      return createSuccessResponse(data || 0)
    } catch (err) {
      console.error('Error counting drafts:', err)
      return createErrorResponse<number>(err, 'Failed to count drafts')
    }
  }

  /**
   * Delete a draft post
   * @param draftId - Draft post ID
   * @returns Success status
   */
  async function deleteDraft(draftId: string): Promise<ApiResponse<boolean>> {
    if (!user.value) {
      return createErrorResponse<boolean>('User must be logged in')
    }

    try {
      const { data, error } = await supabase
        .rpc('delete_draft', {
          p_post_id: draftId,
          p_user_id: user.value.id
        })

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to delete draft'))
      }

      return createSuccessResponse(data)
    } catch (err) {
      console.error('Error deleting draft:', err)
      return createErrorResponse<boolean>(err, 'Failed to delete draft')
    }
  }

  /**
   * Create or update a post with draft support
   * This is a convenience method that handles both creating new posts and updating drafts
   * @param postData - Post form data
   * @param draftId - Optional draft ID to update (if null, creates new draft)
   * @returns Post ID and whether it's a draft
   */
  async function savePostWithDraft(
    postData: PostForm,
    draftId: string | null = null
  ): Promise<ApiResponse<{ id: string; isDraft: boolean }>> {
    if (!user.value) {
      return createErrorResponse<{ id: string; isDraft: boolean }>('User must be logged in')
    }

    try {
      // Ensure user has a profile
      const hasProfile = await ensureUserProfile()
      if (!hasProfile) {
        return createErrorResponse<{ id: string; isDraft: boolean }>('Cannot save post: user profile setup failed')
      }

      let postId: string
      let isDraft = false

      if (draftId) {
        // Update existing draft
        const { data: updateResult, error: updateError } = await supabase
          .rpc('update_draft_post', {
            p_post_id: draftId,
            p_title: postData.title.trim(),
            p_content: postData.content.trim(),
            p_user_id: user.value.id
          })

        if (updateError) {
          return createErrorResponse(handleSupabaseError(updateError, 'Failed to update draft'))
        }

        if (!updateResult) {
          return createErrorResponse<{ id: string; isDraft: boolean }>('Draft not found or not owned by user')
        }

        postId = draftId
        isDraft = true
      } else {
        // Create new draft
        const { data: createResult, error: createError } = await supabase
          .rpc('save_post_as_draft', {
            p_title: postData.title.trim(),
            p_content: postData.content.trim(),
            p_user_id: user.value.id
          })

        if (createError) {
          return createErrorResponse(handleSupabaseError(createError, 'Failed to save draft'))
        }

        if (!createResult) {
          return createErrorResponse<{ id: string; isDraft: boolean }>('Failed to create draft')
        }

        postId = createResult
        isDraft = true
      }

      return createSuccessResponse({ id: postId, isDraft })
    } catch (err) {
      console.error('Error saving post with draft:', err)
      return createErrorResponse<{ id: string; isDraft: boolean }>(err, 'Failed to save post')
    }
  }

  /**
   * Get all unique post categories with post counts
   * @returns List of categories with post counts
   */
  async function getPostCategories(): Promise<ApiResponse<Array<{
    category: string
    post_count: number
  }>>> {
    try {
      const { data, error } = await supabase
        .rpc('get_post_categories')

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to fetch categories'))
      }

      return createSuccessResponse(data || [])
    } catch (err) {
      console.error('Error fetching categories:', err)
      return createErrorResponse(err, 'Failed to fetch categories')
    }
  }

  /**
   * Get popular categories (most used categories)
   * @param limit - Maximum number of categories to fetch
   * @returns List of popular categories with post counts
   */
  async function getPopularCategories(limit: number = 10): Promise<ApiResponse<Array<{
    category: string
    post_count: number
  }>>> {
    try {
      const { data, error } = await supabase
        .rpc('get_popular_categories', {
          p_limit: limit
        })

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to fetch popular categories'))
      }

      return createSuccessResponse(data || [])
    } catch (err) {
      console.error('Error fetching popular categories:', err)
      return createErrorResponse(err, 'Failed to fetch popular categories')
    }
  }

  /**
   * Get posts by category with pagination
   * @param category - Category to filter by
   * @param params - Pagination parameters
   * @returns Paginated posts response for the category
   */
  async function fetchPostsByCategory(
    category: string,
    params: PaginationParams = {}
  ): Promise<ApiResponse<PaginatedResponse<PostWithAuthor>>> {
    try {
      const page = params.page || 1
      const limit = params.limit || 20
      const offset = (page - 1) * limit

      // First, get total count for the category
      const { data: countData, error: countError } = await supabase
        .rpc('count_posts_by_category', {
          p_category: category
        })

      if (countError) {
        return createErrorResponse(handleSupabaseError(countError, 'Failed to count posts by category'))
      }

      // Then fetch paginated posts for the category
      const { data, error } = await supabase
        .rpc('get_posts_by_category', {
          p_category: category,
          p_limit: limit,
          p_offset: offset
        })

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to fetch posts by category'))
      }

      // Transform the data to match PostWithAuthor type
      const postsWithAuthor: PostWithAuthor[] = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        title: item.title,
        content: item.content,
        created_at: item.created_at,
        updated_at: item.updated_at,
        draft: item.draft,
        category: item.category,
        author: {
          id: item.author_id,
          username: item.author_username,
          avatar_url: item.author_avatar_url,
          created_at: item.created_at // Note: This is post created_at, not author created_at
        }
      }))

      const total = countData || 0
      const totalPages = Math.ceil(total / limit)

      const paginatedResponse: PaginatedResponse<PostWithAuthor> = {
        data: postsWithAuthor,
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }

      return createSuccessResponse(paginatedResponse)
    } catch (err) {
      console.error('Error fetching posts by category:', err)
      return createErrorResponse<PaginatedResponse<PostWithAuthor>>(err, 'Failed to fetch posts by category')
    }
  }

  /**
   * Create a new post with category
   * @param postData - Post form data with category
   * @returns Created post
   */
  async function createPostWithCategory(postData: PostForm): Promise<ApiResponse<Post>> {
    if (!user.value) {
      return createErrorResponse<Post>('User must be logged in')
    }

    try {
      // Ensure user has a profile before creating post
      const hasProfile = await ensureUserProfile()
      if (!hasProfile) {
        return createErrorResponse<Post>('Cannot create post: user profile setup failed')
      }

      const postDataToInsert: any = {
        title: postData.title.trim(),
        content: postData.content.trim(),
        user_id: user.value.id
      }

      // Only add category if provided
      if (postData.category !== undefined) {
        postDataToInsert.category = postData.category?.trim() || null
      }

      const { data, error } = await supabase
        .from('posts')
        .insert(postDataToInsert)
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
   * Update an existing post with category
   * @param id - Post UUID
   * @param postData - Updated post data with category
   * @returns Updated post
   */
  async function updatePostWithCategory(
    id: string, 
    postData: Partial<PostForm>
  ): Promise<ApiResponse<Post>> {
    if (!user.value) {
      return createErrorResponse<Post>('User must be logged in')
    }

    try {
      const updates: Record<string, any> = {}
      if (postData.title !== undefined) updates.title = postData.title.trim()
      if (postData.content !== undefined) updates.content = postData.content.trim()
      if (postData.category !== undefined) updates.category = postData.category?.trim() || null

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

  return {
    fetchPosts,
    fetchPostById,
    createPost,
    updatePost,
    deletePost,
    canEditPost,
    saveDraft,
    updateDraft,
    publishDraft,
    getUserDrafts,
    countUserDrafts,
    deleteDraft,
    savePostWithDraft,
    getPostCategories,
    getPopularCategories,
    fetchPostsByCategory,
    createPostWithCategory,
    updatePostWithCategory
  }
}
