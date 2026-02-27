import { defineStore } from 'pinia'
import type { User, LoginForm, RegisterForm, ApiResponse } from '~/types'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

/**
 * Auth Store - Manages authentication state and operations
 */
export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.user,
    currentUser: (state): User | null => state.user,
    username: (state): string => state.user?.user_metadata?.username || ''
  },

  actions: {
    /**
     * Initialize auth state from Supabase session
     */
    async initializeAuth() {
      const supabase = useSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        this.user = {
          id: session.user.id,
          email: session.user.email || '',
          user_metadata: {
            username: session.user.user_metadata?.username || ''
          },
          created_at: session.user.created_at
        }
      }
    },

    /**
     * Sign in with email and password
     */
    async signIn(credentials: LoginForm): Promise<ApiResponse<User>> {
      this.loading = true
      this.error = null

      const supabase = useSupabaseClient()

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password
        })

        if (error) {
          this.error = error.message
          return { data: null, error: { message: error.message, code: error.code } }
        }

        if (data.user) {
          this.user = {
            id: data.user.id,
            email: data.user.email || '',
            user_metadata: {
              username: data.user.user_metadata?.username || ''
            },
            created_at: data.user.created_at
          }
        }

        return { data: this.user, error: null }
      } catch (err) {
        const message = 'An unexpected error occurred during sign in'
        this.error = message
        return { data: null, error: { message } }
      } finally {
        this.loading = false
      }
    },

    /**
     * Sign up with email, password, and username
     */
    async signUp(credentials: RegisterForm): Promise<ApiResponse<User>> {
      this.loading = true
      this.error = null

      const supabase = useSupabaseClient()

      try {
        const { data, error } = await supabase.auth.signUp({
          email: credentials.email,
          password: credentials.password,
          options: {
            data: {
              username: credentials.username
            }
          }
        })

        if (error) {
          this.error = error.message
          return { data: null, error: { message: error.message, code: error.code } }
        }

        if (data.user) {
          this.user = {
            id: data.user.id,
            email: data.user.email || '',
            user_metadata: {
              username: data.user.user_metadata?.username || ''
            },
            created_at: data.user.created_at
          }
        }

        return { data: this.user, error: null }
      } catch (err) {
        const message = 'An unexpected error occurred during registration'
        this.error = message
        return { data: null, error: { message } }
      } finally {
        this.loading = false
      }
    },

    /**
     * Sign out the current user
     */
    async signOut(): Promise<ApiResponse<boolean>> {
      this.loading = true
      this.error = null

      const supabase = useSupabaseClient()

      try {
        const { error } = await supabase.auth.signOut()

        if (error) {
          this.error = error.message
          return { data: null, error: { message: error.message, code: error.code } }
        }

        this.user = null
        return { data: true, error: null }
      } catch (err) {
        const message = 'An unexpected error occurred during sign out'
        this.error = message
        return { data: null, error: { message } }
      } finally {
        this.loading = false
      }
    },

    /**
     * Update user profile
     */
    async updateProfile(updates: { username?: string }): Promise<ApiResponse<User>> {
      if (!this.user) {
        return { data: null, error: { message: 'User not authenticated' } }
      }

      this.loading = true
      this.error = null

      const supabase = useSupabaseClient()

      try {
        // Update auth user metadata
        const { data: authData, error: authError } = await supabase.auth.updateUser({
          data: updates
        })

        if (authError) {
          this.error = authError.message
          return { data: null, error: { message: authError.message, code: authError.code } }
        }

        // Update profile in database
        const { error: profileError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', this.user.id)

        if (profileError) {
          this.error = profileError.message
          return { data: null, error: { message: profileError.message, code: profileError.code } }
        }

        // Update local state
        this.user = {
          ...this.user,
          user_metadata: {
            ...this.user.user_metadata,
            ...updates
          }
        }

        return { data: this.user, error: null }
      } catch (err) {
        const message = 'An unexpected error occurred while updating profile'
        this.error = message
        return { data: null, error: { message } }
      } finally {
        this.loading = false
      }
    },

    /**
     * Clear any auth errors
     */
    clearError() {
      this.error = null
    }
  }
})
