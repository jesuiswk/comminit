import { z } from 'zod'

// User schemas
export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  email: z.string().email('Valid email is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
})

export const postSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters'),
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(5000, 'Content cannot exceed 5000 characters')
})

// Type inference
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type PostInput = z.infer<typeof postSchema>

// Validation utility functions
export function validateLogin(data: unknown): { success: boolean; data?: LoginInput; error?: string } {
  try {
    const validated = loginSchema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: 'Validation failed' }
  }
}

export function validateRegister(data: unknown): { success: boolean; data?: RegisterInput; error?: string } {
  try {
    const validated = registerSchema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: 'Validation failed' }
  }
}

export function validatePost(data: unknown): { success: boolean; data?: PostInput; error?: string } {
  try {
    const validated = postSchema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: 'Validation failed' }
  }
}

// Composables for Vue
export function useValidation() {
  return {
    loginSchema,
    registerSchema,
    postSchema,
    validateLogin,
    validateRegister,
    validatePost
  }
}