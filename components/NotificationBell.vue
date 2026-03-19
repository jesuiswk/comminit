<template>
  <div class="notification-bell relative">
    <button 
      @click="toggleDropdown"
      class="btn btn-ghost font-mono relative"
      :class="{ 'notification-active': unreadCount > 0 }"
    >
      <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" 
          stroke="currentColor" 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round"
        />
        <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" 
          stroke="currentColor" 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round"
        />
      </svg>
      
      <!-- Unread count badge -->
      <span 
        v-if="unreadCount > 0"
        class="notification-badge"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <!-- Dropdown -->
    <div 
      v-if="dropdownOpen"
      v-click-outside="closeDropdown"
      class="notification-dropdown"
    >
      <div class="notification-header">
        <h3 class="notification-title font-display">Notifications</h3>
        <button 
          v-if="unreadCount > 0"
          @click="markAllAsRead"
          class="btn-text font-mono text-sm"
          :disabled="markingAllAsRead"
        >
          {{ markingAllAsRead ? 'Marking...' : 'Mark all as read' }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="notification-loading">
        <LoadingSpinner size="sm" />
      </div>

      <!-- Empty state -->
      <div v-else-if="!notifications.length" class="notification-empty">
        <p class="font-mono text-sm text-text-muted">No notifications yet</p>
      </div>

      <!-- Notifications list -->
      <div v-else class="notification-list">
        <div 
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          :class="{ 'notification-unread': !notification.read }"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-icon">
            <div class="icon-box" style="width: 32px; height: 32px; font-size: 12px;">
              {{ getNotificationIcon(notification.type) }}
            </div>
          </div>
          <div class="notification-content">
            <h4 class="notification-item-title font-mono">
              {{ notification.title }}
            </h4>
            <p class="notification-item-text">
              {{ notification.content }}
            </p>
            <time class="notification-time font-mono">
              {{ formatTime(notification.created_at) }}
            </time>
          </div>
          <button 
            v-if="!notification.read"
            @click.stop="markAsRead(notification.id)"
            class="notification-mark-read"
            title="Mark as read"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- View all link -->
      <div class="notification-footer">
        <NuxtLink 
          to="/notifications" 
          class="btn-text font-mono text-sm"
          @click="closeDropdown"
        >
          View all notifications
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Notification } from '~/types'

const dropdownOpen = ref(false)
const loading = ref(false)
const markingAllAsRead = ref(false)

const { fetchNotifications, fetchUnreadCount, markAsRead: markNotificationAsRead, markAllAsRead: markAllNotificationsAsRead, subscribeToNotifications } = useNotifications()

// Fetch initial data
const { data: notificationsData, refresh: refreshNotifications } = await useAsyncData('notifications', async () => {
  loading.value = true
  try {
    const response = await fetchNotifications({ limit: 10 })
    return response.data?.data || []
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return []
  } finally {
    loading.value = false
  }
})

const { data: unreadCountData, refresh: refreshUnreadCount } = await useAsyncData('unread-count', async () => {
  try {
    const response = await fetchUnreadCount()
    return response.data || 0
  } catch (error) {
    console.error('Error fetching unread count:', error)
    return 0
  }
})

const notifications = computed(() => notificationsData.value || [])
const unreadCount = computed(() => unreadCountData.value || 0)

// Subscribe to real-time notifications
onMounted(() => {
  const unsubscribe = subscribeToNotifications((newNotification) => {
    // Add new notification to the top of the list
    notificationsData.value = [newNotification, ...(notificationsData.value || [])]
    
    // Refresh unread count
    refreshUnreadCount()
  })

  onUnmounted(() => {
    unsubscribe()
  })
})

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
  if (dropdownOpen.value) {
    refreshNotifications()
    refreshUnreadCount()
  }
}

const closeDropdown = () => {
  dropdownOpen.value = false
}

const markAsRead = async (notificationId: string) => {
  const response = await markNotificationAsRead(notificationId)
  if (response.data) {
    // Update local state
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
    refreshUnreadCount()
  }
}

const markAllAsRead = async () => {
  markingAllAsRead.value = true
  try {
    const response = await markAllNotificationsAsRead()
    if (response.data) {
      // Update all notifications to read
      notifications.value.forEach(notification => {
        notification.read = true
      })
      refreshUnreadCount()
    }
  } finally {
    markingAllAsRead.value = false
  }
}

const handleNotificationClick = (notification: Notification) => {
  // Mark as read if unread
  if (!notification.read) {
    markAsRead(notification.id)
  }

  // Navigate based on notification type
  switch (notification.type) {
    case 'comment':
      if (notification.data?.post_id) {
        navigateTo(`/posts/${notification.data.post_id}`)
      }
      break
    // Add more cases for other notification types
  }

  closeDropdown()
}

const getNotificationIcon = (type: string): string => {
  switch (type) {
    case 'comment': return '💬'
    case 'like': return '❤️'
    case 'follow': return '👤'
    case 'mention': return '@'
    default: return '🔔'
  }
}

const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.notification-bell {
  position: relative;
}

.notification-active {
  color: var(--color-accent);
}

.notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--color-accent3);
  color: white;
  font-size: 10px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  font-family: var(--font-mono);
  border: 2px solid var(--color-bg);
}

.notification-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 380px;
  max-width: 90vw;
  background: var(--color-bg3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  z-index: var(--z-dropdown);
  margin-top: 8px;
  overflow: hidden;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-base);
  border-bottom: 1px solid var(--color-border);
}

.notification-title {
  font-size: var(--text-lg);
  font-weight: 700;
  margin: 0;
}

.notification-loading,
.notification-empty {
  padding: var(--space-2xl);
  text-align: center;
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-base);
  padding: var(--space-base);
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background-color var(--transition-fast);
  position: relative;
}

.notification-item:hover {
  background: rgba(61, 255, 224, 0.05);
}

.notification-unread {
  background: rgba(61, 255, 224, 0.03);
}

.notification-unread::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--color-accent);
}

.notification-icon {
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-item-title {
  font-size: var(--text-sm);
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--color-text);
}

.notification-item-text {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: 0 0 4px 0;
  line-height: 1.4;
}

.notification-time {
  font-size: var(--text-xs);
  color: var(--color-text-light);
}

.notification-mark-read {
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--color-accent);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm);
  opacity: 0.7;
  transition: opacity var(--transition-fast);
}

.notification-mark-read:hover {
  opacity: 1;
  background: rgba(61, 255, 224, 0.1);
}

.notification-footer {
  padding: var(--space-base);
  border-top: 1px solid var(--color-border);
  text-align: center;
}

.btn-text {
  background: none;
  border: none;
  color: var(--color-accent);
  cursor: pointer;
  font-size: inherit;
  padding: 0;
  text-decoration: none;
}

.btn-text:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .notification-dropdown {
    width: 320px;
    right: -50px;
  }
}

@media (max-width: 480px) {
  .notification-dropdown {
    width: 280px;
    right: -80px;
  }
}
</style>