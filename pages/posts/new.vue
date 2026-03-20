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
      <div class="form-group">
        <label class="form-label">Category (optional)</label>
        <div class="category-selector">
          <select 
            v-model="category" 
            class="form-input"
            :class="{ 'input-error': validationErrors.category }"
          >
            <option value="">Select a category...</option>
            <option v-for="cat in popularCategories" :key="cat.category" :value="cat.category">
              {{ cat.category }} ({{ cat.post_count }} posts)
            </option>
            <option value="custom">Custom category...</option>
          </select>
          <input 
            v-if="category === 'custom'"
            v-model="customCategory"
            type="text"
            class="form-input mt-2"
            placeholder="Enter custom category"
            maxlength="50"
          />
        </div>
        <div class="field-meta">
          <span v-if="validationErrors.category" class="validation-error">
            {{ validationErrors.category }}
          </span>
          <span class="char-count" :class="{ 'near-limit': (category === 'custom' && customCategory.length > 40) }">
            <span v-if="category === 'custom'">{{ customCategory.length }}/50</span>
          </span>
        </div>
        <div class="category-hint">
          <small>Choose from popular categories or create your own</small>
        </div>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
      <div class="form-actions">
        <NuxtLink to="/" class="btn btn-secondary">Cancel</NuxtLink>
        <button type="button" class="btn btn-outline" @click="saveAsDraft" :disabled="loading || !title.trim() || !content.trim()" :class="{ 'btn-loading': savingDraft }">
          <span v-if="!savingDraft">Save as Draft</span>
          <span v-else class="sr-only">Saving draft...</span>
        </button>
        <button type="submit" class="btn btn-primary" :disabled="loading || !title.trim() || !content.trim()" :class="{ 'btn-loading': loading }">
          <span v-if="!loading">Publish</span>
          <span v-else class="sr-only">Publishing...</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { validatePost } from '~/composables/useValidation'
import { usePosts } from '~/composables/usePosts'
import type { ValidationResult, PostForm } from '~/types'

definePageMeta({
  middleware: 'auth'
})

const { createPost, saveDraft, getPopularCategories } = usePosts()
const user = useSupabaseUser()

const title = ref('')
const content = ref('')
const category = ref('')
const customCategory = ref('')
const error = ref('')
const loading = ref(false)
const savingDraft = ref(false)
const popularCategories = ref<Array<{ category: string; post_count: number }>>([])
const validationErrors = ref<Record<string, string>>({
  title: '',
  content: '',
  category: ''
})

onMounted(async () => {
  // Load popular categories for the dropdown
  const categoriesResult = await getPopularCategories(10)
  if (categoriesResult.data) {
    popularCategories.value = categoriesResult.data
  }
})

const clearValidationErrors = () => {
  validationErrors.value = { title: '', content: '', category: '' }
}

const getFinalCategory = (): string | null => {
  if (!category.value) return null
  if (category.value === 'custom') {
    return customCategory.value.trim() || null
  }
  return category.value.trim() || null
}

const saveAsDraft = async () => {
  if (!user.value) {
    error.value = 'You must be logged in to save a draft'
    return
  }

  savingDraft.value = true
  error.value = ''
  clearValidationErrors()
  
  // Validate input using Zod schema
  const validation: ValidationResult<PostForm> = validatePost({
    title: title.value,
    content: content.value,
    category: getFinalCategory()
  })
  
  if (!validation.success) {
    error.value = validation.error || 'Validation failed'
    savingDraft.value = false
    return
  }
  
  try {
    const result = await saveDraft({
      title: title.value,
      content: content.value,
      category: getFinalCategory()
    })
    
    if (result.error) {
      error.value = result.error.message
    } else {
      // Success - navigate to homepage or show success message
      navigateTo('/')
    }
  } catch (e) {
    error.value = 'An unexpected error occurred. Please try again.'
    console.error('Draft save error:', e)
  } finally {
    savingDraft.value = false
  }
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
    content: content.value,
    category: getFinalCategory()
  })
  
  if (!validation.success) {
    error.value = validation.error || 'Validation failed'
    loading.value = false
    return
  }
  
  try {
    const result = await createPost({
      title: title.value,
      content: content.value,
      category: getFinalCategory()
    })
    
    if (result.error) {
      error.value = result.error.message
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

.category-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-hint {
  margin-top: 4px;
  color: #6c757d;
  font-size: 0.875rem;
}

.mt-2 {
  margin-top: 8px;
}

.btn-outline {
  background-color: transparent;
  border: 1px solid #6c757d;
  color: #6c757d;
}

.btn-outline:hover:not(:disabled) {
  background-color: #6c757d;
  color: white;
}

.btn-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
