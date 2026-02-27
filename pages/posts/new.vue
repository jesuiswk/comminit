<template>
  <div class="card">
    <h1>Create New Post</h1>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label class="form-label">Title</label>
        <input 
          v-model="title" 
          type="text" 
          class="form-input"
          :class="{ 'input-error': validationErrors.title }"
          maxlength="200"
          required 
        />
        <div class="field-meta">
          <span v-if="validationErrors.title" class="validation-error">
            {{ validationErrors.title }}
          </span>
          <span class="char-count" :class="{ 'near-limit': title.length > 180 }">
            {{ title.length }}/200
          </span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Content</label>
        <textarea 
          v-model="content" 
          class="form-textarea"
          :class="{ 'input-error': validationErrors.content }"
          rows="8"
          required 
        />
        <div class="field-meta">
          <span v-if="validationErrors.content" class="validation-error">
            {{ validationErrors.content }}
          </span>
          <span class="char-count" :class="{ 'near-limit': content.length > 4500 }">
            {{ content.length }}/5000
          </span>
        </div>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
      <div class="form-actions">
        <NuxtLink to="/" class="btn btn-secondary">Cancel</NuxtLink>
        <button type="submit" class="btn btn-primary" :disabled="loading || !title.trim() || !content.trim()">
          {{ loading ? 'Publishing...' : 'Publish' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { validatePost } from '~/composables/useValidation'
import type { ValidationResult, PostForm } from '~/types'

definePageMeta({
  middleware: 'auth'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const title = ref('')
const content = ref('')
const error = ref('')
const loading = ref(false)
const validationErrors = ref<Record<string, string>>({
  title: '',
  content: ''
})

const clearValidationErrors = () => {
  validationErrors.value = { title: '', content: '' }
}

  const handleSubmit = async () => {
    if (!user.value) {
      error.value = 'You must be logged in to create a post'
      return
    }

    loading.value = true
    error.value = ''
    clearValidationErrors()
    
    // Validate input using Zod schema
    const validation: ValidationResult<PostForm> = validatePost({
      title: title.value,
      content: content.value
    })
    
    if (!validation.success) {
      error.value = validation.error || 'Validation failed'
      loading.value = false
      return
    }
    
    try {
      // First, ensure user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.value.id)
        .single()

      // If profile doesn't exist, create one
      if (profileError?.code === 'PGRST116') {
        const username = user.value.user_metadata?.username || 
                        user.value.email?.split('@')[0] || 
                        `user_${user.value.id.substring(0, 8)}`
        
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: user.value.id,
            username: username
          })

        if (createProfileError) {
          error.value = `Failed to create user profile: ${createProfileError.message}`
          loading.value = false
          return
        }
      } else if (profileError) {
        // Other database error
        error.value = `Database error: ${profileError.message}`
        loading.value = false
        return
      }

      // Now create the post
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          title: title.value.trim(),
          content: content.value.trim(),
          user_id: user.value.id
        })
      
      if (postError) {
        error.value = postError.message
      } else {
        navigateTo('/')
      }
    } catch (e) {
      error.value = 'An unexpected error occurred. Please try again.'
      console.error('Post creation error:', e)
    } finally {
      loading.value = false
    }
  }
</script>

<style scoped>
.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.validation-error {
  color: #dc3545;
  font-size: 0.875rem;
}

.field-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.char-count {
  font-size: 0.75rem;
  color: #6c757d;
}

.char-count.near-limit {
  color: #ffc107;
  font-weight: 500;
}

.input-error {
  border-color: #dc3545 !important;
}

.input-error:focus {
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.25);
}
</style>
