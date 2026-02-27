<template>
  <div>
    <LoadingSpinner v-if="postPending" message="Loading post..." />
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

        <LoadingSpinner v-if="commentsPending" message="Loading comments..." />
        <div v-else-if="comments?.length" class="comments-list">
          <div 
            v-for="comment in comments" 
            :key="comment.id" 
            class="comment"
          >
            <div class="comment-header">
              <div class="comment-meta">
                <strong>{{ comment.author?.username }}</strong>
                <time>{{ formatDate(comment.created_at) }}</time>
              </div>
              <div v-if="canEditComment(comment.user_id)" class="comment-actions">
                <button 
                  v-if="editingCommentId !== comment.id"
                  @click="startEditComment(comment)"
                  class="btn-text"
                >
                  Edit
                </button>
                <button 
                  v-if="editingCommentId !== comment.id"
                  @click="deleteComment(comment.id)"
                  class="btn-text btn-danger"
                >
                  Delete
                </button>
                <template v-else>
                  <button 
                    @click="saveCommentEdit(comment.id)"
                    class="btn-text"
                    :disabled="savingComment"
                  >
                    Save
                  </button>
                  <button @click="cancelEditComment" class="btn-text">
                    Cancel
                  </button>
                </template>
              </div>
            </div>
            
            <div v-if="editingCommentId !== comment.id" class="comment-content">
              {{ comment.content }}
            </div>
            <textarea
              v-else
              v-model="editedCommentContent"
              class="form-textarea"
              rows="2"
            />
          </div>
        </div>
        <p v-else class="text-center">No comments yet.</p>
      </div>
    </div>
    <div v-else class="text-center not-found">
      <h2>Post not found</h2>
      <p>The post you're looking for doesn't exist or has been removed.</p>
      <NuxtLink to="/" class="btn btn-primary">Back to Home</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PostWithAuthor, CommentWithAuthor } from '~/types'

const route = useRoute()
const supabase = useSupabaseClient()
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

// Comment editing state
const editingCommentId = ref<string | null>(null)
const editedCommentContent = ref('')
const savingComment = ref(false)

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
    .select('*, author:profiles(username)')
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
    .select('*, author:profiles(username)')
    .eq('post_id', postId.value)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data || []
})

// Permissions
const canEditPost = (userId: string): boolean => {
  return user.value?.id === userId
}

const canEditComment = (userId: string): boolean => {
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
      .update({ content: editedContent.value.trim() })
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
  if (!post.value || !confirm('Are you sure you want to delete this post?')) return
  
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', post.value.id)
      .eq('user_id', user.value?.id)
    
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

// Comment editing
const startEditComment = (comment: CommentWithAuthor) => {
  editingCommentId.value = comment.id
  editedCommentContent.value = comment.content
}

const cancelEditComment = () => {
  editingCommentId.value = null
  editedCommentContent.value = ''
}

const saveCommentEdit = async (commentId: string) => {
  if (!user.value) return
  
  savingComment.value = true
  
  try {
    const { error } = await supabase
      .from('comments')
      .update({ content: editedCommentContent.value.trim() })
      .eq('id', commentId)
      .eq('user_id', user.value.id)
    
    if (error) {
      alert('Failed to update comment: ' + error.message)
    } else {
      editingCommentId.value = null
      editedCommentContent.value = ''
      await refreshComments()
    }
  } catch (e) {
    alert('An error occurred while updating the comment')
    console.error('Edit comment error:', e)
  } finally {
    savingComment.value = false
  }
}

const deleteComment = async (commentId: string) => {
  if (!confirm('Are you sure you want to delete this comment?')) return
  
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.value?.id)
    
    if (error) {
      alert('Failed to delete comment: ' + error.message)
    } else {
      await refreshComments()
    }
  } catch (e) {
    alert('An error occurred while deleting the comment')
    console.error('Delete comment error:', e)
  }
}

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
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
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

.comment {
  padding: 16px 0;
  border-bottom: 1px solid #eee;
}

.comment:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment-meta {
  display: flex;
  gap: 10px;
  color: #666;
  font-size: 14px;
  align-items: center;
}

.comment-content {
  color: #333;
  line-height: 1.6;
}

.btn-text {
  background: none;
  border: none;
  color: #007bff;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
}

.btn-text:hover {
  text-decoration: underline;
}

.btn-text.btn-danger {
  color: #dc3545;
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
</style>
