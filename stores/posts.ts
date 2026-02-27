import { defineStore } from 'pinia'
import type { Post, PostWithAuthor, PostForm, ApiResponse } from '~/types'

interface PostsState {
  posts: PostWithAuthor[]
  currentPost: PostWithAuthor | null
  loading: boolean
  error: string | null
}

/**
 * Posts Store - Manages post state and operations
 */
export const usePostsStore = defineStore('posts', {
  state: (): PostsState => ({
    posts: [],
    currentPost: null,
    loading: false,
    error: null
  }),

  getters: {
    allPosts: (state): PostWithAuthor[] => state.posts,
    getPostById: (state) => (id: string): PostWithAuthor | undefined => {
      return state.posts.find(post => post.id === id)
    },
    isLoading: (state): boolean => state.loading,
    hasError: (state): boolean => !!state.error
  },

  actions: {
    /**
     * Fetch all posts
     */
    async fetchPosts(options?: { 
      limit?: number 
      orderBy?: 'created_at' | 'updated_at'
      ascending?: boolean 
    }): Promise<ApiResponse<PostWithAuthor[]>> {
      this.loading = true
      this.error = null

      const supabase = useSupabaseClient()

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
          this.error = error.message
          return { data: null, error: { message: error.message, code: error.code } }
        }

        this.posts = data || []
        return { data: this.posts, error: null }
      } catch (err) {
        const message = 'Failed to fetch posts'
        this.error = message
        return { data: null, error: { message } }
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch a single post by ID
     */
    async fetchPostById(id: string): Promise<ApiResponse<PostWithAuthor>> {
      this.loading = true
      this.error = null

      const supabase = useSupabaseClient()

      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*, author:profiles(username)')
          .eq('id', id)
          .single()

        if (error) {
          this.error = error.message
          return { data: null, error: { message: error.message, code: error.code } }
        }

        this.currentPost = data
        return { data, error: null }
      } catch (err) {
        const message = 'Failed to fetch post'
        this.error = message
        return { data: null, error: { message } }
      } finally {
        this.loading = false
      }
    },

    /**
     * Create a new post
     */
    async createPost(postData: PostForm, userId: string): Promise<ApiResponse<Post>> {
      this.loading = true
      this.error = null

      const supabase = useSupabaseClient()

      try {
        const { data, error } = await supabase
          .from('posts')
          .insert({
            title: postData.title.trim(),
            content: postData.content.trim(),
            user_id: userId
          })
          .select()
          .single()

        if (error) {
          this.error = error.message
          return { data: null, error: { message: error.message, code: error.code } }
        }

        // Refresh posts list to include the new post
        await this.fetchPosts()

        return { data, error: null }
      } catch (err) {
        const message = 'Failed to create post'
        this.error = message
        return { data: null, error: { message } }
      } finally {
        this.loading = false
      }
    },

    /**
     * Update an existing post
     */
    async updatePost(
      id: string,
      postData: Partial<PostForm>,
      userId: string
    ): Promise<ApiResponse<Post>> {
      this.loading = true
      this.error = null

      const supabase = useSupabaseClient()

      try {
        const updates: Record<string, string> = {}
        if (postData.title !== undefined) updates.title = postData.title.trim()
        if (postData.content !== undefined) updates.content = postData.content.trim()

        const { data, error } = await supabase
          .from('posts')
          .update(updates)
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single()

        if (error) {
          this.error = error.message
          return { data: null, error: { message: error.message, code: error.code } }
        }

        // Update local state
        const index = this.posts.findIndex(p => p.id === id)
        if (index !== -1) {
          this.posts[index] = { ...this.posts[index], ...data }
        }
        if (this.currentPost?.id === id) {
          this.currentPost = { ...this.currentPost, ...data }
        }

        return { data, error: null }
      } catch (err) {
        const message = 'Failed to update post'
        this.error = message
        return { data: null, error: { message } }
      } finally {
        this.loading = false
      }
    },

    /**
     * Delete a post
     */
    async deletePost(id: string, userId: string): Promise<ApiResponse<boolean>> {
      this.loading = true
      this.error = null

      const supabase = useSupabaseClient()

      try {
        const { error } = await supabase
          .from('posts')
          .delete()
          .eq('id', id)
          .eq('user_id', userId)

        if (error) {
          this.error = error.message
          return { data: null, error: { message: error.message, code: error.code } }
        }

        // Remove from local state
        this.posts = this.posts.filter(p => p.id !== id)
        if (this.currentPost?.id === id) {
          this.currentPost = null
        }

        return { data: true, error: null }
      } catch (err) {
        const message = 'Failed to delete post'
        this.error = message
        return { data: null, error: { message } }
      } finally {
        this.loading = false
      }
    },

    /**
     * Clear the current post
     */
    clearCurrentPost() {
      this.currentPost = null
    },

    /**
     * Clear any errors
     */
    clearError() {
      this.error = null
    }
  }
})
