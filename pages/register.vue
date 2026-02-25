<template>
  <div class="card">
    <h1>Register</h1>
    <form @submit.prevent="handleRegister">
      <div class="form-group">
        <label class="form-label">Username</label>
        <input v-model="username" type="text" class="form-input" required />
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input v-model="email" type="email" class="form-input" required />
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input v-model="password" type="password" class="form-input" required minlength="6" />
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

<script setup>
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

const handleRegister = async () => {
  loading.value = true
  error.value = ''
  
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
  } else {
    navigateTo('/')
  }
  
  loading.value = false
}
</script>