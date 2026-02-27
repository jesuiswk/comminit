<template>
  <div class="card">
    <h1>Register</h1>
    <form @submit.prevent="handleRegister">
      <div class="form-group">
        <label class="form-label">Username</label>
        <input 
          v-model="username" 
          type="text" 
          class="form-input"
          :class="{ 'input-error': validationErrors.username }"
          required 
        />
        <div v-if="validationErrors.username" class="validation-error">
          {{ validationErrors.username }}
        </div>
      </div>
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
        <small class="form-hint">
          Must be at least 8 characters with uppercase, number, and special character
        </small>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
      <button type="submit" class="btn btn-primary" :disabled="loading">
        {{ loading ? 'Creating account...' : 'Register' }}
      </button>
    </form>
    <p class="mt-4 text-center">
      Already have an account? <NuxtLink to="/login">Login</NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { validateRegister } from '~/composables/useValidation'
import type { ValidationResult, RegisterForm } from '~/types'

definePageMeta({
  middleware: 'auth',
  auth: { guestOnly: true }
})

const supabase = useSupabaseClient()
const username = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const validationErrors = ref<Record<string, string>>({
  username: '',
  email: '',
  password: ''
})

const clearValidationErrors = () => {
  validationErrors.value = { username: '', email: '', password: '' }
}

const handleRegister = async () => {
  loading.value = true
  error.value = ''
  clearValidationErrors()
  
  // Validate input using Zod schema
  const validation: ValidationResult<RegisterForm> = validateRegister({
    username: username.value,
    email: email.value,
    password: password.value
  })
  
  if (!validation.success) {
    error.value = validation.error || 'Validation failed'
    loading.value = false
    return
  }
  
  try {
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        data: {
          username: username.value
        }
      }
    })
    
    if (authError) {
      error.value = authError.message
    } else if (data.user) {
      navigateTo('/')
    } else {
      error.value = 'Registration incomplete. Please check your email for confirmation.'
    }
  } catch (e) {
    error.value = 'An unexpected error occurred. Please try again.'
    console.error('Registration error:', e)
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

.form-hint {
  display: block;
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 4px;
}

.input-error {
  border-color: #dc3545 !important;
}

.input-error:focus {
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.25);
}
</style>
