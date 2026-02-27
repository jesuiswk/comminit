import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Create mock functions BEFORE any imports that might use them
const mockSupabaseUser = vi.fn(() => ({ value: null }))
const mockSupabaseClient = vi.fn(() => ({
  auth: {
    signOut: vi.fn().mockResolvedValue({ error: null })
  }
}))

// Mock Nuxt auto-imports - this needs to happen BEFORE any component imports
vi.mock('#imports', () => ({
  useSupabaseUser: mockSupabaseUser,
  useSupabaseClient: mockSupabaseClient,
  navigateTo: vi.fn(),
  definePageMeta: vi.fn()
}))

// Also mock the @nuxtjs/supabase module directly since components might import from there
vi.mock('@nuxtjs/supabase', async () => {
  const actual = await vi.importActual<typeof import('@nuxtjs/supabase')>('@nuxtjs/supabase')
  return {
    ...actual,
    useSupabaseUser: mockSupabaseUser,
    useSupabaseClient: mockSupabaseClient,
  }
})

// Mock NuxtLink component globally
config.global.stubs = {
  NuxtLink: {
    template: '<a><slot /></a>',
    props: ['to']
  }
}

// Global test utilities
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    username: 'testuser'
  }
}

const mockPost = {
  id: 'test-post-id',
  title: 'Test Post',
  content: 'Test content for the post',
  created_at: '2024-01-01T00:00:00.000Z',
  author: {
    username: 'testuser'
  }
}

// Helper to mock logged-in user
function mockLoggedInUser() {
  mockSupabaseUser.mockReturnValue({ value: mockUser as any })
}

// Helper to mock logged-out user  
function mockLoggedOutUser() {
  mockSupabaseUser.mockReturnValue({ value: null })
}

export { 
  mockUser, 
  mockPost, 
  mockLoggedInUser, 
  mockLoggedOutUser,
  mockSupabaseUser,
  mockSupabaseClient
}