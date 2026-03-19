import type { Database } from '~/types/supabase'
import type { Notification, ApiResponse, PaginationParams, PaginatedResponse } from '~/types'

/**
 * Composable for notification operations
 * Provides a unified interface for notification-related functionality
 */
export function useNotifications() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const { handleSupabaseError, createSuccessResponse, createErrorResponse } = useErrorHandling()

  /**
   * Fetch notifications for the current user with pagination
   * @param params - Pagination parameters
   * @returns Paginated notifications response
   */
  async function fetchNotifications(
    params: PaginationParams = {}
  ): Promise<ApiResponse<PaginatedResponse<Notification>>> {
    if (!user.value) {
      return createErrorResponse<PaginatedResponse<Notification>>('User must be logged in')
    }

    try {
      const page = params.page || 1
      const limit = params.limit || 20
      const offset = (page - 1) * limit
      const orderBy = params.orderBy || 'created_at'
      const ascending = params.ascending ?? false

      // Combine count and data into single query
      const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', user.value.id)
        .order(orderBy, { ascending })
        .range(offset, offset + limit - 1)

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to fetch notifications'))
      }

      const total = count || 0
      const totalPages = Math.ceil(total / limit)

      const paginatedResponse: PaginatedResponse<Notification> = {
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
      console.error('Error fetching notifications:', err)
      return createErrorResponse<PaginatedResponse<Notification>>(err, 'Failed to fetch notifications')
    }
  }

  /**
   * Fetch unread notifications count
   * @returns Unread notification count
   */
  async function fetchUnreadCount(): Promise<ApiResponse<number>> {
    if (!user.value) {
      return createErrorResponse<number>('User must be logged in')
    }

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.value.id)
        .eq('read', false)

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to fetch unread count'))
      }

      return createSuccessResponse(count || 0)
    } catch (err) {
      console.error('Error fetching unread count:', err)
      return createErrorResponse<number>(err, 'Failed to fetch unread notification count')
    }
  }

  /**
   * Mark notification as read
   * @param notificationId - Notification UUID
   * @returns Success status
   */
  async function markAsRead(notificationId: string): Promise<ApiResponse<boolean>> {
    if (!user.value) {
      return createErrorResponse<boolean>('User must be logged in')
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.value.id)

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to mark notification as read'))
      }

      return createSuccessResponse(true)
    } catch (err) {
      console.error('Error marking notification as read:', err)
      return createErrorResponse<boolean>(err, 'Failed to mark notification as read')
    }
  }

  /**
   * Mark all notifications as read
   * @returns Number of notifications marked as read
   */
  async function markAllAsRead(): Promise<ApiResponse<number>> {
    if (!user.value) {
      return createErrorResponse<number>('User must be logged in')
    }

    try {
      const { data, error } = await supabase.rpc('mark_notifications_as_read', {
        p_user_id: user.value.id
      })

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to mark all notifications as read'))
      }

      return createSuccessResponse((data as number) || 0)
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      return createErrorResponse<number>(err, 'Failed to mark all notifications as read')
    }
  }

  /**
   * Delete a notification
   * @param notificationId - Notification UUID
   * @returns Success status
   */
  async function deleteNotification(notificationId: string): Promise<ApiResponse<boolean>> {
    if (!user.value) {
      return createErrorResponse<boolean>('User must be logged in')
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.value.id)

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to delete notification'))
      }

      return createSuccessResponse(true)
    } catch (err) {
      console.error('Error deleting notification:', err)
      return createErrorResponse<boolean>(err, 'Failed to delete notification')
    }
  }

  /**
   * Create a notification (admin/system use)
   * @param userId - Target user ID
   * @param type - Notification type
   * @param title - Notification title
   * @param content - Notification content
   * @param data - Additional data
   * @returns Created notification
   */
  async function createNotification(
    userId: string,
    type: string,
    title: string,
    content?: string,
    data?: Record<string, any>
  ): Promise<ApiResponse<Notification>> {
    try {
      const { data: notification, error } = await supabase.rpc('create_notification', {
        p_user_id: userId,
        p_type: type,
        p_title: title,
        p_content: content,
        p_data: data
      })

      if (error) {
        return createErrorResponse(handleSupabaseError(error, 'Failed to create notification'))
      }

      return createSuccessResponse(notification as Notification)
    } catch (err) {
      console.error('Error creating notification:', err)
      return createErrorResponse<Notification>(err, 'Failed to create notification')
    }
  }

  /**
   * Subscribe to real-time notifications
   * @param callback - Callback function for new notifications
   * @returns Unsubscribe function
   */
  function subscribeToNotifications(callback: (notification: Notification) => void) {
    if (!user.value) return () => {}

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.value!.id}`
        },
        (payload) => {
          callback(payload.new as Notification)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  return {
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    subscribeToNotifications
  }
}