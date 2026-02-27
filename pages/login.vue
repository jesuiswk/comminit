<template>
  <div class="card">
    <h1>Login</h1>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label class="form-label">Email</label>
        <input 
          v-model="email" 
          type="email" 
          class="form-input" 
          :class="{ 'input-error': validationErrors.email }"
          required 
        />
        <div v-if="validationErrors.email" class="validation-error">
          {{ validationErrors.email }}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input 
          v-model="password" 
          type="password" 
          class="form-input"
          :class="{ 'input-error': validationErrors.password }"
          required 
        />
        <div v-if="validationErrors.password" class="validation-error">
          {{ validationErrors.password }}
        </div>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
      <button type="submit" class="btn btn-primary" :disabled="loading">
        {{ loading ? 'Logging in...' : 'Login' }}
      </button>
    </form>
    <p class="mt-4 text-center">
      Don't have an account? <NuxtLink to="/register">Register</NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { validateLogin } from '~/composables/useValidation'
import type { ValidationResult, LoginForm } from '~/types'

definePageMeta({
  middleware: 'auth',
  auth: { guestOnly: true }
})

const supabase = useSupabaseClient()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const validationErrors = ref<Record<string, string>>({
  email: '',
  password: ''
})

const clearValidationErrors = () => {
  validationErrors.value = { email: '', password: '' }
}

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  clearValidationErrors()
  
  // Validate input using Zod schema
  const validation: ValidationResult<LoginForm> = validateLogin({
    email: email.value,
    password: password.value
  })
  
  if (!validation.success) {
    error.value = validation.error || 'Validation failed'
    loading.value = false
    return
  }
  
  try {
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })
    
    if (authError) {
      error.value = authError.message
    } else {
      navigateTo('/')
    }
  } catch (e) {
    error.value = 'An unexpected error occurred. Please try again.'
    console.error('Login error:', e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.validation-error {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 4px;
}

.input-error {
  border-color: #dc3545 !important;
}

.input-error:focus {
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.25);
}
</style>
