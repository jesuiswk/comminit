<template>
  <div class="search-bar relative">
    <!-- Search Input -->
    <div class="search-input-wrapper">
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        placeholder="Search posts, users, comments..."
        class="search-input font-mono"
        @focus="showSuggestions = true"
        @keydown.enter="performSearch"
        @keydown.esc="hideSuggestions"
      />
      <button 
        @click="performSearch"
        class="search-button"
        :disabled="!searchQuery.trim()"
      >
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" 
            stroke="currentColor" 
            stroke-width="2" 
            stroke-linecap="round" 
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <!-- Search Suggestions -->
    <div 
      v-if="showSuggestions && searchQuery.trim()"
      v-click-outside="hideSuggestions"
      class="search-suggestions"
    >
      <!-- Loading -->
      <div v-if="loadingSuggestions" class="suggestion-loading">
        <LoadingSpinner size="sm" />
      </div>

      <!-- Suggestions -->
      <div v-else-if="suggestions.posts.length || suggestions.users.length || suggestions.comments.length" class="suggestions-content">
        <!-- Posts -->
        <div v-if="suggestions.posts.length" class="suggestion-section">
          <h4 class="suggestion-section-title font-mono">Posts</h4>
          <div class="suggestion-list">
            <button
              v-for="post in suggestions.posts"
              :key="post.id"
              @click="goToPost(post.id)"
              class="suggestion-item"
            >
              <div class="suggestion-item-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12H15M9 8H15M9 16H12M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                    stroke="currentColor" 
                    stroke-width="2" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
              <div class="suggestion-item-content">
                <div class="suggestion-item-title">{{ post.title }}</div>
                <div class="suggestion-item-meta">
                  by {{ post.author?.username || 'Unknown' }}
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Users -->
        <div v-if="suggestions.users.length" class="suggestion-section">
          <h4 class="suggestion-section-title font-mono">Users</h4>
          <div class="suggestion-list">
            <button
              v-for="user in suggestions.users"
              :key="user.id"
              @click="goToUser(user.id)"
              class="suggestion-item"
            >
              <div class="suggestion-item-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" 
                    stroke="currentColor" 
                    stroke-width="2" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
              <div class="suggestion-item-content">
                <div class="suggestion-item-title">{{ user.username }}</div>
              </div>
            </button>
          </div>
        </div>

        <!-- Comments -->
        <div v-if="suggestions.comments.length" class="suggestion-section">
          <h4 class="suggestion-section-title font-mono">Comments</h4>
          <div class="suggestion-list">
            <button
              v-for="comment in suggestions.comments"
              :key="comment.id"
              @click="goToComment(comment)"
              class="suggestion-item"
            >
              <div class="suggestion-item-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0034 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.9C9.87812 3.30493 11.1801 2.99656 12.5 3H13C15.0843 3.11499 17.053 3.99477 18.5291 5.47086C20.0052 6.94696 20.885 8.91565 21 11V11.5Z" 
                    stroke="currentColor" 
                    stroke-width="2" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
              <div class="suggestion-item-content">
                <div class="suggestion-item-title">{{ comment.content.substring(0, 60) }}{{ comment.content.length > 60 ? '...' : '' }}</div>
                <div class="suggestion-item-meta">
                  by {{ comment.author?.username || 'Unknown' }}
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- View all results -->
        <div class="suggestion-footer">
          <button @click="performSearch" class="view-all-results font-mono">
            View all results for "{{ searchQuery }}"
          </button>
        </div>
      </div>

      <!-- No suggestions -->
      <div v-else-if="searchQuery.trim() && !loadingSuggestions" class="no-suggestions">
        <p class="font-mono text-sm text-text-muted">No results found</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CommentWithAuthor, PostWithAuthor, Profile } from '~/types'
import { debounce } from 'lodash-es'
import { onClickOutside } from '@vueuse/core'

interface SearchSuggestions {
  posts: PostWithAuthor[]
  users: Profile[]
  comments: CommentWithAuthor[]
}

const searchQuery = ref('')
const showSuggestions = ref(false)
const loadingSuggestions = ref(false)
const suggestions = ref<SearchSuggestions>({
  posts: [],
  users: [],
  comments: []
})

const { getSuggestions } = useSearch()
const searchInput = ref<HTMLInputElement | null>(null)

