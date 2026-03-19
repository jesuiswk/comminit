import type { Database } from '~/types/supabase'
import type { PostWithAuthor, Profile, CommentWithAuthor, SearchParams, PaginatedResponse, ApiResponse } from '~/types'

/**
 * Composable for search operations
 * Provides search functionality across posts, users, and comments
 */
export function useSearch() {
  const supabase = useSupabaseClient<Database>()

  /**
   * Search across posts, users, and comments
   * @param params - Search parameters
   * @returns Search results
   */
  async function search(
    params: SearchParams
  ): Promise<ApiResponse<PaginatedResponse<any>>> {
    try {
      const { query, type = 'posts', page = 1, limit = 20 } = params
      const offset = (page - 1) * limit

      if (!query.trim()) {
        return {
          data: {
            data: [],
            total: 0,
            page,
            limit,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false
          },
          error: null
        }
      }

      switch (type) {
        case 'posts':
          return await searchPosts(query, page, limit, offset)
        case 'users':
          return await searchUsers(query, page, limit, offset)
        case 'comments':
          return await searchComments(query, page, limit, offset)
        default:
          return {
            data: null,
            error: { message: 'Invalid search type' }
          }
      }
    } catch (err) {
      console.error('Search error:', err)
      return {
        data: null,
        error: { message: 'Failed to perform search' }
      }
    }
  }

  /**
   * Search posts by title and content
   */
  async function searchPosts(
    query: string,
    page: number,
    limit: number,
    offset: number
  ): Promise<ApiResponse<PaginatedResponse<PostWithAuthor>>> {
    try {
      // First, get total count
      const { count, error: countError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)

      if (countError) {
        return { data: null, error: { message: countError.message, code: countError.code } }
      }

      // Then fetch paginated data with author info
      const { data, error } = await supabase
        .from('posts')
        .select('*, author:profiles(*)')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } }
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

      return { data: paginatedResponse, error: null }
    } catch (err) {
      console.error('Post search error:', err)
      return {
        data: null,
        error: { message: 'Failed to search posts' }
      }
    }
  }

  /**
   * Search users by username
   */
  async function searchUsers(
    query: string,
    page: number,
    limit: number,
    offset: number
  ): Promise<ApiResponse<PaginatedResponse<Profile>>> {
    try {
      // First, get total count
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .ilike('username', `%${query}%`)

      if (countError) {
        return { data: null, error: { message: countError.message, code: countError.code } }
      }

      // Then fetch paginated data
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${query}%`)
        .order('username', { ascending: true })
        .range(offset, offset + limit - 1)

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } }
      }

      const total = count || 0
      const totalPages = Math.ceil(total / limit)

      const paginatedResponse: PaginatedResponse<Profile> = {
        data: data || [],
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }

      return { data: paginatedResponse, error: null }
    } catch (err) {
      console.error('User search error:', err)
      return {
        data: null,
        error: { message: 'Failed to search users' }
      }
    }
  }

  /**
   * Search comments by content
   */
  async function searchComments(
    query: string,
    page: number,
    limit: number,
    offset: number
  ): Promise<ApiResponse<PaginatedResponse<CommentWithAuthor>>> {
    try {
      // First, get total count
      const { count, error: countError } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .ilike('content', `%${query}%`)

      if (countError) {
        return { data: null, error: { message: countError.message, code: countError.code } }
      }

      // Then fetch paginated data with author info
      const { data, error } = await supabase
        .from('comments')
        .select('*, author:profiles(*)')
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } }
      }

      const total = count || 0
      const totalPages = Math.ceil(total / limit)

      const paginatedResponse: PaginatedResponse<CommentWithAuthor> = {
        data: data || [],
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }

      return { data: paginatedResponse, error: null }
    } catch (err) {
      console.error('Comment search error:', err)
      return {
        data: null,
        error: { message: 'Failed to search comments' }
      }
    }
  }

  /**
   * Get search suggestions based on query
   */
  async function getSuggestions(query: string): Promise<ApiResponse<{
    posts: PostWithAuthor[]
    users: Profile[]
    comments: CommentWithAuthor[]
  }>> {
    try {
      if (!query.trim()) {
        return {
          data: { posts: [], users: [], comments: [] },
          error: null
        }
      }

      // Fetch limited suggestions from each category
      const [postsResult, usersResult, commentsResult] = await Promise.all([
        supabase
          .from('posts')
          .select('*, author:profiles(*)')
          .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
          .limit(3),
        supabase
          .from('profiles')
          .select('*')
          .ilike('username', `%${query}%`)
          .limit(3),
        supabase
          .from('comments')
          .select('*, author:profiles(*)')
          .ilike('content', `%${query}%`)
          .limit(3)
      ])

      const suggestions = {
        posts: postsResult.data || [],
        users: usersResult.data || [],
        comments: commentsResult.data || []
      }

      return { data: suggestions, error: null }
    } catch (err) {
      console.error('Suggestions error:', err)
      return {
        data: null,
        error: { message: 'Failed to get search suggestions' }
      }
    }
  }

  /**
   * Get trending/popular search terms
   */
  async function getTrendingSearches(): Promise<ApiResponse<string[]>> {
    try {
      // For now, return some example trending terms
      // In a real app, you might track search frequency in a separate table
      const trendingTerms = [
        'getting started',
        'best practices',
        'tutorial',
        'help',
        'feedback'
      ]

      return { data: trendingTerms, error: null }
    } catch (err) {
      console.error('Trending searches error:', err)
      return {
        data: null,
        error: { message: 'Failed to get trending searches' }
      }
    }
  }

  return {
    search,
    searchPosts,
    searchUsers,
    searchComments,
    getSuggestions,
    getTrendingSearches
  }
}