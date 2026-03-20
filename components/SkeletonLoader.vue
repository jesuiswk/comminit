<template>
  <div class="skeleton-loader" :class="[type, size]">
    <!-- Post skeleton -->
    <div v-if="type === 'post'" class="post-skeleton">
      <div class="skeleton-header">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-header-text">
          <div class="skeleton-title"></div>
          <div class="skeleton-meta"></div>
        </div>
      </div>
      <div class="skeleton-content">
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>
      <div class="skeleton-actions">
        <div class="skeleton-button"></div>
        <div class="skeleton-button"></div>
      </div>
    </div>

    <!-- Comment skeleton -->
    <div v-else-if="type === 'comment'" class="comment-skeleton">
      <div class="skeleton-comment-header">
        <div class="skeleton-avatar small"></div>
        <div class="skeleton-comment-meta">
          <div class="skeleton-username"></div>
          <div class="skeleton-timestamp"></div>
        </div>
      </div>
      <div class="skeleton-comment-content">
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>
    </div>

    <!-- Card skeleton -->
    <div v-else-if="type === 'card'" class="card-skeleton">
      <div class="skeleton-card-header">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-card-title"></div>
      </div>
      <div class="skeleton-card-content">
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>
    </div>

    <!-- List skeleton -->
    <div v-else-if="type === 'list'" class="list-skeleton">
      <div v-for="i in count" :key="i" class="skeleton-list-item">
        <div class="skeleton-list-avatar"></div>
        <div class="skeleton-list-content">
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>
    </div>

    <!-- Default skeleton -->
    <div v-else class="default-skeleton">
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  type?: 'post' | 'comment' | 'card' | 'list' | 'default'
  size?: 'sm' | 'md' | 'lg'
  count?: number
}

withDefaults(defineProps<Props>(), {
  type: 'default',
  size: 'md',
  count: 3
})
</script>

<style scoped>
.skeleton-loader {
  width: 100%;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-loader.sm {
  --skeleton-height: 16px;
  --skeleton-gap: 8px;
  --avatar-size: 24px;
}

.skeleton-loader.md {
  --skeleton-height: 20px;
  --skeleton-gap: 12px;
  --avatar-size: 32px;
}

.skeleton-loader.lg {
  --skeleton-height: 24px;
  --skeleton-gap: 16px;
  --avatar-size: 40px;
}

/* Common skeleton elements */
.skeleton-line {
  height: var(--skeleton-height);
  background: linear-gradient(
    90deg,
    var(--color-neutral-200) 0%,
    var(--color-neutral-100) 50%,
    var(--color-neutral-200) 100%
  );
  background-size: 200% 100%;
  border-radius: 4px;
  margin-bottom: var(--skeleton-gap);
}

.skeleton-line.short {
  width: 60%;
}

.skeleton-avatar {
  width: var(--avatar-size);
  height: var(--avatar-size);
  border-radius: 50%;
  background: linear-gradient(
    90deg,
    var(--color-neutral-200) 0%,
    var(--color-neutral-100) 50%,
    var(--color-neutral-200) 100%
  );
  background-size: 200% 100%;
  flex-shrink: 0;
}

.skeleton-avatar.small {
  --avatar-size: 24px;
}

/* Post skeleton */
.post-skeleton {
  padding: var(--space-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-elevated);
}

.skeleton-header {
  display: flex;
  gap: var(--space-base);
  margin-bottom: var(--space-lg);
  align-items: center;
}

.skeleton-header-text {
  flex: 1;
}

.skeleton-title {
  height: 24px;
  width: 70%;
  background: linear-gradient(
    90deg,
    var(--color-neutral-200) 0%,
    var(--color-neutral-100) 50%,
    var(--color-neutral-200) 100%
  );
  background-size: 200% 100%;
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-meta {
  height: 16px;
  width: 40%;
  background: linear-gradient(
    90deg,
    var(--color-neutral-200) 0%,
    var(--color-neutral-100) 50%,
    var(--color-neutral-200) 100%
  );
  background-size: 200% 100%;
  border-radius: 4px;
}

.skeleton-content {
  margin-bottom: var(--space-lg);
}

.skeleton-actions {
  display: flex;
  gap: var(--space-base);
}

.skeleton-button {
  height: 32px;
  width: 80px;
  background: linear-gradient(
    90deg,
    var(--color-neutral-200) 0%,
    var(--color-neutral-100) 50%,
    var(--color-neutral-200) 100%
  );
  background-size: 200% 100%;
  border-radius: var(--radius-base);
}

/* Comment skeleton */
.comment-skeleton {
  padding: var(--space-base);
  border-bottom: 1px solid var(--color-border);
}

.skeleton-comment-header {
  display: flex;
  gap: var(--space-base);
  margin-bottom: var(--space-base);
  align-items: center;
}

.skeleton-comment-meta {
  flex: 1;
}

.skeleton-username {
  height: 16px;
  width: 30%;
  background: linear-gradient(
    90deg,
    var(--color-neutral-200) 0%,
    var(--color-neutral-100) 50%,
    var(--color-neutral-200) 100%
  );
  background-size: 200% 100%;
  border-radius: 4px;
  margin-bottom: 4px;
}

.skeleton-timestamp {
  height: 12px;
  width: 20%;
  background: linear-gradient(
    90deg,
    var(--color-neutral-200) 0%,
    var(--color-neutral-100) 50%,
    var(--color-neutral-200) 100%
  );
  background-size: 200% 100%;
  border-radius: 4px;
}

/* Card skeleton */
.card-skeleton {
  padding: var(--space-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-elevated);
}

.skeleton-card-header {
  display: flex;
  gap: var(--space-base);
  margin-bottom: var(--space-lg);
  align-items: center;
}

.skeleton-card-title {
  height: 20px;
  width: 50%;
  background: linear-gradient(
    90deg,
    var(--color-neutral-200) 0%,
    var(--color-neutral-100) 50%,
    var(--color-neutral-200) 100%
  );
  background-size: 200% 100%;
  border-radius: 4px;
}

/* List skeleton */
.list-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.skeleton-list-item {
  display: flex;
  gap: var(--space-base);
  align-items: center;
}

.skeleton-list-content {
  flex: 1;
}

/* Default skeleton */
.default-skeleton {
  padding: var(--space-lg);
}

/* Animation */
@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

/* Dark theme adjustments */
[data-theme="dark"] .skeleton-line,
[data-theme="dark"] .skeleton-avatar,
[data-theme="dark"] .skeleton-title,
[data-theme="dark"] .skeleton-meta,
[data-theme="dark"] .skeleton-button,
[data-theme="dark"] .skeleton-username,
[data-theme="dark"] .skeleton-timestamp,
[data-theme="dark"] .skeleton-card-title {
  background: linear-gradient(
    90deg,
    var(--color-neutral-800) 0%,
    var(--color-neutral-700) 50%,
    var(--color-neutral-800) 100%
  );
  background-size: 200% 100%;
}
</style>