// Debounced search for suggestions
const fetchSuggestions = debounce(async (query: string) => {
  if (!query.trim()) {
    suggestions.value = { posts: [], users: [], comments: [] }
    return
  }

  loadingSuggestions.value = true
  try {
    const response = await getSuggestions(query)
    if (response.data) {
      suggestions.value = response.data
    }
  } catch (error) {
    console.error('Error fetching suggestions:', error)
  } finally {
    loadingSuggestions.value = false
  }
}, 300)

// Watch search query for suggestions
watch(searchQuery, (newQuery) => {
  if (showSuggestions.value) {
    fetchSuggestions(newQuery)
  }
})

const performSearch = () => {
  if (!searchQuery.value.trim()) return
  
  hideSuggestions()
  navigateTo({
    path: '/search',
    query: { q: searchQuery.value }
  })
}

const hideSuggestions = () => {
  showSuggestions.value = false
}

const goToPost = (postId: string) => {
  hideSuggestions()
  navigateTo(`/posts/${postId}`)
}

const goToUser = (userId: string) => {
  hideSuggestions()
  navigateTo(`/users/${userId}`)
}

const goToComment = (comment: CommentWithAuthor) => {
  hideSuggestions()
  navigateTo(`/posts/${comment.post_id}#comment-${comment.id}`)
}

// Focus search input when clicking outside
onClickOutside(searchInput, hideSuggestions)

// Keyboard shortcuts
onMounted(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ctrl+K or Cmd+K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      searchInput.value?.focus()
    }
    // Escape to clear search
    if (e.key === 'Escape' && document.activeElement === searchInput.value) {
      searchQuery.value = ''
      hideSuggestions()
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })
})
</script>

<style scoped>
.search-bar {
  width: 100%;
  max-width: 400px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: var(--space-sm) var(--space-base);
  padding-right: 44px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg3);
  color: var(--color-text);
  font-size: var(--text-sm);
  transition: all var(--transition-fast);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(61, 255, 224, 0.1);
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.search-button {
  position: absolute;
  right: var(--space-sm);
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast);
}

.search-button:hover:not(:disabled) {
  color: var(--color-accent);
}

.search-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-icon {
  transition: transform var(--transition-fast);
}

.search-button:hover:not(:disabled) .search-icon {
  transform: scale(1.1);
}

/* Search Suggestions */
.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-bg3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  margin-top: 8px;
  z-index: var(--z-dropdown);
  max-height: 500px;
  overflow-y: auto;
}

.suggestion-loading,
.no-suggestions {
  padding: var(--space-2xl);
  text-align: center;
}

.suggestions-content {
  padding: var(--space-sm);
}

.suggestion-section {
  margin-bottom: var(--space-base);
}

.suggestion-section:last-child {
  margin-bottom: 0;
}

.suggestion-section-title {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-muted);
  margin: 0 0 var(--space-xs) var(--space-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  border-radius: var(--radius-base);
  transition: background-color var(--transition-fast);
  color: var(--color-text);
}

.suggestion-item:hover {
  background: rgba(61, 255, 224, 0.05);
}

.suggestion-item-icon {
  flex-shrink: 0;
  color: var(--color-accent);
}

.suggestion-item-content {
  flex: 1;
  min-width: 0;
}

.suggestion-item-title {
  font-size: var(--text-sm);
  font-weight: 500;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suggestion-item-meta {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.suggestion-footer {
  padding: var(--space-sm);
  border-top: 1px solid var(--color-border);
}

.view-all-results {
  width: 100%;
  background: none;
  border: none;
  color: var(--color-accent);
  cursor: pointer;
  padding: var(--space-sm);
  border-radius: var(--radius-base);
  font-size: var(--text-sm);
  font-weight: 600;
  transition: background-color var(--transition-fast);
}

.view-all-results:hover {
  background: rgba(61, 255, 224, 0.1);
}

/* Responsive Design */
@media (max-width: 768px) {
  .search-bar {
    max-width: 100%;
    order: -1;
    margin-bottom: var(--space-base);
  }
  
  .search-suggestions {
    position: fixed;
    top: 120px;
    left: var(--space-base);
    right: var(--space-base);
    max-height: 60vh;
  }
}

@media (max-width: 640px) {
  .search-input {
    font-size: var(--text-base);
  }
}
</style>