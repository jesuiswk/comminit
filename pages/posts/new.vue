<template>
  <div class="card">
    <h1>Create New Post</h1>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label class="form-label">Title</label>
        <input v-model="title" type="text" class="form-input" required maxlength="200" />
      </div>
      <div class="form-group">
        <label class="form-label">Content</label>
        <textarea v-model="content" class="form-textarea" required />
      </div>
      <div v-if="error" class="error">{{ error }}</div>
      <div class="form-actions">
        <NuxtLink to="/" class="btn btn-secondary">Cancel</NuxtLink>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Publishing...' : 'Publish' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const title = ref('')
const content = ref('')
const error = ref('')
const loading = ref(false)

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  
  const { error: postError } = await supabase
    .from('posts')
    .insert({
      title: title.value,
      content: content.value,
      user_id: user.value.id
    })
  
  if (postError) {
    error.value = postError.message
  } else {
    navigateTo('/')
  }
  
  loading.value = false
}
</script>

<style scoped>
.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
</style>