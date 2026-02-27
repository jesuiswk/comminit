import { describe, it, expect } from 'vitest'
import { validateLogin, validateRegister, validatePost } from '../../composables/useValidation'

describe('useValidation', () => {
  describe('validateLogin', () => {
    it('validates correct login input', () => {
      const result = validateLogin({
        email: 'test@example.com',
        password: 'password123'
      })
      
      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('rejects invalid email', () => {
      const result = validateLogin({
        email: 'invalid-email',
        password: 'password123'
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Valid email is required')
    })

    it('rejects short password', () => {
      const result = validateLogin({
        email: 'test@example.com',
        password: '12345'
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Password must be at least 6 characters')
    })
  })

  describe('validateRegister', () => {
    it('validates correct register input', () => {
      const result = validateRegister({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!'
      })
      
      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!'
      })
    })

    it('rejects invalid username', () => {
      const result = validateRegister({
        username: 'ab', // too short
        email: 'test@example.com',
        password: 'Password123!'
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Username must be at least 3 characters')
    })

    it('rejects password without uppercase', () => {
      const result = validateRegister({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123!' // no uppercase
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Password must contain at least one uppercase letter')
    })
  })

  describe('validatePost', () => {
    it('validates correct post input', () => {
      const result = validatePost({
        title: 'Test Post Title',
        content: 'This is a test post content with enough characters.'
      })
      
      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        title: 'Test Post Title',
        content: 'This is a test post content with enough characters.'
      })
    })

    it('rejects short title', () => {
      const result = validatePost({
        title: 'ab',
        content: 'This is a test post content with enough characters.'
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Title must be at least 3 characters')
    })

    it('rejects short content', () => {
      const result = validatePost({
        title: 'Test Post Title',
        content: 'Short'
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Content must be at least 10 characters')
    })
  })
})