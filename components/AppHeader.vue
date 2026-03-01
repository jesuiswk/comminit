<template>
  <header class="header glass animate-slide-up">
    <div class="container header-content">
      <!-- Brand Logo -->
      <NuxtLink to="/" class="logo-mark">
        <span class="logo-bracket">[</span>
        <span class="logo-text">
          <span class="logo-comm">comm</span><span class="logo-init">init</span>
        </span>
        <span class="logo-cursor"></span>
        <span class="logo-bracket" style="transform: scaleX(-1); display:inline-block;">]</span>
      </NuxtLink>
      
      <!-- Navigation -->
      <nav class="nav">
        <button @click="toggleTheme" class="theme-toggle btn btn-ghost font-mono">
          <svg v-if="theme === 'dark'" class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3V4M12 20V21M4 12H3M6.31412 6.31412L5.5 5.5M17.6859 6.31412L18.5 5.5M6.31412 17.69L5.5 18.5M17.6859 17.69L18.5 18.5M21 12H20M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        
        <template v-if="!user">
          <NuxtLink to="/login" class="nav-link font-mono">// login</NuxtLink>
          <NuxtLink to="/register" class="btn btn-primary font-mono">$ register</NuxtLink>
        </template>
        <template v-else>
          <NuxtLink to="/posts/new" class="btn btn-primary font-mono animate-pulse">
            <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            $ new_post
          </NuxtLink>
          <div class="user-menu">
            <button @click="logout" class="btn-logout font-mono">
              <span class="arrow">[→</span>
              <span class="slash">//</span>
              <span>logout</span>
              <span style="opacity: 0.4;">]</span>
            </button>
          </div>
        </template>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const user = useSupabaseUser()
const supabase = useSupabaseClient()

const theme = ref<'dark' | 'light'>('dark')

onMounted(() => {
  const savedTheme = localStorage.getItem('comminit-theme') as 'dark' | 'light' | null
  if (savedTheme) {
    theme.value = savedTheme
    document.documentElement.setAttribute('data-theme', savedTheme)
  } else {
    // Default to dark theme
    document.documentElement.setAttribute('data-theme', 'dark')
  }
})

const toggleTheme = () => {
  const newTheme = theme.value === 'dark' ? 'light' : 'dark'
  theme.value = newTheme
  document.documentElement.setAttribute('data-theme', newTheme)
  localStorage.setItem('comminit-theme', newTheme)
}

const logout = async () => {
  await supabase.auth.signOut()
  navigateTo('/')
}
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  margin-bottom: var(--space-xl);
  transition: all var(--transition-base);
  border-bottom: 1px solid var(--color-border);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-base) var(--space-lg);
  min-height: 72px;
}

/* Logo Styles */
.logo-mark {
  display: flex;
  align-items: center;
  gap: 0;
  font-family: var(--font-mono);
  font-weight: 800;
  color: var(--color-text);
  text-decoration: none;
  user-select: none;
  font-size: var(--text-xl);
  line-height: 1;
  transition: all var(--transition-base);
}

.logo-mark:hover {
  transform: translateY(-1px);
}

.logo-bracket {
  font-weight: 300;
  color: var(--logo-bracket);
  font-size: var(--text-2xl);
}

.logo-text {
  font-family: var(--font-mono);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
}

.logo-comm {
  color: var(--logo-comm);
}

.logo-init {
  color: var(--logo-init);
}

.logo-cursor {
  display: inline-block;
  width: 3px;
  height: 28px;
  background: var(--color-accent);
  margin-left: 3px;
  animation: blink 1.1s step-end infinite;
  vertical-align: middle;
}

/* Navigation */
.nav {
  display: flex;
  gap: var(--space-lg);
  align-items: center;
}

.nav-link {
  color: var(--color-text-muted);
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 500;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.nav-link:hover {
  color: var(--color-accent);
  background: rgba(61, 255, 224, 0.1);
}

/* Icons */
.icon {
  transition: transform var(--transition-fast);
}

.nav-link:hover .icon {
  transform: translateX(2px);
}

.btn-primary:hover .icon {
  transform: translateX(2px) !important;
}

/* Button */
.btn-primary {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-lg);
  font-weight: 600;
}

/* Theme Toggle */
.theme-toggle {
  padding: var(--space-xs) var(--space-sm);
  min-width: 40px;
}

.theme-toggle .icon {
  transition: transform var(--transition-fast);
}

.theme-toggle:hover .icon {
  transform: rotate(12deg);
}

/* Responsive Design */

/* Tablet and smaller (up to 1024px) */
@media (max-width: 1024px) {
  .header-content {
    padding: var(--space-base) var(--space-md);
  }
  
  .nav {
    gap: var(--space-base);
  }
  
  .logo-mark {
    font-size: var(--text-lg);
  }
  
  .logo-bracket {
    font-size: var(--text-xl);
  }
  
  .logo-cursor {
    height: 22px;
  }
  
  .theme-toggle {
    padding: var(--space-xs);
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .nav-link {
    padding: var(--space-xs) var(--space-base);
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .btn-primary {
    padding: var(--space-sm) var(--space-base);
    min-height: 44px;
  }
  
  .btn-logout {
    padding: var(--space-xs) var(--space-base);
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

/* Mobile (up to 768px) */
@media (max-width: 768px) {
  .header-content {
    padding: var(--space-base);
    flex-direction: column;
    gap: var(--space-base);
  }
  
  .nav {
    gap: var(--space-base);
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
  }
  
  .logo-mark {
    font-size: var(--text-lg);
    justify-content: center;
    width: 100%;
    text-align: center;
  }
  
  .logo-cursor {
    height: 20px;
  }
  
  /* Stack navigation items for better mobile layout */
  .nav {
    flex-direction: column;
    align-items: stretch;
  }
  
  .nav > * {
    width: 100%;
    justify-content: center;
  }
  
  .btn-primary {
    width: 100%;
    justify-content: center;
  }
  
  .nav-link {
    width: 100%;
    justify-content: center;
    text-align: center;
  }
  
  .theme-toggle {
    width: 100%;
    justify-content: center;
  }
  
  .user-menu {
    width: 100%;
  }
  
  .btn-logout {
    width: 100%;
    justify-content: center;
  }
}

/* Small mobile devices (up to 640px) */
@media (max-width: 640px) {
  .header-content {
    padding: var(--space-sm);
    gap: var(--space-sm);
  }
  
  .nav {
    gap: var(--space-sm);
  }
  
  .logo-mark {
    font-size: var(--text-base);
  }
  
  .logo-bracket {
    font-size: var(--text-lg);
  }
  
  .logo-cursor {
    height: 18px;
  }
  
  .nav-link,
  .btn-primary,
  .theme-toggle,
  .btn-logout {
    font-size: var(--text-sm);
    padding: var(--space-xs) var(--space-sm);
  }
}

/* Hide/show utilities for header */
@media (max-width: 768px) {
  .header-mobile-only {
    display: block;
  }
  
  .header-desktop-only {
    display: none;
  }
}

@media (min-width: 769px) {
  .header-mobile-only {
    display: none;
  }
  
  .header-desktop-only {
    display: block;
  }
}
</style>
