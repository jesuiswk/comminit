<template>
  <div class="empty-state" :class="[size, variant]">
    <div v-if="icon" class="empty-state-icon">
      <slot name="icon">
        <div class="icon-placeholder">
          {{ icon }}
        </div>
      </slot>
    </div>
    
    <div class="empty-state-content">
      <h3 v-if="title" class="empty-state-title">{{ title }}</h3>
      <p v-if="description" class="empty-state-description">{{ description }}</p>
      
      <div v-if="$slots.default" class="empty-state-children">
        <slot />
      </div>
      
      <div v-if="actionText" class="empty-state-actions">
        <button 
          v-if="actionText" 
          @click="$emit('action')" 
          class="btn btn-primary"
          :class="{ 'btn-sm': size === 'sm' }"
        >
          {{ actionText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  description?: string
  icon?: string
  actionText?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'subtle' | 'bordered'
}

defineProps<Props>()

defineEmits<{
  action: []
}>()
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
}

.empty-state.sm {
  padding: var(--space-xl);
  min-height: 120px;
}

.empty-state.md {
  padding: var(--space-2xl);
  min-height: 200px;
}

.empty-state.lg {
  padding: var(--space-3xl);
  min-height: 300px;
}

.empty-state.subtle {
  color: var(--color-text-muted);
}

.empty-state.bordered {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-elevated);
}

.empty-state-icon {
  margin-bottom: var(--space-lg);
  color: var(--color-text-muted);
}

.empty-state.sm .empty-state-icon {
  margin-bottom: var(--space-base);
}

.empty-state.lg .empty-state-icon {
  margin-bottom: var(--space-xl);
}

.icon-placeholder {
  font-size: 3rem;
  line-height: 1;
  opacity: 0.4;
}

.empty-state.sm .icon-placeholder {
  font-size: 2rem;
}

.empty-state.lg .icon-placeholder {
  font-size: 4rem;
}

.empty-state-content {
  max-width: 400px;
}

.empty-state-title {
  font-size: var(--text-lg);
  font-weight: 600;
  margin-bottom: var(--space-base);
  color: var(--color-text);
}

.empty-state.sm .empty-state-title {
  font-size: var(--text-base);
}

.empty-state.lg .empty-state-title {
  font-size: var(--text-xl);
}

.empty-state.subtle .empty-state-title {
  color: var(--color-text-muted);
}

.empty-state-description {
  font-size: var(--text-base);
  line-height: 1.6;
  color: var(--color-text-muted);
  margin-bottom: var(--space-lg);
}

.empty-state.sm .empty-state-description {
  font-size: var(--text-sm);
  margin-bottom: var(--space-base);
}

.empty-state.lg .empty-state-description {
  font-size: var(--text-lg);
  margin-bottom: var(--space-xl);
}

.empty-state-children {
  margin-bottom: var(--space-lg);
}

.empty-state-actions {
  display: flex;
  gap: var(--space-base);
  justify-content: center;
}

/* Specific empty state types */
.empty-state.no-results .icon-placeholder {
  content: "🔍";
}

.empty-state.no-posts .icon-placeholder {
  content: "📝";
}

.empty-state.no-comments .icon-placeholder {
  content: "💬";
}

.empty-state.no-notifications .icon-placeholder {
  content: "🔔";
}

.empty-state.error .icon-placeholder {
  content: "⚠️";
  color: var(--color-error);
}

.empty-state.success .icon-placeholder {
  content: "✅";
  color: var(--color-success);
}

/* Dark theme adjustments */
[data-theme="dark"] .empty-state.subtle {
  color: var(--color-text-light);
}

[data-theme="dark"] .empty-state.bordered {
  background: var(--color-surface-sunken);
  border-color: var(--color-border-subtle);
}

[data-theme="dark"] .empty-state-icon {
  color: var(--color-text-light);
}

[data-theme="dark"] .empty-state.subtle .empty-state-title {
  color: var(--color-text-light);
}
</style>