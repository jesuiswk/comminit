<template>
  <div class="animate-fade-in">
    <!-- Loading State -->
    <LoadingSpinner v-if="loading" />

    <!-- Error State -->
    <ErrorMessage v-else-if="error" :message="error" @retry="fetchUserData" />

    <!-- User Profile -->
    <div v-else-if="userProfile" class="user-profile">
      <!-- Profile Header -->
      <div class="profile-header card p-8 rounded-lg">
        <div class="profile-header-content">
          <!-- Avatar -->
          <div class="profile-avatar">
            <div v-if="userProfile.avatar_url" class="profile-avatar-image">
              <img 
                :src="userProfile.avatar_url" 
                :alt="userProfile.username" 
                class="avatar-image"
              />
            </div>
            <div v-else class="profile-avatar-placeholder icon-box">
              {{ userInitial }}
            </div>
          </div>

          <!-- User Info -->
          <div class="profile-info">
            <h1 class="profile-username font-display">
              @{{ userProfile.username }}
            </h1>
            
            <div class="profile-meta">
              <div class="profile-meta-item">
                <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                    stroke="currentColor" 
                    stroke-width="2" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"
                  />
                </svg>
                <span class="font-mono">Joined {{ formatDate(userProfile.created_at) }}</span>
              </div>
              
              <div v-if="userProfile.updated_at" class="profile-meta-item">
                <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12Z" 
                    stroke="currentColor" 
                    stroke-width="2" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"
                  />
                  <path d="M12 8V12L15 15" 
                    stroke="currentColor" 
                    stroke-width="2" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"
                  />
                </svg>
                <span class="font-mono">Last active {{ formatDate(userProfile.updated_at) }}</span>
              </div>
            </div>

            <!-- Stats -->
            <div class="profile-stats">
              <div class="stat-item">
                <div class="stat-number font-display">{{ postsData?.total || 0 }}</div>
                <div class="stat-label font-mono">Posts</div>
              </div>
              <div class="stat-item">
                <div class="stat-number font-display">{{ commentsCount }}</div>
                <div class="stat-label font-mono">Comments</div>
              </div>
            </div>
          </div>

          <!-- Actions (if viewing own profile) -->
          <div v-if="isOwnProfile" class="profile-actions">
            <NuxtLink to="/settings" class="btn btn-primary font-mono">
              <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" 
                  stroke="currentColor" 
                  stroke-width="2" 
                  stroke-linecap="round" 
                  stroke-linejoin="round"
                />
              </svg>
              Edit Profile
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- User Posts -->
      <div class="user-posts mt-8">
        <div class="section-header glass p-4 rounded-lg mb-6">
          <h2 class="section-title font-display">Posts by @{{ userProfile.username }}</h2>
          <p class="section-subtitle font-mono">{{ postsData?.total || 0 }} posts total</p>
        </div>

        <!-- Loading Posts -->
        <LoadingSpinner v-if="loadingPosts" />

        <!-- Posts Grid -->
        <div v-else-if="posts?.length" class="posts-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <PostCard v-for="post in posts" :key="post.id" :post="post" />
        </div>

        <!-- Empty State -->
        <div v-else class="text-center empty-state card p-8 rounded-lg">
          <div class="empty-state-icon">
            <div class="icon-box" style="width: 64px; height: 64px; font-size: 24px; margin: 0 auto;">📝</div>
          </div>
          <h3 class="empty-state-title font-display">No posts yet</h3>
          <p class="empty-state-text font-mono">
            {{ isOwnProfile ? 'You haven\'t created any posts yet.' : 'This user hasn\'t created any posts yet.' }}
          </p>
          <NuxtLink v-if="isOwnProfile" to="/posts/new" class="btn btn-primary mt-4 font-mono">$ create_post</NuxtLink>
        </div>

        <!-- Pagination -->
        <div v-if="posts?.length && (postsData?.totalPages || 0) > 1" class="pagination-controls mt-8">
          <div class="flex justify-center items-center gap-4">
            <button 
              @click="loadPrevPage" 
              :disabled="!hasPrevPage || loadingPosts"
              class="btn btn-secondary font-mono"
              :class="{ 'opacity-50 cursor-not-allowed': !hasPrevPage || loadingPosts }"
            >
              ← Previous
            </button>
            
            <div class="flex items-center gap-2">
              <span class="font-mono text-sm">Page</span>
              <select 
                v-model="currentPage" 
                @change="goToPage(currentPage)"
                :disabled="loadingPosts"
                class="form-input font-mono text-sm py-1 px-2"
              >
                <option v-for="pageNum in postsData?.totalPages" :key="pageNum" :value="pageNum">
                  {{ pageNum }}
                </option>
              </select>
              <span class="font-mono text-sm">of {{ postsData?.totalPages }}</span>
            </div>
            
            <button 
              @click="loadNextPage" 
              :disabled="!hasNextPage || loadingPosts"
              class="btn btn-secondary font-mono"
              :class="{ 'opacity-50 cursor-not-allowed': !hasNextPage || loadingPosts }"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Profile, PostWithAuthor, PaginatedResponse } from '~/types'

const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const userId = route.params.id as string

// State
const loading = ref(true)
const loadingPosts = ref(false)
const error = ref('')
const userProfile = ref<Profile | null>(null)
const commentsCount = ref(0)
const currentPage = ref(1)
const postsPerPage = 12

