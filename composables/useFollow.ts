import { ref, computed } from 'vue'
import { useSupabaseClient } from '#imports'
import type { Database } from '~/types/supabase'
import { useErrorHandling } from './useErrorHandling'

export interface FollowStats {
  followerCount: number
  followingCount: number
  isFollowing: boolean
}

export interface FollowerUser {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
  follow_created_at: string
}

export interface FollowingUser {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
  follow_created_at: string
}

export interface MutualFollowUser {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
}

export function useFollow() {
  const supabase = useSupabaseClient<Database>()
  const { createErrorResponse, createSuccessResponse, handleSupabaseError } = useErrorHandling()

  const loading = ref(false)
  const followStats = ref<FollowStats | null>(null)

  /**
   * Toggle follow/unfollow for a user
   */
  async function toggleFollow(userId: string) {
    loading.value = true
    try {
      const { data, error } = await supabase
        .rpc('toggle_follow', { p_following_id: userId })

      if (error) {
        return createErrorResponse(error, 'Failed to toggle follow')
      }

      // Refresh follow stats after toggling
      await getFollowStats(userId)

      return createSuccessResponse({
        isFollowing: data,
        message: data ? 'Followed successfully' : 'Unfollowed successfully'
      })
    } catch (error: any) {
      return createErrorResponse('Failed to toggle follow', error.message || error)
    } finally {
      loading.value = false
    }
  }

  /**
   * Get follow statistics for a user
   */
  async function getFollowStats(userId: string) {
    loading.value = true
    try {
      // Get follower count
      const { data: followerCountData, error: followerError } = await supabase
        .rpc('get_follower_count', { p_user_id: userId })

      if (followerError) {
        console.error('Error getting follower count:', followerError)
        return createErrorResponse(followerError, 'Failed to get follower count')
      }

      // Get following count
      const { data: followingCountData, error: followingError } = await supabase
        .rpc('get_following_count', { p_user_id: userId })

      if (followingError) {
        console.error('Error getting following count:', followingError)
        return createErrorResponse(followingError, 'Failed to get following count')
      }

      // Check if current user is following this user
      let isFollowing = false
      const currentUser = (await supabase.auth.getUser()).data.user
      if (currentUser) {
        const { data: isFollowingData, error: isFollowingError } = await supabase
          .rpc('is_following', { p_following_id: userId })

        if (!isFollowingError) {
          isFollowing = isFollowingData
        }
      }

      const stats: FollowStats = {
        followerCount: followerCountData || 0,
        followingCount: followingCountData || 0,
        isFollowing
      }

      followStats.value = stats

      return createSuccessResponse(stats)
    } catch (error: any) {
      return createErrorResponse('Failed to get follow stats', error.message || error)
    } finally {
      loading.value = false
    }
  }

  /**
   * Get followers list for a user
   */
  async function getFollowers(userId: string, limit = 20, offset = 0) {
    loading.value = true
    try {
      const { data, error } = await supabase
        .rpc('get_followers', {
          p_user_id: userId,
          p_limit: limit,
          p_offset: offset
        })

      if (error) {
        return createErrorResponse(error, 'Failed to get followers')
      }

      return createSuccessResponse(data as FollowerUser[])
    } catch (error: any) {
      return createErrorResponse('Failed to get followers', error.message || error)
    } finally {
      loading.value = false
    }
  }

  /**
   * Get following list for a user
   */
  async function getFollowing(userId: string, limit = 20, offset = 0) {
    loading.value = true
    try {
      const { data, error } = await supabase
        .rpc('get_following', {
          p_user_id: userId,
          p_limit: limit,
          p_offset: offset
        })

      if (error) {
        return createErrorResponse(error, 'Failed to get following')
      }

      return createSuccessResponse(data as FollowingUser[])
    } catch (error: any) {
      return createErrorResponse('Failed to get following', error.message || error)
    } finally {
      loading.value = false
    }
  }

  /**
   * Get mutual follows between current user and another user
   */
  async function getMutualFollows(userId: string) {
    loading.value = true
    try {
      const { data, error } = await supabase
        .rpc('get_mutual_follows', { p_user_id: userId })

      if (error) {
        return createErrorResponse(error, 'Failed to get mutual follows')
      }

      return createSuccessResponse(data as MutualFollowUser[])
    } catch (error: any) {
      return createErrorResponse('Failed to get mutual follows', error.message || error)
    } finally {
      loading.value = false
    }
  }

  /**
   * Get user stats from user_stats view
   */
  async function getUserStats(userId: string) {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        return createErrorResponse(error, 'Failed to get user stats')
      }

      return createSuccessResponse(data)
    } catch (error: any) {
      return createErrorResponse('Failed to get user stats', error.message || error)
    } finally {
      loading.value = false
    }
  }

  /**
   * Get suggested users to follow (users not followed by current user)
   */
  async function getSuggestedUsers(limit = 10) {
    loading.value = true
    try {
      const currentUser = (await supabase.auth.getUser()).data.user
      if (!currentUser) {
        return createErrorResponse('User not authenticated')
      }

      // First, get the list of users that current user is following
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUser.id)

      if (followingError) {
        return createErrorResponse(followingError, 'Failed to get following list')
      }

      const followingIds = followingData?.map(f => f.following_id) || []
      
      // Get users that current user is not following
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio, created_at')
        .neq('id', currentUser.id)
        .not('id', 'in', followingIds)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        return createErrorResponse(error, 'Failed to get suggested users')
      }

      return createSuccessResponse(data)
    } catch (error: any) {
      return createErrorResponse('Failed to get suggested users', error.message || error)
    } finally {
      loading.value = false
    }
  }

  /**
   * Get feed of posts from followed users
   */
  async function getFollowingFeed(limit = 20, offset = 0) {
    loading.value = true
    try {
      const currentUser = (await supabase.auth.getUser()).data.user
      if (!currentUser) {
        return createErrorResponse('User not authenticated')
      }

      // First, get the list of users that current user is following
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUser.id)

      if (followingError) {
        return createErrorResponse(followingError, 'Failed to get following list')
      }

      const followingIds = followingData?.map(f => f.following_id) || []
      
      if (followingIds.length === 0) {
        return createSuccessResponse([])
      }

      // Get posts from users that current user is following
      const { data, error } = await supabase
        .from('posts')
        .select('*, author:profiles(*)')
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        return createErrorResponse(error, 'Failed to get following feed')
      }

      return createSuccessResponse(data)
    } catch (error: any) {
      return createErrorResponse('Failed to get following feed', error.message || error)
    } finally {
      loading.value = false
    }
  }

  return {
    loading: computed(() => loading.value),
    followStats: computed(() => followStats.value),
    toggleFollow,
    getFollowStats,
    getFollowers,
    getFollowing,
    getMutualFollows,
    getUserStats,
    getSuggestedUsers,
    getFollowingFeed
  }
}