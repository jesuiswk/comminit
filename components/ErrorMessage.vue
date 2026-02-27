<template>
  <div class="error-container">
    <div class="error-icon">⚠️</div>
    <p class="error-text">{{ message }}</p>
    <button v-if="showRetry" @click="$emit('retry')" class="btn btn-secondary btn-sm">
      Try Again
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  message: string
  showRetry?: boolean
}

defineProps<Props>()

defineEmits<{
  retry: []
}>()
</script>

<style scoped>
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  background: #fff5f5;
  border-radius: 8px;
  border: 1px solid #feb2b2;
}

.error-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.error-text {
  color: #c53030;
  margin-bottom: 16px;
  font-size: 14px;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 13px;
}
</style>
