<template>
  <NuxtLink :to="`/posts/${post.id}`" class="post-card">
    <h3>{{ post.title }}</h3>
    <p class="excerpt">{{ excerpt }}</p>
    
    <div class="post-meta">
      <span>{{ post.author?.username || 'Unknown' }}</span>
      <span>•</span>
      <time>{{ formatDate(post.created_at) }}</time>
    </div>
  </NuxtLink>
</template>

<script setup>
const props = defineProps({
  post: {
    type: Object,
    required: true
  }
})

const excerpt = computed(() => {
  return props.post.content?.slice(0, 150) + '...' || ''
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.post-card {
  display: block;
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s, box-shadow 0.2s;
}

.post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.post-card h3 {
  margin-bottom: 10px;
  color: #333;
}

.excerpt {
  color: #666;
  margin-bottom: 15px;
  line-height: 1.5;
}

.post-meta {
  font-size: 14px;
  color: #999;
  display: flex;
  gap: 8px;
}
</style>