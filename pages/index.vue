<template>
  <div class="animate-fade-in">
    <!-- Hero Section -->
    <div class="hero gradient-border rounded-lg">
      <div class="hero-glow"></div>
      <div class="hero-content">
        <div class="hero-eyebrow font-mono">// initialize community</div>
        <h1 class="hero-title font-display">Build.<br>Ship.<br>Connect.</h1>
        <p class="subtitle font-mono">A modern, open‑source platform for meaningful discussions</p>
        
        <div v-if="!user" class="cta">
          <NuxtLink to="/register" class="btn btn-primary btn-lg font-mono animate-pulse">
            <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 7L19 13M19 13L13 19M19 13H5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            $ get_started
          </NuxtLink>
          <NuxtLink to="/login" class="btn btn-secondary btn-lg font-mono">
            // login_existing
          </NuxtLink>
        </div>
        
        <div v-else class="user-welcome">
          <p class="welcome-text font-mono">Welcome back! Ready to share your thoughts?</p>
          <NuxtLink to="/posts/new" class="btn btn-primary btn-lg font-mono">
            <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            $ new_post
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Posts Section -->
    <div class="posts-section">
      <div class="section-header glass p-4 rounded-lg">
        <div class="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
          <div class="flex flex-col md:flex-row md:items-center gap-4">
            <!-- Feed Type Tabs -->
            <div class="feed-tabs flex gap-2">
              <button 
                @click="setFeedType('latest')"
                class="feed-tab"
                :class="{ 'feed-tab-active': feedType === 'latest' }"
              >
                Latest Discussions
              </button>
              <button 
                v-if="user"
                @click="setFeedType('following')"
                class="feed-tab"
                :class="{ 'feed-tab-active': feedType === 'following' }"
              >
                Following
                <span v-if="followingCount > 0" class="feed-count">{{ followingCount }}</span>
              </button>
            </div>
            
            <div>
              <h2 class="section-title font-display hidden md:block">
                {{ feedType === 'latest' ? 'Latest Discussions' : 'From People You Follow' }}
              </h2>
              <p class="section-subtitle font-mono hidden md:block">
                {{ feedType === 'latest' ? 'Join conversations happening right now' : 'Posts from users you follow' }}
              </p>
            </div>
          </div>
          
          <NuxtLink v-if="user" to="/posts/new" class="btn btn-primary font-mono">
            <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            $ new_post
          </NuxtLink>
        </div>
      </div>

      <!-- Category Filter -->
      <div class="category-filter glass p-4 rounded-lg mb-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 class="font-display text-lg font-semibold mb-2">Filter by Category</h3>
            <div class="flex flex-wrap gap-2">
              <button 
                @click="selectCategory('')"
                class="category-pill"
                :class="{ 'category-pill-active': !selectedCategory }"
              >
                All Posts
              </button>
              <button 
                v-for="cat in popularCategories"
                :key="cat.category"
                @click="selectCategory(cat.category)"
                class="category-pill"
                :class="{ 'category-pill-active': selectedCategory === cat.category }"
              >
                {{ cat.category }}
                <span class="category-count">{{ cat.post_count }}</span>
              </button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="relative">
              <select 
                v-model="selectedCategory"
                @change="onCategoryChange"
                class="category-select font-mono text-sm"
              >
                <option value="">All Categories</option>
                <option v-for="cat in allCategories" :key="cat.category" :value="cat.category">
                  {{ cat.category }} ({{ cat.post_count }})
                </option>
              </select>
              <div class="select-arrow">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
            <button 
              v-if="selectedCategory"
              @click="clearCategoryFilter"
              class="btn btn-outline btn-sm font-mono"
            >
              Clear
            </button>
          </div>
        </div>
        <div v-if="selectedCategory" class="mt-4 pt-4 border-t border-border">
          <p class="font-mono text-sm">
            Showing posts in: <span class="font-semibold text-accent">{{ selectedCategory }}</span>
            <button 
              @click="() => refresh()"
              class="ml-2 btn btn-outline btn-xs font-mono"
              :disabled="pending"
            >
              {{ pending ? 'Loading...' : 'Refresh' }}
            </button>
          </p>
        </div>
      </div>
      
      <!-- Loading State with Skeleton -->
      <div v-if="pending" class="posts-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <SkeletonLoader v-for="i in 6" :key="i" type="post" size="md" />
      </div>
      
      <!-- Error State -->
      <ErrorMessage v-else-if="error" :message="error" @retry="refresh" />
      
      <!-- Posts Grid -->
      <div v-else-if="posts?.length" class="posts-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <PostCard v-for="post in posts" :key="post.id" :post="post" />
      </div>
      
      <!-- Empty State -->
      <EmptyState
        v-else
        icon="📝"
        title="No posts yet"
        description="Be the first to start a conversation!"
        :action-text="user ? '$ create_post' : undefined"
        size="lg"
        variant="bordered"
        @action="navigateTo('/posts/new')"
      />

      <!-- Pagination Controls -->
      <div v-if="posts?.length && totalPages > 1" class="pagination-controls mt-8">
        <div class="flex justify-center items-center gap-4">
          <button 
            @click="loadPrevPage" 
            :disabled="!hasPrevPage || pending"
            class="btn btn-secondary font-mono"
            :class="{ 'opacity-50 cursor-not-allowed': !hasPrevPage || pending }"
          >
            ← Previous
          </button>
          
          <div class="flex items-center gap-2">
            <span class="font-mono text-sm">Page</span>
            <select 
              v-model="currentPage" 
              @change="goToPage(currentPage)"
              :disabled="pending"
              class="form-input font-mono text-sm py-1 px-2"
            >
              <option v-for="pageNum in totalPages" :key="pageNum" :value="pageNum">
                {{ pageNum }}
              </option>
            </select>
            <span class="font-mono text-sm">of {{ totalPages }}</span>
          </div>
          
          <button 
            @click="loadNextPage" 
            :disabled="!hasNextPage || pending"
            class="btn btn-secondary font-mono"
            :class="{ 'opacity-50 cursor-not-allowed': !hasNextPage || pending }"
          >
            Next →
          </button>
        </div>
        
        <div class="text-center mt-2">
          <p class="font-mono text-sm text-text-muted">
            Showing {{ posts.length }} of {{ postsData?.total || 0 }} posts
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { PostWithAuthor, PaginatedResponse } from '~/types'

