<template>
  <div>
    <!-- Loading State with Skeleton -->
    <div v-if="postPending">
      <SkeletonLoader type="post" size="lg" />
    </div>
    
    <!-- Error State -->
    <ErrorMessage 
      v-else-if="postError" 
      :message="postError" 
      show-retry 
      @retry="refreshPost" 
    />
    
    <div v-else-if="post">
      <article class="card">
        <div class="post-header">
          <h1>{{ post.title }}</h1>
          <div v-if="canEditPost(post.user_id)" class="post-actions">
            <button 
              v-if="!isEditing" 
              @click="startEdit" 
              class="btn btn-secondary btn-sm"
            >
              Edit
            </button>
            <button 
              v-if="!isEditing" 
              @click="confirmDelete" 
              class="btn btn-danger btn-sm"
            >
              Delete
            </button>
            <template v-else>
              <button @click="cancelEdit" class="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button 
                @click="saveEdit" 
                class="btn btn-primary btn-sm"
                :disabled="saving"
              >
                {{ saving ? 'Saving...' : 'Save' }}
              </button>
            </template>
          </div>
        </div>
        
        <div class="meta">
          <span>By {{ post.author?.username || 'Unknown' }}</span>
          <span>•</span>
          <time>{{ formatDate(post.created_at) }}</time>
        </div>
        
        <div v-if="!isEditing" class="content">{{ post.content }}</div>
        <div v-else class="edit-form">
          <textarea 
            v-model="editedContent" 
            class="form-textarea"
            rows="10"
          />
          <div v-if="editError" class="error">{{ editError }}</div>
        </div>
      </article>

      <div class="card">
        <h3>Comments</h3>
        
        <div v-if="user" class="comment-form">
          <textarea 
            v-model="newComment" 
            class="form-textarea" 
            placeholder="Write a comment..."
            rows="3"
          />
          <div class="comment-actions">
            <span class="char-count">{{ newComment.length }}/1000</span>
            <button 
              @click="addComment" 
              class="btn btn-primary" 
              :disabled="!newComment.trim() || addingComment"
            >
              {{ addingComment ? 'Posting...' : 'Post Comment' }}
            </button>
          </div>
          <div v-if="commentError" class="error">{{ commentError }}</div>
        </div>
        <p v-else class="text-center login-prompt">
          <NuxtLink to="/login">Login</NuxtLink> to comment
        </p>

        <!-- Comments Loading State -->
        <div v-if="commentsPending" class="comments-loading">
          <SkeletonLoader v-for="i in 3" :key="i" type="comment" size="md" />
        </div>
        
        <!-- Comments List -->
        <div v-else-if="comments?.length" class="comments-list">
          <CommentItem 
            v-for="comment in topLevelComments" 
            :key="comment.id" 
            :comment="comment"
            :replies="comments"
            @reply="handleReply"
            @edit="handleEdit"
            @delete="handleDelete"
          />
        </div>
        
        <!-- Empty Comments State -->
        <EmptyState
          v-else
          icon="💬"
          title="No comments yet"
          description="Be the first to share your thoughts!"
          size="sm"
          variant="subtle"
        />
      </div>
    </div>
    
    <!-- Not Found State -->
    <EmptyState
      v-else
      icon="🔍"
      title="Post not found"
      description="The post you're looking for doesn't exist or has been removed."
      action-text="Back to Home"
      size="lg"
      variant="bordered"
      @action="navigateTo('/')"
    />
  </div>
</template>

<script setup lang="ts">
import type { PostWithAuthor, CommentWithAuthor } from '~/types'
import type { Database } from '~/types/supabase'

const route = useRoute()
const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()

// Post editing state
const isEditing = ref(false)
const editedContent = ref('')
const saving = ref(false)
const editError = ref('')

// Comments state
const newComment = ref('')
const addingComment = ref(false)
const commentError = ref('')

// Fetch post
const postId = computed(() => route.params.id as string)
const { 
  data: post, 
  pending: postPending, 
  error: postErrorMsg,
  refresh: refreshPost 
} = await useAsyncData<PostWithAuthor | null>(`post-${postId.value}`, async () => {
  const { data, error } = await supabase
    .from('posts')
    .select('*, author:profiles(*)')
    .eq('id', postId.value)
    .single()
  
  if (error) throw error
  return data
})

const postError = computed(() => postErrorMsg.value?.message || '')

// Fetch comments
const { 
  data: comments, 
  pending: commentsPending,
  refresh: refreshComments 
} = await useAsyncData<CommentWithAuthor[]>(`comments-${postId.value}`, async () => {
  const { data, error } = await supabase
    .from('comments')
    .select('*, author:profiles(*)')
    .eq('post_id', postId.value)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data || []
})

