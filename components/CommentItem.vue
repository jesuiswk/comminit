<template>
  <div class="comment-item" :class="{ 'comment-reply': isReply }">
    <div class="comment-header">
      <div class="comment-author">
        <div class="author-avatar">
          <img 
            v-if="comment.author?.avatar_url" 
            :src="comment.author.avatar_url" 
            :alt="comment.author.username"
          />
          <div v-else class="avatar-placeholder">
            {{ comment.author?.username?.charAt(0).toUpperCase() || '?' }}
          </div>
        </div>
        <div class="author-info">
          <strong>{{ comment.author?.username || 'Anonymous' }}</strong>
          <time>{{ formatDate(comment.created_at) }}</time>
        </div>
      </div>
      
      <div v-if="canEditComment(comment.user_id)" class="comment-actions">
        <button 
          v-if="!isEditing" 
          @click="startEdit" 
          class="btn-text"
        >
          Edit
        </button>
        <button 
          v-if="!isEditing" 
          @click="deleteComment" 
          class="btn-text btn-danger"
        >
          Delete
        </button>
        <template v-else>
          <button 
            @click="saveEdit" 
            class="btn-text"
            :disabled="saving"
          >
            Save
          </button>
          <button @click="cancelEdit" class="btn-text">
            Cancel
          </button>
        </template>
      </div>
    </div>
    
    <div v-if="!isEditing" class="comment-content">
      {{ comment.content }}
    </div>
    <div v-else class="comment-edit">
      <textarea 
        v-model="editedContent" 
        class="form-textarea"
        rows="3"
        placeholder="Edit your comment..."
      />
      <div v-if="editError" class="error">{{ editError }}</div>
    </div>
    
    <div class="comment-footer">
      <!-- Like button for comments -->
      <LikeButton
        :is-liked="isLiked"
        :like-count="likeCount"
        size="sm"
        variant="heart"
        :disabled="!user"
        @like="handleLike"
        @unlike="handleUnlike"
      />
      
      <button 
        v-if="user && !isReplying" 
        @click="startReply" 
        class="btn-text"
      >
        Reply
      </button>
      <button 
        v-if="user && isReplying" 
        @click="cancelReply" 
        class="btn-text"
      >
        Cancel
      </button>
    </div>
    
    <!-- Reply form -->
    <div v-if="isReplying" class="reply-form">
      <textarea 
        v-model="replyContent" 
        class="form-textarea"
        rows="3"
        placeholder="Write your reply..."
      />
      <div class="reply-actions">
        <span class="char-count">{{ replyContent.length }}/1000</span>
        <button 
          @click="submitReply" 
          class="btn btn-primary btn-sm"
          :disabled="!replyContent.trim() || submittingReply"
        >
          {{ submittingReply ? 'Posting...' : 'Post Reply' }}
        </button>
      </div>
      <div v-if="replyError" class="error">{{ replyError }}</div>
    </div>
    
    <!-- Nested replies -->
    <div v-if="replies?.length" class="replies">
      <CommentItem 
        v-for="reply in replies" 
        :key="reply.id" 
        :comment="reply"
        :replies="getRepliesForComment(reply.id)"
        :is-reply="true"
        @reply="handleReply"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CommentWithAuthor } from '~/types'
import type { Database } from '~/types/supabase'

interface Props {
  comment: CommentWithAuthor
  replies?: CommentWithAuthor[]
  isReply?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  reply: [commentId: string, content: string]
  edit: [commentId: string, content: string]
  delete: [commentId: string]
}>()

const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()
const { toggleCommentLike, getCommentLikeStatus } = useLikes()

// Local state
const isEditing = ref(false)
const editedContent = ref('')
const saving = ref(false)
const editError = ref('')

const isReplying = ref(false)
const replyContent = ref('')
const submittingReply = ref(false)
const replyError = ref('')

// Like state
const isLiked = ref(false)
const likeCount = ref(0)
const likeLoading = ref(false)

// Fetch initial like status
onMounted(async () => {
  if (props.comment.id) {
    const response = await getCommentLikeStatus(props.comment.id)
    if (response.data) {
      isLiked.value = response.data.liked
      likeCount.value = response.data.count
    }
  }
})

// Like handlers
const handleLike = async () => {
  if (likeLoading.value || !user.value) return
  
  likeLoading.value = true
  const response = await toggleCommentLike(props.comment.id)
  
  if (response.data) {
    isLiked.value = response.data.liked
    likeCount.value = response.data.count
  }
  
  likeLoading.value = false
}

const handleUnlike = async () => {
  if (likeLoading.value || !user.value) return
  
  likeLoading.value = true
  const response = await toggleCommentLike(props.comment.id)
  
  if (response.data) {
    isLiked.value = response.data.liked
    likeCount.value = response.data.count
  }
  
  likeLoading.value = false
}

