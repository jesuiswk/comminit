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
      <h2>Latest Posts</h2>
      <div v-if="pending" class="text-center">Loading...</div>
      <div v-else-if="posts?.length" class="posts-grid">
        <PostCard v-for="post in posts" :key="post.id" :post="post" />
      </div>
      <div v-else class="text-center">No posts yet. Be the first to post!</div>
    </div>
  </div>
</template>

<script setup>
const user = useSupabaseUser()
const supabase = useSupabaseClient()

const { data: posts, pending } = await useAsyncData('posts', async () => {
  const { data } = await supabase
    .from('posts')
    .select('*, author:profiles(username)')
    .order('created_at', { ascending: false })
  return data || []
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

.posts-section h2 {
  margin-bottom: 20px;
}

.posts-grid {
  display: grid;
  gap: 20px;
}
</style>