// Get top-level comments (comments without parent_comment_id)
const topLevelComments = computed(() => {
  return comments.value?.filter(comment => !comment.parent_comment_id) || []
})

// Permissions
const canEditPost = (userId: string): boolean => {
  return user.value?.id === userId
}

// Post editing
const startEdit = () => {
  if (post.value) {
    editedContent.value = post.value.content
    isEditing.value = true
    editError.value = ''
  }
}

const cancelEdit = () => {
  isEditing.value = false
  editedContent.value = ''
  editError.value = ''
}

const saveEdit = async () => {
  if (!post.value || !user.value) return
  
  saving.value = true
  editError.value = ''
  
  try {
    const { error } = await supabase
      .from('posts')
      .update({ content: editedContent.value.trim() } as any)
      .eq('id', post.value.id)
      .eq('user_id', user.value.id)
    
    if (error) {
      editError.value = error.message
    } else {
      isEditing.value = false
      await refreshPost()
    }
  } catch (e) {
    editError.value = 'Failed to save changes'
    console.error('Edit error:', e)
  } finally {
    saving.value = false
  }
}

const confirmDelete = async () => {
  if (!post.value || !user.value || !confirm('Are you sure you want to delete this post?')) return
  
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', post.value.id)
      .eq('user_id', user.value.id)
    
    if (error) {
      alert('Failed to delete post: ' + error.message)
    } else {
      navigateTo('/')
    }
  } catch (e) {
    alert('An error occurred while deleting the post')
    console.error('Delete error:', e)
  }
}

// Comment operations
const addComment = async () => {
  if (!newComment.value.trim() || !user.value) return
  
  addingComment.value = true
  commentError.value = ''
  
  try {
    const { error } = await supabase
      .from('comments')
      .insert({
        post_id: postId.value,
        content: newComment.value.trim(),
        user_id: user.value.id
      })
    
    if (error) {
      commentError.value = error.message
    } else {
      newComment.value = ''
      await refreshComments()
    }
  } catch (e) {
    commentError.value = 'Failed to add comment'
    console.error('Comment error:', e)
  } finally {
    addingComment.value = false
  }
}

// Event handlers for CommentItem events
const handleReply = async (commentId: string, content: string) => {
  // The reply is already handled by the CommentItem component
  // We just need to refresh the comments list
  await refreshComments()
}

const handleEdit = async (commentId: string, content: string) => {
  // The edit is already handled by the CommentItem component
  // We just need to refresh the comments list
  await refreshComments()
}

const handleDelete = async (commentId: string) => {
  // The delete is already handled by the CommentItem component
  // We just need to refresh the comments list
  await refreshComments()
}

// SEO Meta
const seoTitle = computed(() => {
  if (post.value?.title) {
    return `${post.value.title} · comminit`
  }
  return 'comminit · initialize communication'
})

const seoDescription = computed(() => {
  if (post.value?.content) {
    const excerpt = post.value.content.substring(0, 155).trim()
    return `${excerpt}${post.value.content.length > 155 ? '...' : ''}`
  }
  return 'A modern, open‑source platform for meaningful discussions'
})

useSeoMeta({
  title: seoTitle,
  ogTitle: seoTitle,
  description: seoDescription,
  ogDescription: seoDescription,
  ogImage: '/og-image.png',
  ogImageAlt: 'comminit platform',
  twitterCard: 'summary_large_image',
  twitterTitle: seoTitle,
  twitterDescription: seoDescription,
  twitterImage: '/og-image.png',
})

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 10px;
}

.post-header h1 {
  margin: 0;
  flex: 1;
}

.post-actions {
  display: flex;
  gap: 8px;
}

.btn-danger {
  background: rgba(255, 91, 139, 0.1);
  color: var(--color-accent3);
  border: 1px solid rgba(255, 91, 139, 0.3);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-base);
}

.btn-danger:hover {
  background: rgba(255, 91, 139, 0.2);
  color: white;
  border-color: var(--color-accent3);
}

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

.edit-form {
  margin-top: 16px;
}

.edit-form textarea {
  margin-bottom: 12px;
}

.comment-form {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.comment-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.char-count {
  font-size: 12px;
  color: #999;
}

.comments-list {
  margin-top: 20px;
}

.comments-loading {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.login-prompt {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 6px;
}

.not-found {
  padding: 60px 20px;
  text-align: center;
}

.not-found h2 {
  margin-bottom: 12px;
  color: #333;
}

.not-found p {
  color: #666;
  margin-bottom: 24px;
}

/* Dark theme support */
[data-theme="dark"] .meta {
  color: var(--color-text-muted);
}

[data-theme="dark"] .comment-form {
  border-bottom-color: var(--color-border);
}

[data-theme="dark"] .char-count {
  color: var(--color-text-muted);
}

[data-theme="dark"] .login-prompt {
  background: var(--color-surface-sunken);
}
</style>
