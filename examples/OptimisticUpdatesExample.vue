<template>
  <div class="optimistic-example">
    <h2 class="font-display">Optimistic Updates Example</h2>
    <p class="font-mono text-text-muted mb-6">
      This example shows how to use optimistic updates for better UX
    </p>

    <!-- Example: Creating a Post -->
    <div class="example-section card p-6 rounded-lg mb-8">
      <h3 class="font-display text-lg mb-4">Creating a Post</h3>
      
      <div class="mb-4">
        <label class="block font-mono text-sm mb-2">Post Title</label>
        <input 
          v-model="newPost.title"
          type="text" 
          class="form-input w-full"
          placeholder="Enter post title"
        />
      </div>
      
      <div class="mb-4">
        <label class="block font-mono text-sm mb-2">Post Content</label>
        <textarea 
          v-model="newPost.content"
          class="form-input w-full"
          rows="3"
          placeholder="Enter post content"
        />
      </div>
      
      <button 
        @click="createPostOptimistically"
        :disabled="!canCreatePost || creatingPost"
        class="btn btn-primary font-mono"
      >
        {{ creatingPost ? 'Creating...' : 'Create Post (Optimistically)' }}
      </button>
      
      <div v-if="optimisticPostId" class="mt-4 p-4 bg-accent/10 border border-accent rounded-lg">
        <p class="font-mono text-sm">
          <span class="text-accent">✓</span> Post created optimistically with ID: {{ optimisticPostId }}
        </p>
        <p class="font-mono text-xs text-text-muted mt-1">
          The post appears immediately while the server processes the request
        </p>
      </div>
    </div>

    <!-- Example: Updating a Post -->
    <div class="example-section card p-6 rounded-lg mb-8">
      <h3 class="font-display text-lg mb-4">Updating a Post</h3>
      
      <div class="mb-4">
        <label class="block font-mono text-sm mb-2">Select Post to Update</label>
        <select v-model="selectedPostId" class="form-input w-full">
          <option value="">Select a post</option>
          <option v-for="post in examplePosts" :key="post.id" :value="post.id">
            {{ post.title }}
          </option>
        </select>
      </div>
      
      <div v-if="selectedPost" class="mb-4">
        <div class="mb-4">
          <label class="block font-mono text-sm mb-2">New Title</label>
          <input 
            v-model="updatedPost.title"
            type="text" 
            class="form-input w-full"
            :placeholder="selectedPost.title"
          />
        </div>
        
        <button 
          @click="updatePostOptimistically"
          :disabled="!canUpdatePost || updatingPost"
          class="btn btn-secondary font-mono"
        >
          {{ updatingPost ? 'Updating...' : 'Update Post (Optimistically)' }}
        </button>
        
        <div v-if="optimisticUpdateId" class="mt-4 p-4 bg-accent2/10 border border-accent2 rounded-lg">
          <p class="font-mono text-sm">
            <span class="text-accent2">↻</span> Post updated optimistically
          </p>
          <p class="font-mono text-xs text-text-muted mt-1">
            The update appears immediately while the server processes the request
          </p>
        </div>
      </div>
    </div>

    <!-- Example: Deleting a Post -->
    <div class="example-section card p-6 rounded-lg">
      <h3 class="font-display text-lg mb-4">Deleting a Post</h3>
      
      <div class="mb-4">
        <label class="block font-mono text-sm mb-2">Select Post to Delete</label>
        <select v-model="postToDeleteId" class="form-input w-full">
          <option value="">Select a post</option>
          <option v-for="post in examplePosts" :key="post.id" :value="post.id">
            {{ post.title }}
          </option>
        </select>
      </div>
      
      <button 
        @click="deletePostOptimistically"
        :disabled="!postToDeleteId || deletingPost"
        class="btn btn-danger font-mono"
      >
        {{ deletingPost ? 'Deleting...' : 'Delete Post (Optimistically)' }}
      </button>
      
      <div v-if="optimisticDeleteId" class="mt-4 p-4 bg-danger/10 border border-danger rounded-lg">
        <p class="font-mono text-sm">
          <span class="text-danger">🗑️</span> Post deleted optimistically
        </p>
        <p class="font-mono text-xs text-text-muted mt-1">
          The post disappears immediately while the server processes the deletion
        </p>
      </div>
    </div>

    <!-- Current State Display -->
    <div class="mt-8 p-6 bg-bg3 border border-border rounded-lg">
      <h3 class="font-display text-lg mb-4">Current State</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 class="font-mono text-sm mb-2">Posts List</h4>
          <div class="space-y-2">
            <div 
              v-for="post in examplePosts" 
              :key="post.id"
              class="p-3 border border-border rounded"
              :class="{ 'opacity-50': post.id.includes('optimistic') }"
            >
              <div class="font-mono text-sm">{{ post.title }}</div>
              <div class="font-mono text-xs text-text-muted">
                {{ post.id.includes('optimistic') ? 'Optimistic' : 'Real' }} • {{ post.content.substring(0, 30) }}...
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h4 class="font-mono text-sm mb-2">Loading States</h4>
          <div class="space-y-2">
            <div 
              v-for="state in loadingStates" 
              :key="state.id"
              class="p-3 border border-border rounded"
            >
              <div class="font-mono text-sm">
                {{ state.type }}: {{ state.id }}
              </div>
              <div class="font-mono text-xs text-text-muted">
                Loading: {{ state.isLoading ? 'Yes' : 'No' }}
              </div>
            </div>
            <div v-if="loadingStates.length === 0" class="font-mono text-sm text-text-muted">
              No active loading states
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PostWithAuthor } from '~/types'

