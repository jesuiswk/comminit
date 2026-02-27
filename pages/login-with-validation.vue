<template>
  <div class="card">
    <h1>Login</h1>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label class="form-label">Email</label>
        <input v-model="email" type="email" class="form-input" required />
        <div v-if="validationErrors.email" class="validation-error">
          {{ validationErrors.email }}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input v-model="password" type="password" class="form-input" required />
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

<script setup>
import { validateLogin } from '~/composables/useValidation'

definePageMeta({
  middleware: 'auth',
  auth: { guestOnly: true }
})

const supabase = useSupabaseClient()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const validationErrors = ref({
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
  const validation = validateLogin({
    email: email.value,
    password: password.value
  })
  
  if (!validation.success) {
    // Show validation errors
    error.value = validation.error
    loading.value = false
    return
  }
  
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value
  })
  
  if (authError) {
    error.value = authError.message
  } else {
    navigateTo('/')
  }
  
  loading.value = false
}
</script>

<style scoped>
.validation-error {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 4px;
}
</style>