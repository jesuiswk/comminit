<template>
  <button
    :class="[
      'like-button',
      size,
      variant,
      { 'liked': isLiked, 'loading': loading }
    ]"
    @click="handleLike"
    :disabled="loading || disabled"
    :aria-label="isLiked ? 'Unlike' : 'Like'"
  >
    <div class="like-icon">
      <svg
        v-if="variant === 'heart'"
        :class="{ 'animate-pulse': loading }"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path
          v-if="isLiked"
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          fill="currentColor"
        />
        <path
          v-else
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        />
      </svg>
      
      <svg
        v-else
        :class="{ 'animate-pulse': loading }"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path
          v-if="isLiked"
          d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
          fill="currentColor"
        />
        <path
          v-else
          d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
        />
      </svg>
    </div>
    
    <span v-if="showCount" class="like-count">
      {{ formattedCount }}
    </span>
    
    <span v-if="loading" class="loading-dots">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  isLiked?: boolean
  likeCount?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'heart' | 'thumb'
  showCount?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLiked: false,
  likeCount: 0,
  size: 'md',
  variant: 'heart',
  showCount: true,
  disabled: false
})

const emit = defineEmits<{
  like: []
  unlike: []
}>()

const loading = ref(false)
const optimisticCount = ref(props.likeCount)
const optimisticLiked = ref(props.isLiked)

const isLiked = computed(() => optimisticLiked.value)
const formattedCount = computed(() => {
  const count = optimisticCount.value
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return count.toString()
})

const handleLike = async () => {
  if (loading.value || props.disabled) return
  
  loading.value = true
  
  // Optimistic update
  if (isLiked.value) {
    optimisticCount.value = Math.max(0, optimisticCount.value - 1)
    optimisticLiked.value = false
    emit('unlike')
  } else {
    optimisticCount.value = optimisticCount.value + 1
    optimisticLiked.value = true
    emit('like')
  }
  
  // Simulate API call delay
  setTimeout(() => {
    loading.value = false
  }, 300)
}
</script>

<style scoped>
.like-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-elevated);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  user-select: none;
}

.like-button:hover:not(:disabled) {
  border-color: var(--color-accent);
  background: var(--color-surface-sunken);
  color: var(--color-text);
  transform: translateY(-1px);
}

.like-button:active:not(:disabled) {
  transform: translateY(0);
}

.like-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.like-button.liked {
  border-color: var(--color-accent);
  background: var(--color-accent-light);
  color: var(--color-accent);
}

.like-button.liked:hover:not(:disabled) {
  background: var(--color-accent-light-hover);
}

/* Sizes */
.like-button.sm {
  padding: 0.25rem 0.5rem;
  font-size: var(--text-xs);
  gap: 0.25rem;
}

.like-button.sm .like-icon {
  width: 16px;
  height: 16px;
}

.like-button.md {
  padding: 0.5rem 1rem;
  font-size: var(--text-sm);
  gap: 0.5rem;
}

.like-button.md .like-icon {
  width: 20px;
  height: 20px;
}

.like-button.lg {
  padding: 0.75rem 1.5rem;
  font-size: var(--text-base);
  gap: 0.75rem;
}

.like-button.lg .like-icon {
  width: 24px;
  height: 24px;
}

/* Icon */
.like-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.like-button.liked .like-icon {
  animation: heartBeat 0.3s ease;
}

.like-button:hover:not(:disabled) .like-icon {
  transform: scale(1.1);
}

/* Count */
.like-count {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  transition: color 0.2s ease;
}

.like-button.liked .like-count {
  color: var(--color-accent);
}

/* Loading state */
.like-button.loading {
  pointer-events: none;
}

.loading-dots {
  display: inline-flex;
  gap: 0.25rem;
  margin-left: 0.5rem;
}

.dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  animation: dotPulse 1.4s ease-in-out infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

/* Animations */
@keyframes heartBeat {
  0% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.3);
  }
  50% {
    transform: scale(0.9);
  }
  75% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes dotPulse {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  30% {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-pulse {
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Dark theme adjustments */
[data-theme="dark"] .like-button {
  background: var(--color-surface-sunken);
  border-color: var(--color-border-subtle);
}

[data-theme="dark"] .like-button:hover:not(:disabled) {
  background: var(--color-surface-elevated);
  border-color: var(--color-accent);
}

[data-theme="dark"] .like-button.liked {
  background: var(--color-accent-dark);
  border-color: var(--color-accent);
}

[data-theme="dark"] .like-button.liked:hover:not(:disabled) {
  background: var(--color-accent-dark-hover);
}
</style>