// Permissions
const canEditComment = (userId: string): boolean => {
  return user.value?.id === userId
}

// Format date
const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Edit operations
const startEdit = () => {
  editedContent.value = props.comment.content
  isEditing.value = true
  editError.value = ''
}

const cancelEdit = () => {
  isEditing.value = false
  editedContent.value = ''
  editError.value = ''
}

const saveEdit = async () => {
  if (!user.value) return
  
  saving.value = true
  editError.value = ''
  
  try {
    const { error } = await supabase
      .from('comments')
      .update({ content: editedContent.value.trim() })
      .eq('id', props.comment.id)
      .eq('user_id', user.value.id)
    
    if (error) {
      editError.value = error.message
    } else {
      isEditing.value = false
      emit('edit', props.comment.id, editedContent.value.trim())
    }
  } catch (e) {
    editError.value = 'Failed to save changes'
    console.error('Edit error:', e)
  } finally {
    saving.value = false
  }
}

const deleteComment = async () => {
  if (!user.value || !confirm('Are you sure you want to delete this comment?')) return
  
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', props.comment.id)
      .eq('user_id', user.value.id)
    
    if (error) {
      alert('Failed to delete comment: ' + error.message)
    } else {
      emit('delete', props.comment.id)
    }
  } catch (e) {
    alert('An error occurred while deleting the comment')
    console.error('Delete error:', e)
  }
}

// Reply operations
const startReply = () => {
  isReplying.value = true
  replyContent.value = ''
  replyError.value = ''
}

const cancelReply = () => {
  isReplying.value = false
  replyContent.value = ''
  replyError.value = ''
}

const submitReply = async () => {
  if (!replyContent.value.trim() || !user.value) return
  
  submittingReply.value = true
  replyError.value = ''
  
  try {
    const { error } = await supabase
      .from('comments')
      .insert({
        post_id: props.comment.post_id,
        content: replyContent.value.trim(),
        user_id: user.value.id,
        parent_comment_id: props.comment.id
      })
    
    if (error) {
      replyError.value = error.message
    } else {
      isReplying.value = false
      replyContent.value = ''
      emit('reply', props.comment.id, replyContent.value.trim())
    }
  } catch (e) {
    replyError.value = 'Failed to post reply'
    console.error('Reply error:', e)
  } finally {
    submittingReply.value = false
  }
}

// Helper to get replies for a specific comment
const getRepliesForComment = (commentId: string): CommentWithAuthor[] => {
  return props.replies?.filter(reply => reply.parent_comment_id === commentId) || []
}

// Event handlers
const handleReply = (commentId: string, content: string) => {
  emit('reply', commentId, content)
}

const handleEdit = (commentId: string, content: string) => {
  emit('edit', commentId, content)
}

const handleDelete = (commentId: string) => {
  emit('delete', commentId)
}
</script>

<style scoped>
.comment-item {
  padding: 16px 0;
  border-bottom: 1px solid #eee;
}

.comment-reply {
  margin-left: 32px;
  padding-left: 16px;
  border-left: 2px solid #e0e0e0;
  border-bottom: none;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.author-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: bold;
  font-size: 14px;
}

.author-info {
  display: flex;
  flex-direction: column;
}

.author-info strong {
  font-size: 14px;
  color: #333;
}

.author-info time {
  font-size: 12px;
  color: #999;
}

.comment-actions {
  display: flex;
  gap: 8px;
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

.comment-content {
  color: #333;
  line-height: 1.6;
  margin-bottom: 12px;
  white-space: pre-wrap;
}

.comment-edit {
  margin-bottom: 12px;
}

.comment-edit textarea {
  margin-bottom: 8px;
}

.comment-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.reply-form {
  margin-top: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
}

.reply-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.char-count {
  font-size: 12px;
  color: #999;
}

.replies {
  margin-top: 16px;
}

.error {
  color: #dc3545;
  font-size: 12px;
  margin-top: 8px;
}

/* Dark theme support */
[data-theme="dark"] .comment-item {
  border-bottom-color: var(--color-border);
}

[data-theme="dark"] .comment-reply {
  border-left-color: var(--color-border);
}

[data-theme="dark"] .author-info strong {
  color: var(--color-text);
}

[data-theme="dark"] .author-info time {
  color: var(--color-text-muted);
}

[data-theme="dark"] .comment-content {
  color: var(--color-text);
}

[data-theme="dark"] .reply-form {
  background: var(--color-surface-sunken);
}

[data-theme="dark"] .char-count {
  color: var(--color-text-muted);
}
</style>
