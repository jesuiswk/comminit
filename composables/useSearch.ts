import type { Database } from '~/types/supabase'
import type { PostWithAuthor, Profile, CommentWithAuthor, SearchParams, PaginatedResponse, ApiResponse } from '~/types'

// Discriminated union type for search results
type SearchResult = PostWithAuthor | Profile | CommentWithAuthor

/**
 * Composable for search operations
 * Provides search functionality across posts, users, and comments
 */
export function useSearch() {
  const supabase = useSupabaseClient<Database>()
  const { handleSupabaseError, createSuccessResponse, createErrorResponse } = useErrorHandling()

  /**
   * Search across posts, users, and comments
   * @param params - Search parameters
   * @returns Search results
   */
  async function search(
    params: SearchParams
  ): Promise<ApiResponse<PaginatedResponse<SearchResult>>> {
    try {
      const { query, type = 'posts', page = 1, limit = 20 } = params
      const offset = (page - 1) * limit

      if (!query.trim()) {
        return createSuccessResponse<PaginatedResponse<SearchResult>>({
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        })
      }

      // Log the search query for trending searches
      await logSearchQuery(query, type)

      switch (type) {
        case 'posts':
          return await searchPosts(query, page, limit, offset)
        case 'users':
          return await searchUsers(query, page, limit, offset)
        case 'comments':
          return await searchComments(query, page, limit, offset)
        default:
          return createErrorResponse<PaginatedResponse<SearchResult>>('Invalid search type')
      }
    } catch (err) {
      console.error('Search error:', err)
      return createErrorResponse<PaginatedResponse<SearchResult>>(err, 'Failed to perform search')
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
      // Use full-text search with textSearch
      const { data, error, count } = await supabase
        .from('posts')
        .select('*, author:profiles(*)', { count: 'exact' })
        .textSearch('search_vector', query, {
          type: 'websearch',
          config: 'english'
        })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to search posts'))
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
      console.error('Post search error:', err)
      return createErrorResponse<PaginatedResponse<PostWithAuthor>>(err, 'Failed to search posts')
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
        return createErrorResponse(handleSupabaseError(countError, 'Failed to count users'))
      }

      // Then fetch paginated data
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${query}%`)
        .order('username', { ascending: true })
        .range(offset, offset + limit - 1)

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to search users'))
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

      return createSuccessResponse(paginatedResponse)
    } catch (err) {
      console.error('User search error:', err)
      return createErrorResponse<PaginatedResponse<Profile>>(err, 'Failed to search users')
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
      // Use full-text search with textSearch
      const { data, error, count } = await supabase
        .from('comments')
        .select('*, author:profiles(*)', { count: 'exact' })
        .textSearch('search_vector', query, {
          type: 'websearch',
          config: 'english'
        })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to search comments'))
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

      return createSuccessResponse(paginatedResponse)
    } catch (err) {
      console.error('Comment search error:', err)
      return createErrorResponse<PaginatedResponse<CommentWithAuthor>>(err, 'Failed to search comments')
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
        return createSuccessResponse({
          posts: [],
          users: [],
          comments: []
        })
      }

      // Fetch limited suggestions from each category using full-text search
      const [postsResult, usersResult, commentsResult] = await Promise.all([
        supabase
          .from('posts')
          .select('*, author:profiles(*)')
          .textSearch('search_vector', query, {
            type: 'websearch',
            config: 'english'
          })
          .limit(3),
        supabase
          .from('profiles')
          .select('*')
          .ilike('username', `%${query}%`)
          .limit(3),
        supabase
          .from('comments')
          .select('*, author:profiles(*)')
          .textSearch('search_vector', query, {
            type: 'websearch',
            config: 'english'
          })
          .limit(3)
      ])

      const suggestions = {
        posts: postsResult.data || [],
        users: usersResult.data || [],
        comments: commentsResult.data || []
      }

      return createSuccessResponse(suggestions)
    } catch (err) {
      console.error('Suggestions error:', err)
      return createErrorResponse<{
        posts: PostWithAuthor[]
        users: Profile[]
        comments: CommentWithAuthor[]
      }>(err, 'Failed to get search suggestions')
    }
  }

  /**
   * Log a search query for trending searches
   */
  async function logSearchQuery(query: string, searchType: string = 'posts'): Promise<void> {
    try {
      const user = useSupabaseUser()
      const userId = user.value?.id || null
      
      // Don't log empty queries
      if (!query.trim()) return
      
      // Log the search query using the database function
      await supabase.rpc('log_search_query', {
        p_query: query,
        p_user_id: userId,
        p_search_type: searchType
      })
    } catch (err) {
      // Silently fail - we don't want search logging to break the search functionality
      console.warn('Failed to log search query:', err)
    }
  }

  /**
   * Get trending/popular search terms
   */
  async function getTrendingSearches(): Promise<ApiResponse<string[]>> {
    try {
      // Get trending searches from the database (last 7 days, top 10)
      const { data, error } = await supabase
        .rpc('get_trending_searches', {
          p_limit: 10,
          p_days: 7
        })

      if (error) {
        console.warn('Failed to get trending searches from database, falling back to defaults:', error)
        // Fallback to default trending terms if database query fails
        const defaultTrendingTerms = [
          'getting started',
          'best practices',
          'tutorial',
          'help',
          'feedback'
        ]
        return createSuccessResponse(defaultTrendingTerms)
      }

      // Extract just the query strings from the result
      const trendingTerms = (data || []).map((item) => item.query)

      // If we have trending terms, return them
      if (trendingTerms.length > 0) {
        return createSuccessResponse(trendingTerms)
      }

      // Fallback to default trending terms if no data
      const defaultTrendingTerms = [
        'getting started',
        'best practices',
        'tutorial',
        'help',
        'feedback'
      ]
      return createSuccessResponse(defaultTrendingTerms)
    } catch (err) {
      console.error('Trending searches error:', err)
      return createErrorResponse<string[]>(err, 'Failed to get trending searches')
    }
  }

  /**
   * Get user's recent searches
   */
  async function getUserRecentSearches(limit: number = 20): Promise<ApiResponse<Array<{
    query: string
    search_type: string
    searched_at: string
  }>>> {
    try {
      const user = useSupabaseUser()
      if (!user.value) {
        return createErrorResponse('User must be logged in')
      }

      const { data, error } = await supabase
        .rpc('get_user_recent_searches', {
          p_user_id: user.value.id,
          p_limit: limit
        })

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to get user recent searches'))
      }

      return createSuccessResponse(data || [])
    } catch (err) {
      console.error('User recent searches error:', err)
      return createErrorResponse(err, 'Failed to get user recent searches')
    }
  }

  /**
   * Clear user's search history
   */
  async function clearUserSearchHistory(): Promise<ApiResponse<boolean>> {
    try {
      const user = useSupabaseUser()
      if (!user.value) {
        return createErrorResponse('User must be logged in')
      }

      const { error } = await supabase
        .from('search_queries')
        .delete()
        .eq('user_id', user.value.id)

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to clear search history'))
      }

      return createSuccessResponse(true)
    } catch (err) {
      console.error('Clear search history error:', err)
      return createErrorResponse(err, 'Failed to clear search history')
    }
  }

  return {
    search,
    searchPosts,
    searchUsers,
    searchComments,
    getSuggestions,
    getTrendingSearches,
    getUserRecentSearches,
    clearUserSearchHistory
  }
}