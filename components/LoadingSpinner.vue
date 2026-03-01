<template>
  <div class="loading-container">
    <div class="spinner">
      <div class="spinner-inner"></div>
    </div>
    <p v-if="message" class="loading-message font-mono">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<Props>(), {
  size: 'md'
})
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  min-height: 200px;
}

.spinner {
  position: relative;
  width: 48px;
  height: 48px;
}

.spinner.size-sm {
  width: 24px;
  height: 24px;
}

.spinner.size-md {
  width: 48px;
  height: 48px;
}

.spinner.size-lg {
  width: 64px;
  height: 64px;
}

.spinner-inner {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top: 3px solid var(--color-accent);
  border-right: 3px solid var(--color-accent2);
  border-radius: 50%;
  animation: spin 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
}

.spinner.size-sm .spinner-inner {
  border-width: 2px;
}

.spinner.size-lg .spinner-inner {
  border-width: 4px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-message {
  margin-top: var(--space-base);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  text-align: center;
  letter-spacing: 0.02em;
}

/* Button loading state */
.btn-loading {
  position: relative;
  color: transparent !important;
}

.btn-loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-right: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  color: inherit;
}

/* Dark theme adjustments */
[data-theme="dark"] .spinner-inner {
  border-top-color: var(--color-accent);
  border-right-color: var(--color-accent2);
}

[data-theme="light"] .spinner-inner {
  border-top-color: var(--color-accent);
  border-right-color: var(--color-accent2);
}

[data-theme="dark"] .loading-message {
  color: var(--color-text-light);
}

[data-theme="light"] .loading-message {
  color: var(--color-text-muted);
}
</style>