const user = useSupabaseUser()
const error = ref('')
const currentPage = ref(1)
const postsPerPage = 12
const selectedCategory = ref('')
const popularCategories = ref<Array<{ category: string; post_count: number }>>([])
const allCategories = ref<Array<{ category: string; post_count: number }>>([])
const feedType = ref<'latest' | 'following'>('latest')
const followingCount = ref(0)

// Use the composables
const { fetchPosts, fetchPostsByCategory, getPopularCategories, getPostCategories } = usePosts()
const { getFollowingFeed, getFollowing } = useFollow()

// Load categories on mount
onMounted(async () => {
  const popularResult = await getPopularCategories(8)
  if (popularResult.data) {
    popularCategories.value = popularResult.data
  }
  
  const allResult = await getPostCategories()
  if (allResult.data) {
    allCategories.value = allResult.data
  }
  
  // Load following count if user is logged in
  if (user.value) {
    await loadFollowingCount()
  }
})

// Watch for user changes to load following count
watch(user, async (newUser) => {
  if (newUser) {
    await loadFollowingCount()
  } else {
    followingCount.value = 0
    // If user logs out, switch back to latest feed
    if (feedType.value === 'following') {
      feedType.value = 'latest'
    }
  }
})

const loadFollowingCount = async () => {
  if (!user.value) return
  
  const result = await getFollowing(user.value.id, 1, 0)
  if (result.data) {
    // We need to get the total count, but getFollowing only returns limited data
    // For now, we'll just show if they're following anyone
    followingCount.value = result.data.length > 0 ? 1 : 0
  }
}

