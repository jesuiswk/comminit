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
        <div>
          <h2 class="section-title font-display">Latest Discussions</h2>
          <p class="section-subtitle font-mono">Join conversations happening right now</p>
        </div>
        <NuxtLink v-if="user" to="/posts/new" class="btn btn-primary font-mono">
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          $ new_post
        </NuxtLink>
      </div>
      
      <!-- Loading, Error, or Posts -->
      <LoadingSpinner v-if="pending" />
      <ErrorMessage v-else-if="error" :message="error" @retry="refresh" />
      <div v-else-if="posts?.length" class="posts-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <PostCard v-for="post in posts" :key="post.id" :post="post" />
      </div>
      
      <!-- Empty State -->
      <div v-else class="text-center empty-state card p-8 rounded-lg">
        <div class="empty-state-icon">
          <div class="icon-box" style="width: 64px; height: 64px; font-size: 24px; margin: 0 auto;">ci</div>
        </div>
        <h3 class="empty-state-title font-display">No posts yet</h3>
        <p class="empty-state-text font-mono">Be the first to start a conversation!</p>
        <NuxtLink v-if="user" to="/posts/new" class="btn btn-primary mt-4 font-mono">$ create_post</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PostWithAuthor } from '~/types'

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const error = ref('')

const { data: posts, pending, refresh } = await useAsyncData<PostWithAuthor[]>('posts', async () => {
  error.value = ''
  try {
    const { data, error: fetchError } = await supabase
      .from('posts')
      .select('*, author:profiles(username)')
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      error.value = fetchError.message
      return []
    }
    
    return data || []
  } catch (e) {
    error.value = 'Failed to load posts'
    console.error('Error fetching posts:', e)
    return []
  }
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

@media (max-width: 640px) {
  .posts-grid.grid-cols-1 {
    grid-template-columns: 1fr;
  }
  
  .hero-title {
    font-size: var(--text-3xl);
  }
}
</style>
