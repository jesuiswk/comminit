import type { Post, PostWithAuthor, PostForm, ApiResponse } from '~/types'

/**
 * Composable for post data operations
 * Abstracts Supabase calls for posts
 */
export function usePosts() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  /**
   * Fetch all posts with author information
   * @param options - Optional query parameters
   * @returns Array of posts with author data
   */
  async function fetchPosts(options?: { 
    limit?: number 
    orderBy?: 'created_at' | 'updated_at'
    ascending?: boolean 
  }): Promise<ApiResponse<PostWithAuthor[]>> {
    try {
      let query = supabase
        .from('posts')
        .select('*, author:profiles(username)')
        .order(options?.orderBy || 'created_at', { 
          ascending: options?.ascending ?? false 
        })

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } }
      }

      return { data: data || [], error: null }
    } catch (err) {
      console.error('Error fetching posts:', err)
      return { 
        data: null, 
        error: { message: 'Failed to fetch posts' } 
      }
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
        .select('*, author:profiles(username)')
        .eq('id', id)
        .single()

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } }
      }

      return { data, error: null }
    } catch (err) {
      console.error('Error fetching post:', err)
      return { 
        data: null, 
        error: { message: 'Failed to fetch post' } 
      }
    }
  }

  /**
   * Create a new post
   * @param postData - Post form data
   * @returns Created post
   */
  async function createPost(postData: PostForm): Promise<ApiResponse<Post>> {
    if (!user.value) {
      return { data: null, error: { message: 'User must be logged in' } }
    }

    try {
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
        return { data: null, error: { message: error.message, code: error.code } }
      }

      return { data, error: null }
    } catch (err) {
      console.error('Error creating post:', err)
      return { 
        data: null, 
        error: { message: 'Failed to create post' } 
      }
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
      return { data: null, error: { message: 'User must be logged in' } }
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
        return { data: null, error: { message: error.message, code: error.code } }
      }

      return { data, error: null }
    } catch (err) {
      console.error('Error updating post:', err)
      return { 
        data: null, 
        error: { message: 'Failed to update post' } 
      }
    }
  }

  /**
   * Delete a post
   * @param id - Post UUID
   * @returns Success status
   */
  async function deletePost(id: string): Promise<ApiResponse<boolean>> {
    if (!user.value) {
      return { data: null, error: { message: 'User must be logged in' } }
    }

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.value.id) // Ensure user owns the post

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } }
      }

      return { data: true, error: null }
    } catch (err) {
      console.error('Error deleting post:', err)
      return { 
        data: null, 
        error: { message: 'Failed to delete post' } 
      }
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
