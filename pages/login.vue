<template>
  <div class="card">
    <h1>Login</h1>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label class="form-label">Email</label>
        <input v-model="email" type="email" class="form-input" required />
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input v-model="password" type="password" class="form-input" required />
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
definePageMeta({
  middleware: 'auth',
  auth: { guestOnly: true }
})

const supabase = useSupabaseClient()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
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