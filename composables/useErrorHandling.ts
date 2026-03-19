import type { ApiError, ApiResponse } from '~/types'

/**
 * Standardized error handling utility for Supabase operations
 * Provides consistent error handling patterns across all composables
 */
export function useErrorHandling() {
  /**
   * Handle Supabase errors and convert to standardized ApiError format
   * @param error - The raw error from Supabase
   * @param defaultMessage - Default error message if error doesn't have one
   * @returns Standardized ApiError object
   */
  function handleSupabaseError(error: any, defaultMessage = 'An unexpected error occurred'): ApiError {
    // If it's already an ApiError, return it
    if (error && typeof error === 'object' && 'message' in error && 'code' in error) {
      return error as ApiError
    }

    // Handle Supabase PostgREST errors
    if (error?.code && error?.message) {
      return {
        message: error.message || defaultMessage,
        code: error.code,
        details: error.details || null
      }
    }

    // Handle generic errors
    if (error instanceof Error) {
      return {
        message: error.message || defaultMessage,
        code: 'UNKNOWN_ERROR',
        details: null
      }
    }

    // Handle string errors
    if (typeof error === 'string') {
      return {
        message: error,
        code: 'UNKNOWN_ERROR',
        details: null
      }
    }

    // Fallback
    return {
      message: defaultMessage,
      code: 'UNKNOWN_ERROR',
      details: null
    }
  }

  /**
   * Create a standardized success response
   * @param data - The data to return
   * @returns Standardized ApiResponse with data
   */
  function createSuccessResponse<T>(data: T): ApiResponse<T> {
    return {
      data,
      error: null
    }
  }

  /**
   * Create a standardized error response
   * @param error - The error to return
   * @param defaultMessage - Default error message if error doesn't have one
   * @returns Standardized ApiResponse with error
   */
  function createErrorResponse<T>(error: any, defaultMessage?: string): ApiResponse<T> {
    return {
      data: null,
      error: handleSupabaseError(error, defaultMessage)
    }
  }

  /**
   * Wrap an async operation with standardized error handling
   * @param operation - The async operation to execute
   * @param defaultErrorMessage - Default error message if operation fails
   * @returns Standardized ApiResponse
   */
  async function withErrorHandling<T>(
    operation: () => Promise<T>,
    defaultErrorMessage = 'Operation failed'
  ): Promise<ApiResponse<T>> {
    try {
      const data = await operation()
      return createSuccessResponse(data)
    } catch (error) {
      console.error('Operation failed:', error)
      return createErrorResponse<T>(error, defaultErrorMessage)
    }
  }

  /**
   * Check if an error is a specific Supabase error code
   * @param error - The error to check
   * @param code - The error code to match
   * @returns Boolean indicating if error matches the code
   */
  function isErrorCode(error: ApiError | null, code: string): boolean {
    return error?.code === code
  }

  /**
   * Get user-friendly error message based on error code
   * @param error - The error to get message for
   * @returns User-friendly error message
   */
  function getUserFriendlyMessage(error: ApiError | null): string {
    if (!error) return 'An unexpected error occurred'

    const errorMap: Record<string, string> = {
      '23505': 'This record already exists',
      '23503': 'Referenced record does not exist',
      '23502': 'Required field is missing',
      '42501': 'You do not have permission to perform this action',
      'PGRST116': 'Record not found',
      'PGRST204': 'No rows returned',
      'UNKNOWN_ERROR': 'An unexpected error occurred',
      'NETWORK_ERROR': 'Network error. Please check your connection',
      'AUTH_ERROR': 'Authentication error. Please log in again'
    }

    const errorCode = error.code || 'UNKNOWN_ERROR'
    return errorMap[errorCode] || error.message || 'An unexpected error occurred'
  }

  /**
   * Log error with context for debugging
   * @param error - The error to log
   * @param context - Additional context about where the error occurred
   */
  function logError(error: any, context?: string): void {
    const errorContext = context ? `[${context}] ` : ''
    console.error(`${errorContext}Error:`, error)
    
    if (error?.code) {
      console.error(`${errorContext}Error Code:`, error.code)
    }
    
    if (error?.details) {
      console.error(`${errorContext}Error Details:`, error.details)
    }
  }

  return {
    handleSupabaseError,
    createSuccessResponse,
    createErrorResponse,
    withErrorHandling,
    isErrorCode,
    getUserFriendlyMessage,
    logError
  }
}