const { data: postsData, pending, refresh } = await useAsyncData<PaginatedResponse<PostWithAuthor>>('posts', async () => {
  error.value = ''
  
  // If feed type is "following" and user is not logged in, show empty
  if (feedType.value === 'following' && !user.value) {
    return {
      data: [],
      total: 0,
      page: currentPage.value,
      limit: postsPerPage,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false
    }
  }
  
  if (selectedCategory.value) {
    // Fetch posts by category
    const response = await fetchPostsByCategory(selectedCategory.value, {
      page: currentPage.value,
      limit: postsPerPage,
      orderBy: 'created_at',
      ascending: false
    })
    
    if (response.error) {
      error.value = response.error.message
      return {
        data: [],
        total: 0,
        page: currentPage.value,
        limit: postsPerPage,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    }
    
    return response.data || {
      data: [],
      total: 0,
      page: currentPage.value,
      limit: postsPerPage,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false
    }
  } else if (feedType.value === 'following' && user.value) {
    // Fetch following feed
    const offset = (currentPage.value - 1) * postsPerPage
    const response = await getFollowingFeed(postsPerPage, offset)
    
    if (response.error) {
      error.value = response.error.message
      return {
        data: [],
        total: 0,
        page: currentPage.value,
        limit: postsPerPage,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    }
    
    const posts = response.data || []
    // For following feed, we don't have pagination metadata from the function
    // So we'll assume no pagination for now
    return {
      data: posts,
      total: posts.length,
      page: currentPage.value,
      limit: postsPerPage,
      totalPages: Math.ceil(posts.length / postsPerPage),
      hasNextPage: false,
      hasPrevPage: false
    }
  } else {
    // Fetch all posts
    const response = await fetchPosts({
      page: currentPage.value,
      limit: postsPerPage,
      orderBy: 'created_at',
      ascending: false
    })
    
    if (response.error) {
      error.value = response.error.message
      return {
        data: [],
        total: 0,
        page: currentPage.value,
        limit: postsPerPage,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    }
    
    return response.data || {
      data: [],
      total: 0,
      page: currentPage.value,
      limit: postsPerPage,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false
    }
  }
}, {
  watch: [selectedCategory, currentPage, feedType]
})

const posts = computed(() => postsData.value?.data || [])
const hasNextPage = computed(() => postsData.value?.hasNextPage || false)
const hasPrevPage = computed(() => postsData.value?.hasPrevPage || false)
const totalPages = computed(() => postsData.value?.totalPages || 0)

const setFeedType = (type: 'latest' | 'following') => {
  feedType.value = type
  currentPage.value = 1 // Reset to first page when changing feed type
  selectedCategory.value = '' // Clear category filter when switching feed types
}

const selectCategory = (category: string) => {
  selectedCategory.value = category
  currentPage.value = 1 // Reset to first page when changing category
}

const onCategoryChange = () => {
  currentPage.value = 1 // Reset to first page when changing category
}

const clearCategoryFilter = () => {
  selectedCategory.value = ''
  currentPage.value = 1
}

const loadNextPage = async () => {
  if (hasNextPage.value) {
    currentPage.value++
    await refresh()
  }
}

const loadPrevPage = async () => {
  if (hasPrevPage.value) {
    currentPage.value--
    await refresh()
  }
}

const goToPage = async (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    await refresh()
  }
}

// SEO Meta
useSeoMeta({
  title: 'comminit · initialize communication',
  description: 'A modern, open‑source platform for meaningful discussions. Build, ship, and connect with developers worldwide.',
  ogTitle: 'comminit · initialize communication',
  ogDescription: 'A modern, open‑source platform for meaningful discussions. Build, ship, and connect with developers worldwide.',
  ogImage: '/og-image.png',
  ogImageAlt: 'comminit platform',
  twitterCard: 'summary_large_image',
  twitterTitle: 'comminit · initialize communication',
  twitterDescription: 'A modern, open‑source platform for meaningful discussions',
  twitterImage: '/og-image.png',
})
</script>

<style scoped>
.hero {
  text-align: center;
  padding: var(--space-3xl) var(--space-lg);
  margin-bottom: var(--space-2xl);
  background: var(--gradient-bg);
  position: relative;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
}

.hero-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  height: 300px;
  background: radial-gradient(ellipse, rgba(61, 255, 224, 0.06) 0%, transparent 70%);
  pointer-events: none;
}

.hero-eyebrow {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-accent);
  letter-spacing: 0.25em;
  margin-bottom: var(--space-base);
  text-transform: uppercase;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: var(--text-6xl);
  font-weight: 800;
  margin-bottom: var(--space-lg);
  line-height: 0.9;
  letter-spacing: -0.03em;
  color: var(--color-text);
}

