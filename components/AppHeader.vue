<template>
  <header class="header">
    <div class="container header-content">
      <NuxtLink to="/" class="logo">Comminit</NuxtLink>
      <nav class="nav">
        <NuxtLink v-if="!user" to="/login" class="nav-link">Login</NuxtLink>
        <NuxtLink v-if="!user" to="/register" class="nav-link">Register</NuxtLink>
        <NuxtLink v-if="user" to="/posts/new" class="btn btn-primary">New Post</NuxtLink>
        <button v-if="user" @click="logout" class="nav-link">Logout</button>
      </nav>
    </div>
  </header>
</template>

<script setup>
const user = useSupabaseUser()
const supabase = useSupabaseClient()

const logout = async () => {
  await supabase.auth.signOut()
  navigateTo('/')
}
</script>

<style scoped>
.header {
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  color: #007bff;
  text-decoration: none;
}

.nav {
  display: flex;
  gap: 20px;
  align-items: center;
}

.nav-link {
  color: #666;
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.nav-link:hover {
  color: #007bff;
}
</style>