// Fetch user data
const fetchUserData = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) throw profileError
    userProfile.value = profile

    // Fetch comments count
    const { count: commentsCountResult, error: commentsError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (commentsError) throw commentsError
    commentsCount.value = commentsCountResult || 0

  // Fetch user posts (will be handled by useAsyncData)
  } catch (err: any) {
    console.error('Error fetching user data:', err)
    error.value = err.message || 'Failed to load user profile'
  } finally {
    loading.value = false
  }
}

// Fetch user posts with pagination
const { data: postsData, refresh: refreshPosts } = await useAsyncData<PaginatedResponse<PostWithAuthor>>(
  `user-posts-${userId}`,
  async () => {
    loadingPosts.value = true
    try {
      const page = currentPage.value
      const limit = postsPerPage
      const offset = (page - 1) * limit

      // Get total count
      const { count, error: countError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (countError) throw countError

      // Fetch paginated posts
      const { data, error: postsError } = await supabase
        .from('posts')
        .select('*, author:profiles(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (postsError) throw postsError

      const total = count || 0
      const totalPages = Math.ceil(total / limit)

      return {
        data: data || [],
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    } catch (err: any) {
      console.error('Error fetching user posts:', err)
      return {
        data: [],
        total: 0,
        page: 1,
        limit: postsPerPage,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    } finally {
      loadingPosts.value = false
    }
  }
)

const posts = computed(() => postsData.value?.data || [])
const hasNextPage = computed(() => postsData.value?.hasNextPage || false)
const hasPrevPage = computed(() => postsData.value?.hasPrevPage || false)

const isOwnProfile = computed(() => {
  return user.value?.id === userId
})

const userInitial = computed(() => {
  if (!userProfile.value) return 'U'
  return userProfile.value.username.charAt(0).toUpperCase()
})

const loadNextPage = async () => {
  if (hasNextPage.value) {
    currentPage.value++
    await refreshPosts()
  }
}

const loadPrevPage = async () => {
  if (hasPrevPage.value) {
    currentPage.value--
    await refreshPosts()
  }
}

const goToPage = async (page: number) => {
  if (page >= 1 && page <= (postsData.value?.totalPages || 0)) {
    currentPage.value = page
    await refreshPosts()
  }
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

// Fetch data on page load
await fetchUserData()

// SEO Meta
useSeoMeta({
  title: () => userProfile.value ? `@${userProfile.value.username} · comminit` : 'User Profile · comminit',
  description: () => userProfile.value ? `Profile page for @${userProfile.value.username} on comminit` : 'User profile page',
  ogTitle: () => userProfile.value ? `@${userProfile.value.username} · comminit` : 'User Profile · comminit',
  ogDescription: () => userProfile.value ? `Profile page for @${userProfile.value.username} on comminit` : 'User profile page',
})
</script>

<style scoped>
.user-profile {
  max-width: 1200px;
  margin: 0 auto;
}

.profile-header {
  background: var(--gradient-bg);
  border: 1px solid var(--color-border);
}

.profile-header-content {
  display: flex;
  align-items: center;
  gap: var(--space-2xl);
}

.profile-avatar {
  flex-shrink: 0;
}

.profile-avatar-image {
  width: 120px;
  height: 120px;
  border-radius: var(--radius-full);
  overflow: hidden;
  border: 4px solid var(--color-accent);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-avatar-placeholder {
  width: 120px;
  height: 120px;
  border-radius: var(--radius-full);
  font-size: var(--text-4xl);
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid var(--color-accent);
}

.profile-info {
  flex: 1;
}

.profile-username {
  font-size: var(--text-4xl);
  font-weight: 800;
  margin: 0 0 var(--space-base) 0;
  color: var(--color-text);
}

.profile-meta {
  display: flex;
  gap: var(--space-xl);
  margin-bottom: var(--space-xl);
}

.profile-meta-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.profile-meta-item .icon {
  color: var(--color-accent);
}

.profile-stats {
  display: flex;
  gap: var(--space-2xl);
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: var(--text-3xl);
  font-weight: 800;
  color: var(--color-accent);
  margin-bottom: var(--space-xs);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.profile-actions {
  flex-shrink: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-base);
}

.section-title {
  font-size: var(--text-2xl);
  font-weight: 800;
  color: var(--color-text);
  margin: 0;
}

.section-subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: 0;
}

.posts-grid {
  gap: var(--space-lg);
}

.empty-state {
  text-align: center;
  padding: var(--space-3xl) var(--space-lg);
  border: 1px solid var(--color-border);
}

.empty-state-icon {
  margin-bottom: var(--space-xl);
}

.empty-state-title {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: var(--space-sm);
}

.empty-state-text {
  color: var(--color-text-muted);
  margin-bottom: var(--space-xl);
  font-size: var(--text-base);
}

.pagination-controls {
  padding: var(--space-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg3);
}

@media (max-width: 768px) {
  .profile-header-content {
    flex-direction: column;
    text-align: center;
    gap: var(--space-xl);
  }
  
  .profile-meta {
    flex-direction: column;
    gap: var(--space-base);
  }
  
  .profile-stats {
    justify-content: center;
  }
  
  .profile-username {
    font-size: var(--text-3xl);
  }
  
  .profile-avatar-image,
  .profile-avatar-placeholder {
    width: 100px;
    height: 100px;
  }
}

@media (max-width: 640px) {
  .profile-header {
    padding: var(--space-xl) var(--space-base);
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .posts-grid {
    grid-template-columns: 1fr;
  }
}
</style>