import type { User, ApiResponse, LoginForm, RegisterForm } from '~/types'

/**
 * Composable for authentication operations
 * Delegates to the Pinia auth store for a single source of truth
 */
export function useAuth() {
  const store = useAuthStore()
  const supabaseUser = useSupabaseUser()

  /**
   * Get the current authenticated user
   * @returns Current user or null
   */
  function getCurrentUser(): User | null {
    return store.currentUser
  }

  /**
   * Check if user is authenticated
   * @returns Boolean indicating auth status
   */
  function isAuthenticated(): boolean {
    return store.isAuthenticated
  }

  /**
   * Sign in with email and password
   * @param credentials - Login credentials
   * @returns User data or error
   */
  async function signIn(
    credentials: LoginForm
  ): Promise<ApiResponse<User>> {
    return store.signIn(credentials)
  }

  /**
   * Sign up with email, password, and username
   * @param credentials - Registration data
   * @returns User data or error
   */
  async function signUp(
    credentials: RegisterForm
  ): Promise<ApiResponse<User>> {
    return store.signUp(credentials)
  }

  /**
   * Sign out the current user
   * @returns Success status or error
   */
  async function signOut(): Promise<ApiResponse<boolean>> {
    return store.signOut()
  }

  /**
   * Update user profile
   * @param updates - Profile updates
   * @returns Updated user data or error
   */
  async function updateProfile(updates: { 
    username?: string 
  }): Promise<ApiResponse<User>> {
    return store.updateProfile(updates)
  }

  /**
   * Initialize auth state from Supabase session
   */
  async function initializeAuth(): Promise<void> {
    await store.initializeAuth()
  }

  /**
   * Clear any auth errors
   */
  function clearError(): void {
    store.clearError()
  }

  return {
    getCurrentUser,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    updateProfile,
    initializeAuth,
    clearError,
    // Expose store properties for reactive access
    user: computed(() => store.user),
    loading: computed(() => store.loading),
    error: computed(() => store.error),
    username: computed(() => store.username)
  }
}
