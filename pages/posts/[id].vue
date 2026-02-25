<template>
  <div v-if="post">
    <article class="card">
      <h1>{{ post.title }}</h1>
      <div class="meta">
        <span>By {{ post.author?.username || 'Unknown' }}</span>
        <span>•</span>
        <time>{{ formatDate(post.created_at) }}</time>
      </div>
      <div class="content">{{ post.content }}</div>
    </article>

    <div class="card">
      <h3>Comments</h3>
      <div v-if="user" class="comment-form">
        <textarea v-model="newComment" class="form-textarea" placeholder="Write a comment..." />
        <button @click="addComment" class="btn btn-primary" :disabled="!newComment.trim()">
          Post Comment
        </button>
      </div>
      <p v-else class="text-center">
        <NuxtLink to="/login">Login</NuxtLink> to comment
      </p>

      <div v-if="comments?.length" class="comments-list">
        <div v-for="comment in comments" :key="comment.id" class="comment">
          <div class="comment-meta">
            <strong>{{ comment.author?.username }}</strong>
            <time>{{ formatDate(comment.created_at) }}</time>
          </div>
          <p>{{ comment.content }}</p>
        </div>
      </div>
      <p v-else class="text-center">No comments yet.</p>
    </div>
  </div>
  <div v-else class="text-center">Post not found.</div>
</template>

<script setup>
const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const { data: post } = await useAsyncData(`post-${route.params.id}`, async () => {
  const { data } = await supabase
    .from('posts')
    .select('*, author:profiles(username)')
    .eq('id', route.params.id)
    .single()
  return data
})

const { data: comments, refresh: refreshComments } = await useAsyncData(`comments-${route.params.id}`, async () => {
  const { data } = await supabase
    .from('comments')
    .select('*, author:profiles(username)')
    .eq('post_id', route.params.id)
    .order('created_at', { ascending: true })
  return data || []
})

const newComment = ref('')

const addComment = async () => {
  if (!newComment.value.trim()) return
  
  await supabase.from('comments').insert({
    post_id: route.params.id,
    content: newComment.value,
    user_id: user.value.id
  })
  
  newComment.value = ''
  refreshComments()
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.meta {
  color: #666;
  margin: 10px 0 20px;
  display: flex;
  gap: 10px;
}

.content {
  line-height: 1.8;
  white-space: pre-wrap;
}

.comment-form {
  margin-bottom: 20px;
}

.comment-form textarea {
  margin-bottom: 10px;
}

.comments-list {
  margin-top: 20px;
}

.comment {
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.comment:last-child {
  border-bottom: none;
}

.comment-meta {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
  color: #666;
  font-size: 14px;
}
</style>