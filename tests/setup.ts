import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Create mock functions BEFORE any imports that might use them
const mockSupabaseUser = vi.fn(() => ({ value: null as any }))
const mockSupabaseClient = vi.fn(() => ({
  auth: {
    signOut: vi.fn().mockResolvedValue({ error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    updateUser: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null })
  }))
}))
const mockNavigateTo = vi.fn()
const mockUseRoute = vi.fn(() => ({
  params: {},
  query: {}
}))

// Mock Nuxt auto-imports - this needs to happen BEFORE any component imports
vi.mock('#imports', () => ({
  useSupabaseUser: mockSupabaseUser,
  useSupabaseClient: mockSupabaseClient,
  navigateTo: mockNavigateTo,
  definePageMeta: vi.fn(),
  useRoute: mockUseRoute,
  useAsyncData: vi.fn(),
  useHead: vi.fn()
}))

// Mock Vue reactivity auto-imports
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    ref: actual.ref,
    computed: actual.computed,
    watch: actual.watch,
    onMounted: actual.onMounted
  }
})

// Also mock the @nuxtjs/supabase module directly since components might import from there
vi.mock('@nuxtjs/supabase', async () => {
  return {
    useSupabaseUser: mockSupabaseUser,
    useSupabaseClient: mockSupabaseClient
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
  },
  created_at: '2024-01-01T00:00:00.000Z'
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
  mockSupabaseUser.mockReturnValue({ value: mockUser })
}

// Helper to mock logged-out user  
function mockLoggedOutUser() {
  mockSupabaseUser.mockReturnValue({ value: null })
}

// Helper to reset all mocks
function resetMocks() {
  mockSupabaseUser.mockClear()
  mockSupabaseClient.mockClear()
  mockNavigateTo.mockClear()
  mockUseRoute.mockClear()
}

export { 
  mockUser, 
  mockPost, 
  mockLoggedInUser, 
  mockLoggedOutUser,
  mockSupabaseUser,
  mockSupabaseClient,
  mockNavigateTo,
  resetMocks
}
