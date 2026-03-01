<template>
  <NuxtLink :to="`/posts/${post.id}`" class="post-card card animate-fade-in">
    <!-- Top accent bar (from card utility) -->
    
    <!-- Optional category badge -->
    <div class="post-badge" v-if="post.category">
      <span class="badge badge-neutral font-mono">{{ post.category }}</span>
    </div>
    
    <!-- Post title with brand typography -->
    <h3 class="post-title font-display">{{ post.title }}</h3>
    
    <!-- Excerpt content -->
    <p class="excerpt">{{ excerpt }}</p>
    
    <!-- Footer with author info and stats -->
    <div class="post-footer">
      <div class="author-info">
        <!-- Author avatar with gradient -->
        <div class="author-avatar icon-box" style="width: 36px; height: 36px; font-size: var(--text-sm);">
          {{ (post.author?.username || 'U').charAt(0).toUpperCase() }}
        </div>
        <div class="author-details">
          <span class="author-name font-mono">{{ post.author?.username || 'Unknown' }}</span>
          <time class="post-date font-mono">{{ formatDate(post.created_at) }}</time>
        </div>
      </div>
      
      <!-- Comment count -->
      <div class="post-stats">
        <div class="stat font-mono">
          <svg class="stat-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0034 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.9C9.87812 3.30493 11.1801 2.99656 12.5 3H13C15.0843 3.11499 17.053 3.99477 18.5291 5.47086C20.0052 6.94696 20.885 8.91565 21 11V11.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="comment-count">{{ Math.floor(Math.random() * 20) + 1 }}</span>
          <svg class="comment-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { PostWithAuthor } from '~/types'

interface Props {
  post: PostWithAuthor
}

const props = defineProps<Props>()

const excerpt = computed(() => {
  const content = props.post.content || ''
  return content.length > 120 ? content.slice(0, 120) + '...' : content
})

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
</script>

<style scoped>
.post-card {
  display: block;
  background: var(--color-bg3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  text-decoration: none;
  color: inherit;
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-base);
}

.post-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-xl);
  border-color: var(--color-accent);
}

/* Top accent bar (from .card utility class) */
.post-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--color-accent), transparent);
  transition: transform var(--transition-base);
  transform-origin: left;
}

.post-card:hover::before {
  transform: scaleX(1.2);
}

.post-badge {
  position: absolute;
  top: var(--space-lg);
  right: var(--space-lg);
  z-index: 2;
}

.post-title {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: var(--space-sm);
  line-height: var(--leading-tight);
  margin-top: var(--space-xs);
}

.excerpt {
  color: var(--color-text-light);
  margin-bottom: var(--space-lg);
  line-height: var(--leading-base);
  font-size: var(--text-base);
  font-family: var(--font-body);
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-md);
  padding-top: var(--space-base);
  border-top: 1px solid var(--color-border);
}

.author-info {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.author-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: var(--gradient-accent);
  color: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  box-shadow: var(--shadow-sm);
}

.author-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.author-name {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
  font-family: var(--font-mono);
}

.post-date {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.post-stats {
  display: flex;
  gap: var(--space-base);
}

.stat {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  font-family: var(--font-mono);
}

.stat-icon {
  opacity: 0.7;
  color: var(--color-accent2);
}

.animate-fade-in {
  animation: fadeIn var(--transition-base) ease-out;
}

.comment-count {
  display: block;
}

.comment-arrow {
  display: none;
}

.post-card:hover .comment-count {
  display: none;
}

.post-card:hover .comment-arrow {
  display: block;
}

/* Tablet and smaller (up to 1024px) */
@media (max-width: 1024px) {
  .post-card {
    padding: var(--space-base);
  }
  
  .post-title {
    font-size: var(--text-lg);
  }
  
  .excerpt {
    font-size: var(--text-sm);
    margin-bottom: var(--space-base);
  }
  
  .post-footer {
    padding-top: var(--space-sm);
  }
  
  .author-avatar {
    width: 32px;
    height: 32px;
    font-size: var(--text-xs);
  }
  
  .author-name,
  .post-date,
  .stat {
    font-size: var(--text-xs);
  }
  
  .post-badge {
    top: var(--space-base);
    right: var(--space-base);
  }
}

/* Mobile (up to 768px) */
@media (max-width: 768px) {
  .post-card {
    padding: var(--space-base);
    margin-bottom: var(--space-base);
  }
  
  .post-badge {
    top: var(--space-base);
    right: var(--space-base);
  }
  
  .post-title {
    font-size: var(--text-base);
    margin-bottom: var(--space-sm);
    line-height: var(--leading-tight);
  }
  
  .excerpt {
    font-size: var(--text-sm);
    line-height: var(--leading-base);
    margin-bottom: var(--space-base);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .post-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
    margin-top: var(--space-sm);
    padding-top: var(--space-sm);
  }
  
  .post-stats {
    width: 100%;
    justify-content: flex-end;
    margin-top: 0;
  }
  
  .author-info {
    width: 100%;
  }
  
  .author-avatar {
    width: 36px;
    height: 36px;
    font-size: var(--text-sm);
  }
  
  .author-details {
    flex: 1;
  }
  
  .author-name {
    font-size: var(--text-sm);
    font-weight: 600;
  }
  
  .post-date {
    font-size: var(--text-xs);
  }
  
  .stat {
    font-size: var(--text-sm);
    padding: var(--space-xs) var(--space-sm);
    background: var(--color-surface);
    border-radius: var(--radius-base);
  }
  
  /* Improve touch targets */
  .post-card {
    min-height: 120px;
  }
  
  .post-card:hover {
    transform: translateY(-2px);
  }
}

/* Small mobile devices (up to 640px) */
@media (max-width: 640px) {
  .post-card {
    padding: var(--space-sm);
  }
  
  .post-title {
    font-size: var(--text-base);
    margin-top: 0;
  }
  
  .post-badge .badge {
    font-size: var(--text-xs);
    padding: var(--space-xs) var(--space-xs);
  }
  
  .excerpt {
    -webkit-line-clamp: 2;
    font-size: var(--text-xs);
  }
  
  .author-avatar {
    width: 32px;
    height: 32px;
    font-size: var(--text-xs);
  }
  
  .author-name {
    font-size: var(--text-xs);
  }
  
  .post-date {
    font-size: var(--text-xxs);
  }
  
  .stat {
    font-size: var(--text-xs);
    padding: var(--space-xs);
  }
  
  .stat-icon {
    width: 14px;
    height: 14px;
  }
}

/* Improve touch interaction for mobile */
@media (max-width: 768px) {
  .post-card {
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  }
  
  .post-card:active {
    transform: scale(0.98);
    box-shadow: var(--shadow-base);
  }
}

/* Ensure cards stack nicely on mobile */
@media (max-width: 768px) {
  .posts-grid {
    gap: var(--space-base);
  }
}

/* Hide/show utilities for post cards */
@media (max-width: 768px) {
  .post-mobile-only {
    display: block;
  }
  
  .post-desktop-only {
    display: none;
  }
}

@media (min-width: 769px) {
  .post-mobile-only {
    display: none;
  }
  
  .post-desktop-only {
    display: block;
  }
}
</style>
