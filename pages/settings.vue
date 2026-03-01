<template>
  <div class="settings-page">
    <div class="card">
      <h1>Profile Settings</h1>
      
      <div v-if="!user" class="not-authenticated">
        <p class="font-mono">You must be logged in to access settings.</p>
        <NuxtLink to="/login" class="btn btn-primary mt-4">Login</NuxtLink>
      </div>
      
      <div v-else class="settings-content">
        <!-- Profile Picture Section -->
        <div class="settings-section">
          <h2 class="settings-title font-display">Profile Picture</h2>
          <p class="settings-description font-mono">Upload a profile picture. Recommended size: 200x200px.</p>
          
          <ProfilePictureUpload 
            :current-avatar-url="currentProfile?.avatar_url"
            @avatar-updated="handleAvatarUpdated"
          />
        </div>
        
        <!-- Username Section -->
        <div class="settings-section">
          <h2 class="settings-title font-display">Username</h2>
          <p class="settings-description font-mono">Your username is displayed on your posts and comments.</p>
          
          <div class="username-display font-mono">
            <div class="current-username">
              <strong>Current:</strong> {{ currentProfile?.username || user.user_metadata.username }}
            </div>
            
            <form @submit.prevent="updateUsername" class="mt-4">
              <div class="form-group">
                <label class="form-label">New Username</label>
                <input 
                  v-model="newUsername" 
                  type="text" 
                  class="form-input"
                  :class="{ 'input-error': usernameError }"
                  placeholder="Enter new username"
                  required
                />
                <div v-if="usernameError" class="validation-error">{{ usernameError }}</div>
              </div>
              
              <div class="form-actions">
                <button 
                  type="submit" 
                  class="btn btn-primary" 
                  :disabled="usernameLoading || !newUsername.trim()"
                  :class="{ 'btn-loading': usernameLoading }"
                >
                  <span v-if="!usernameLoading">Update Username</span>
                  <span v-else class="sr-only">Updating...</span>
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <!-- Account Info Section -->
        <div class="settings-section">
          <h2 class="settings-title font-display">Account Information</h2>
          <div class="account-info">
            <div class="info-row">
              <span class="info-label font-mono">Email:</span>
              <span class="info-value font-mono">{{ user.email }}</span>
            </div>
            <div class="info-row">
              <span class="info-label font-mono">User ID:</span>
              <span class="info-value font-mono">{{ user.id }}</span>
            </div>
            <div class="info-row">
              <span class="info-label font-mono">Member since:</span>
              <span class="info-value font-mono">{{ formatDate(user.created_at) }}</span>
            </div>
          </div>
        </div>
        
        <!-- Danger Zone -->
        <div class="settings-section danger-zone">
          <h2 class="settings-title font-display text-danger">Danger Zone</h2>
          <p class="settings-description font-mono">Irreversible actions. Proceed with caution.</p>
          
          <button @click="handleLogout" class="btn btn-danger mt-2">
            Logout
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Profile } from '~/types'

definePageMeta({
  middleware: 'auth'
})

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const authStore = useAuthStore()

const newUsername = ref('')
const usernameLoading = ref(false)
const usernameError = ref('')
const currentProfile = ref<Profile | null>(null)

// Fetch current profile data
onMounted(async () => {
  if (user.value) {
    await fetchProfile()
  }
})

const fetchProfile = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.value!.id)
      .single()
    
    if (error) throw error
    currentProfile.value = data
  } catch (error) {
    console.error('Error fetching profile:', error)
  }
}

const handleAvatarUpdated = (avatarUrl: string) => {
  if (currentProfile.value) {
    currentProfile.value.avatar_url = avatarUrl
  }
}

const updateUsername = async () => {
  if (!user.value || !newUsername.value.trim()) return
  
  usernameLoading.value = true
  usernameError.value = ''
  
  try {
    // Check if username is already taken
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', newUsername.value.trim())
      .neq('id', user.value.id)
      .single()
    
    if (!checkError && existingUser) {
      usernameError.value = 'Username is already taken'
      usernameLoading.value = false
      return
    }
    
    // Update username
    const result = await authStore.updateProfile({
      username: newUsername.value.trim()
    })
    
    if (result.error) {
      usernameError.value = result.error.message
    } else {
      // Update local profile
      if (currentProfile.value) {
        currentProfile.value.username = newUsername.value.trim()
      }
      
      // Clear input
      newUsername.value = ''
      
      // Show success message (you could add a toast notification here)
      alert('Username updated successfully!')
    }
  } catch (error) {
    console.error('Error updating username:', error)
    usernameError.value = 'An unexpected error occurred'
  } finally {
    usernameLoading.value = false
  }
}

const handleLogout = async () => {
  if (confirm('Are you sure you want to logout?')) {
    await authStore.signOut()
    navigateTo('/')
  }
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
.settings-page {
  max-width: 800px;
  margin: 0 auto;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

.settings-section {
  padding: var(--space-lg);
  background: var(--color-bg3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: all var(--transition-base);
}

.settings-section:hover {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-md);
}

.settings-title {
  font-size: var(--text-xl);
  font-weight: 700;
  margin-bottom: var(--space-xs);
  color: var(--color-text);
}

.settings-description {
  color: var(--color-text-muted);
  margin-bottom: var(--space-lg);
  font-size: var(--text-sm);
}

.not-authenticated {
  text-align: center;
  padding: var(--space-2xl);
}

.username-display {
  padding: var(--space-base);
  background: var(--color-bg2);
  border-radius: var(--radius-md);
}

.current-username {
  font-size: var(--text-base);
  color: var(--color-text);
  margin-bottom: var(--space-sm);
}

.account-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.info-row {
  display: flex;
  align-items: center;
  gap: var(--space-base);
  padding: var(--space-sm) var(--space-base);
  background: var(--color-bg2);
  border-radius: var(--radius-md);
}

.info-label {
  font-weight: 600;
  color: var(--color-accent);
  min-width: 120px;
}

.info-value {
  color: var(--color-text);
  font-family: var(--font-mono);
  word-break: break-all;
}

.danger-zone {
  border-color: var(--color-danger);
}

.danger-zone .settings-title {
  color: var(--color-danger);
}

.danger-zone .settings-description {
  color: var(--color-danger);
  opacity: 0.8;
}

.btn-danger {
  background: rgba(255, 91, 139, 0.1);
  color: var(--color-accent3);
  border: 1px solid rgba(255, 91, 139, 0.3);
}

.btn-danger:hover {
  background: rgba(255, 91, 139, 0.2);
  border-color: rgba(255, 91, 139, 0.5);
}

@media (max-width: 768px) {
  .settings-page {
    padding: var(--space-base);
  }
  
  .settings-section {
    padding: var(--space-base);
  }
  
  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-xs);
  }
  
  .info-label {
    min-width: auto;
  }
}
</style>