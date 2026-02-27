<template>
  <div>
    <div class="hero">
      <h1>Build your community</h1>
      <p class="subtitle">A modern, open-source platform for meaningful discussions</p>
      <div v-if="!user" class="cta">
        <NuxtLink to="/register" class="btn btn-primary">Get Started</NuxtLink>
      </div>
    </div>

    <div class="posts-section">
      <div class="section-header">
        <h2>Latest Posts</h2>
        <NuxtLink v-if="user" to="/posts/new" class="btn btn-primary btn-sm">
          + New Post
        </NuxtLink>
      </div>
      
      <LoadingSpinner v-if="pending" />
      <ErrorMessage v-else-if="error" :message="error" @retry="refresh" />
      <div v-else-if="posts?.length" class="posts-grid">
        <PostCard v-for="post in posts" :key="post.id" :post="post" />
      </div>
      <div v-else class="text-center empty-state">
        <p>No posts yet. Be the first to post!</p>
        <NuxtLink v-if="user" to="/posts/new" class="btn btn-primary">Create Post</NuxtLink>
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
  padding: 60px 20px;
}

.hero h1 {
  font-size: 48px;
  margin-bottom: 20px;
  color: #333;
}

.subtitle {
  font-size: 20px;
  color: #666;
  margin-bottom: 30px;
}

.cta {
  margin-top: 30px;
}

.posts-section {
  margin-top: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 13px;
}

.posts-grid {
  display: grid;
  gap: 20px;
}

.empty-state {
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.empty-state p {
  color: #666;
  margin-bottom: 20px;
}
</style>