.subtitle {
  font-size: var(--text-lg);
  color: var(--color-text-muted);
  margin-bottom: var(--space-2xl);
  line-height: var(--leading-base);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  font-weight: 400;
}

.cta {
  display: flex;
  gap: var(--space-base);
  justify-content: center;
  flex-wrap: wrap;
}

.user-welcome {
  text-align: center;
}

.welcome-text {
  font-size: var(--text-lg);
  color: var(--color-text);
  margin-bottom: var(--space-lg);
  font-weight: 500;
}

/* Posts Section */
.posts-section {
  margin-top: var(--space-xl);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
  gap: var(--space-base);
  padding: var(--space-lg);
  border-radius: var(--radius-lg);
}

.section-title {
  font-size: var(--text-3xl);
  font-weight: 800;
  color: var(--color-text);
  margin: 0;
  letter-spacing: -0.02em;
}

.section-subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin-top: var(--space-xs);
  font-family: var(--font-mono);
}

.posts-grid {
  gap: var(--space-lg);
}

.empty-state {
  text-align: center;
  padding: var(--space-3xl) var(--space-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
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

.icon {
  margin-right: var(--space-xs);
  transition: transform var(--transition-fast);
}

.btn:hover .icon {
  transform: translateX(4px) !important;
}

.btn-lg {
  padding: var(--space-base) var(--space-2xl);
  font-size: var(--text-base);
  font-weight: 600;
}

.animate-fade-in {
  animation: fadeIn var(--transition-base) ease-out;
}

@media (max-width: 768px) {
  .hero {
    padding: var(--space-2xl) var(--space-base);
  }
  
  .hero-title {
    font-size: var(--text-4xl);
  }
  
  .hero-eyebrow {
    font-size: var(--text-xs);
  }
  
  .subtitle {
    font-size: var(--text-base);
    margin-bottom: var(--space-xl);
  }
  
  .cta {
    flex-direction: column;
    align-items: center;
  }
  
  .btn-lg {
    width: 100%;
    max-width: 300px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .section-header .btn {
    width: 100%;
    justify-content: center;
  }
  
  .empty-state {
    padding: var(--space-2xl) var(--space-base);
  }
}

/* Category Filter Styles */
.category-filter {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
}

.category-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: var(--font-mono);
}

.category-pill:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-accent);
  color: var(--color-text);
}

.category-pill-active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
  font-weight: 500;
}

.category-count {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: var(--text-xs);
  font-weight: 500;
}

.category-select {
  appearance: none;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  padding: 8px 32px 8px 12px;
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;
  min-width: 180px;
  transition: border-color var(--transition-fast);
}

.category-select:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px rgba(var(--color-accent-rgb), 0.1);
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--color-text-muted);
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
}

.btn-outline:hover:not(:disabled) {
  background: var(--color-bg-hover);
  border-color: var(--color-accent);
  color: var(--color-text);
}

.btn-xs {
  padding: 4px 8px;
  font-size: var(--text-xs);
}

.btn-sm {
  padding: 6px 12px;
  font-size: var(--text-sm);
}

.mb-6 {
  margin-bottom: 24px;
}

.mt-4 {
  margin-top: 16px;
}

.pt-4 {
  padding-top: 16px;
}

.border-t {
  border-top: 1px solid var(--color-border);
}

.ml-2 {
  margin-left: 8px;
}

/* Feed Tab Styles */
.feed-tabs {
  display: flex;
  gap: 4px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 4px;
}

.feed-tab {
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: var(--font-mono);
  display: flex;
  align-items: center;
  gap: 6px;
}

.feed-tab:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.feed-tab-active {
  background: var(--color-accent);
  color: white;
  font-weight: 600;
}

.feed-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: var(--text-xs);
  font-weight: 500;
}

@media (max-width: 640px) {
  .posts-grid.grid-cols-1 {
    grid-template-columns: 1fr;
  }
  
  .hero-title {
    font-size: var(--text-3xl);
  }
  
  .category-pill {
    padding: 4px 8px;
    font-size: var(--text-xs);
  }
  
  .category-select {
    min-width: 140px;
    font-size: var(--text-xs);
    padding: 6px 28px 6px 10px;
  }
  
  .feed-tab {
    padding: 6px 12px;
    font-size: var(--text-xs);
  }
}
</style>
