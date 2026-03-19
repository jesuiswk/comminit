import type { Database } from '~/types/supabase'
import type { Profile, ApiResponse } from '~/types'

/**
 * Composable for user profile operations
 * Centralizes profile-related functionality to avoid duplication
 */
export function useUserProfile() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  /**
   * Ensure user has a profile, create one if missing
   * This should be called whenever a user performs an action that requires a profile
   * @returns Boolean indicating if profile exists or was created
   */
  async function ensureUserProfile(): Promise<ApiResponse<Profile>> {
    if (!user.value) {
      return { data: null, error: { message: 'User must be logged in' } }
    }

    try {
      // First, check if profile exists
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .single()

      // If profile exists, return it
      if (profile) {
        return { data: profile, error: null }
      }

      // If profile doesn't exist (fetchError indicates no rows), create one
      if (fetchError?.code === 'PGRST116') {
        // Create profile with username from user metadata or email
        const username = user.value.user_metadata?.username || 
                         user.value.email?.split('@')[0] || 
                         `user_${user.value.id.substring(0, 8)}`
        
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.value.id,
            username: username
          })
          .select()
          .single()

        if (insertError) {
          console.error('Failed to create profile:', insertError)
          return { 
            data: null, 
            error: { 
              message: insertError.message, 
              code: insertError.code,
              details: 'Failed to create user profile'
            } 
          }
        }

        return { data: newProfile, error: null }
      }

      // Other database error
      console.error('Error checking profile:', fetchError)
      return { 
        data: null, 
        error: { 
          message: fetchError.message, 
          code: fetchError.code,
          details: 'Failed to check user profile'
        } 
      }
    } catch (err) {
      console.error('Error ensuring user profile:', err)
      return { 
        data: null, 
        error: { message: 'Failed to ensure user profile' } 
      }
    }
  }

  /**
   * Get user profile by ID
   * @param userId - User UUID
   * @returns User profile
   */
  async function getUserProfile(userId: string): Promise<ApiResponse<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } }
      }

      return { data, error: null }
    } catch (err) {
      console.error('Error fetching user profile:', err)
      return { 
        data: null, 
        error: { message: 'Failed to fetch user profile' } 
      }
    }
  }

  /**
   * Update user profile
   * @param userId - User UUID
   * @param updates - Profile updates
   * @returns Updated profile
   */
  async function updateUserProfile(
    userId: string,
    updates: Partial<Profile>
  ): Promise<ApiResponse<Profile>> {
    if (!user.value || user.value.id !== userId) {
      return { data: null, error: { message: 'Unauthorized to update this profile' } }
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } }
      }

      return { data, error: null }
    } catch (err) {
      console.error('Error updating user profile:', err)
      return { 
        data: null, 
        error: { message: 'Failed to update user profile' } 
      }
    }
  }

  /**
   * Get current user's profile
   * @returns Current user's profile
   */
  async function getCurrentUserProfile(): Promise<ApiResponse<Profile>> {
    if (!user.value) {
      return { data: null, error: { message: 'User must be logged in' } }
    }

    return await getUserProfile(user.value.id)
  }

  /**
   * Search users by username
   * @param query - Search query
   * @param limit - Maximum results
   * @returns Array of matching profiles
   */
  async function searchUsers(
    query: string,
    limit: number = 10
  ): Promise<ApiResponse<Profile[]>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${query}%`)
        .limit(limit)

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } }
      }

      return { data: data || [], error: null }
    } catch (err) {
      console.error('Error searching users:', err)
      return { 
        data: null, 
        error: { message: 'Failed to search users' } 
      }
    }
  }

  /**
   * Get user stats (posts count, comments count)
   * @param userId - User UUID
   * @returns User statistics
   */
  async function getUserStats(userId: string): Promise<ApiResponse<{
    postsCount: number
    commentsCount: number
  }>> {
    try {
      // Get posts count
      const { count: postsCount, error: postsError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (postsError) {
        return { data: null, error: { message: postsError.message, code: postsError.code } }
      }

      // Get comments count
      const { count: commentsCount, error: commentsError } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (commentsError) {
        return { data: null, error: { message: commentsError.message, code: commentsError.code } }
      }

      return {
        data: {
          postsCount: postsCount || 0,
          commentsCount: commentsCount || 0
        },
        error: null
      }
    } catch (err) {
      console.error('Error fetching user stats:', err)
      return { 
        data: null, 
        error: { message: 'Failed to fetch user statistics' } 
      }
    }
  }

  return {
    ensureUserProfile,
    getUserProfile,
    updateUserProfile,
    getCurrentUserProfile,
    searchUsers,
    getUserStats
  }
}