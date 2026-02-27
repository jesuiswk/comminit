import type { User, ApiResponse, LoginForm, RegisterForm } from '~/types'

/**
 * Composable for authentication operations
 * Provides a unified interface for auth-related functionality
 */
export function useAuth() {
  const supabase = useSupabaseClient()
  const supabaseUser = useSupabaseUser()

  /**
   * Get the current authenticated user
   * @returns Current user or null
   */
  function getCurrentUser(): User | null {
    if (!supabaseUser.value) return null
    
    return {
      id: supabaseUser.value.id,
      email: supabaseUser.value.email || '',
      user_metadata: {
        username: supabaseUser.value.user_metadata?.username || ''
      },
      created_at: supabaseUser.value.created_at || ''
    }
  }

  /**
   * Check if user is authenticated
   * @returns Boolean indicating auth status
   */
  function isAuthenticated(): boolean {
    return !!supabaseUser.value
  }

  /**
   * Sign in with email and password
   * @param credentials - Login credentials
   * @returns User data or error
   */
  async function signIn(
    credentials: LoginForm
  ): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } }
      }

      if (!data.user) {
        return { data: null, error: { message: 'Login failed' } }
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        user_metadata: {
          username: data.user.user_metadata?.username || ''
        },
        created_at: data.user.created_at
      }

      return { data: user, error: null }
    } catch (err) {
      console.error('Sign in error:', err)
      return { 
        data: null, 
        error: { message: 'An unexpected error occurred during sign in' } 
      }
    }
  }

  /**
   * Sign up with email, password, and username
   * @param credentials - Registration data
   * @returns User data or error
   */
  async function signUp(
    credentials: RegisterForm
  ): Promise<ApiResponse<User>> {
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
        return { data: null, error: { message: error.message, code: error.code } }
      }

      if (!data.user) {
        return { data: null, error: { message: 'Registration failed' } }
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        user_metadata: {
          username: data.user.user_metadata?.username || ''
        },
        created_at: data.user.created_at
      }

      return { data: user, error: null }
    } catch (err) {
      console.error('Sign up error:', err)
      return { 
        data: null, 
        error: { message: 'An unexpected error occurred during registration' } 
      }
    }
  }

  /**
   * Sign out the current user
   * @returns Success status or error
   */
  async function signOut(): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } }
      }

      return { data: true, error: null }
    } catch (err) {
      console.error('Sign out error:', err)
      return { 
        data: null, 
        error: { message: 'An unexpected error occurred during sign out' } 
      }
    }
  }

  /**
   * Update user profile
   * @param updates - Profile updates
   * @returns Updated user data or error
   */
  async function updateProfile(updates: { 
    username?: string 
  }): Promise<ApiResponse<User>> {
    if (!supabaseUser.value) {
      return { data: null, error: { message: 'User not authenticated' } }
    }

    try {
      // Update auth user metadata
      const { data: authData, error: authError } = await supabase.auth.updateUser({
        data: updates
      })

      if (authError) {
        return { data: null, error: { message: authError.message, code: authError.code } }
      }

      // Update profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', supabaseUser.value.id)

      if (profileError) {
        return { data: null, error: { message: profileError.message, code: profileError.code } }
      }

      const user: User = {
        id: authData.user.id,
        email: authData.user.email || '',
        user_metadata: {
          username: authData.user.user_metadata?.username || ''
        },
        created_at: authData.user.created_at
      }

      return { data: user, error: null }
    } catch (err) {
      console.error('Update profile error:', err)
      return { 
        data: null, 
        error: { message: 'An unexpected error occurred while updating profile' } 
      }
    }
  }

  return {
    getCurrentUser,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    updateProfile
  }
}