const { 
  optimisticallyAddPost, 
  optimisticallyUpdatePost, 
  optimisticallyDeletePost,
  createLoadingState,
  clearLoadingState
} = useOptimisticUpdates()

// Example data
const examplePosts = ref<PostWithAuthor[]>([
  {
    id: '1',
    title: 'First Post',
    content: 'This is the first example post',
    user_id: 'user1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    author: {
      id: 'user1',
      username: 'exampleuser',
      created_at: '2024-01-01T00:00:00Z'
    }
  },
  {
    id: '2',
    title: 'Second Post',
    content: 'This is the second example post',
    user_id: 'user1',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    author: {
      id: 'user1',
      username: 'exampleuser',
      created_at: '2024-01-01T00:00:00Z'
    }
  }
])

// New post form
const newPost = ref({
  title: '',
  content: ''
})

const creatingPost = ref(false)
const optimisticPostId = ref<string | null>(null)

// Update post form
const selectedPostId = ref('')
const updatedPost = ref({
  title: ''
})
const updatingPost = ref(false)
const optimisticUpdateId = ref<string | null>(null)

// Delete post
const postToDeleteId = ref('')
const deletingPost = ref(false)
const optimisticDeleteId = ref<string | null>(null)

// Loading states
const loadingStates = ref<Array<{ id: string; type: string; isLoading: boolean }>>([])

// Computed properties
const canCreatePost = computed(() => {
  return newPost.value.title.trim() && newPost.value.content.trim()
})

const canUpdatePost = computed(() => {
  return selectedPostId.value && updatedPost.value.title.trim()
})

const selectedPost = computed(() => {
  return examplePosts.value.find(post => post.id === selectedPostId.value)
})

// Example functions
const createPostOptimistically = async () => {
  if (!canCreatePost.value) return

  creatingPost.value = true
  const optimisticId = `optimistic-${Date.now()}`
  optimisticPostId.value = optimisticId

  // Create loading state
  loadingStates.value.push(createLoadingState(optimisticId, 'create'))

  // Optimistically add post to list
  examplePosts.value = optimisticallyAddPost(
    examplePosts.value,
    newPost.value,
    'current-user-id',
    { username: 'currentuser' }
  )

  // Simulate API call
  try {
    await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate network delay
    
    // In a real app, you would:
    // 1. Make the actual API call
    // 2. Replace the optimistic post with the real one
    // 3. Clear the loading state
    
    // For this example, we'll just simulate success
    const realPost: PostWithAuthor = {
      id: `real-${Date.now()}`,
      title: newPost.value.title,
      content: newPost.value.content,
      user_id: 'current-user-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: {
        id: 'current-user-id',
        username: 'currentuser',
        created_at: new Date().toISOString()
      }
    }

    // Replace optimistic post with real one
    examplePosts.value = examplePosts.value.map(post => 
      post.id === optimisticId ? realPost : post
    )

    // Clear form
    newPost.value = { title: '', content: '' }
    optimisticPostId.value = null
  } catch (error) {
    console.error('Failed to create post:', error)
    // Remove optimistic post on error
    examplePosts.value = examplePosts.value.filter(post => post.id !== optimisticId)
  } finally {
    creatingPost.value = false
    // Clear loading state
    loadingStates.value = clearLoadingState(loadingStates.value, optimisticId)
  }
}

const updatePostOptimistically = async () => {
  if (!canUpdatePost.value || !selectedPost.value) return

  updatingPost.value = true
  const postId = selectedPostId.value
  optimisticUpdateId.value = postId

  // Create loading state
  loadingStates.value.push(createLoadingState(postId, 'update'))

  // Optimistically update post
  examplePosts.value = optimisticallyUpdatePost(
    examplePosts.value,
    postId,
    { title: updatedPost.value.title }
  )

  // Simulate API call
  try {
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate network delay
    
    // In a real app, you would make the actual API call here
    // For this example, we'll just simulate success
    
    // Clear form
    updatedPost.value = { title: '' }
    selectedPostId.value = ''
    optimisticUpdateId.value = null
  } catch (error) {
    console.error('Failed to update post:', error)
    // In a real app, you would revert the optimistic update here
  } finally {
    updatingPost.value = false
    // Clear loading state
    loadingStates.value = clearLoadingState(loadingStates.value, postId)
  }
}

const deletePostOptimistically = async () => {
  if (!postToDeleteId.value) return

  deletingPost.value = true
  const postId = postToDeleteId.value
  optimisticDeleteId.value = postId

  // Store the post for potential rollback
  const postToDelete = examplePosts.value.find(post => post.id === postId)
  
  // Create loading state
  loadingStates.value.push(createLoadingState(postId, 'delete'))

  // Optimistically delete post
  examplePosts.value = optimisticallyDeletePost(examplePosts.value, postId)

  // Simulate API call
  try {
    await new Promise(resolve => setTimeout(resolve, 800)) // Simulate network delay
    
    // In a real app, you would make the actual API call here
    // For this example, we'll just simulate success
    
    // Clear selection
    postToDeleteId.value = ''
    optimisticDeleteId.value = null
  } catch (error) {
    console.error('Failed to delete post:', error)
    // Revert optimistic delete on error
    if (postToDelete) {
      examplePosts.value = [postToDelete, ...examplePosts.value]
    }
  } finally {
    deletingPost.value = false
    // Clear loading state
    loadingStates.value = clearLoadingState(loadingStates.value, postId)
  }
}
</script>

<style scoped>
.optimistic-example {
  max-width: 800px;
  margin: 0 auto;
}

.example-section {
  border: 1px solid var(--color-border);
}

.form-input {
  padding: var(--space-sm) var(--space-base);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-base);
  background: var(--color-bg3);
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.btn-danger {
  background: var(--color-danger);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: var(--color-danger-dark);
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>