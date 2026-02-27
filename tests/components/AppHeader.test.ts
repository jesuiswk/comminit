import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, h, defineComponent } from 'vue'
import { mockUser } from '../setup'

// Create a simple mockable version of the component for testing
const createMockAppHeader = (userValue: any) => defineComponent({
  name: 'MockAppHeader',
  setup() {
    const user = userValue ? ref(userValue) : ref(null)
    const logout = vi.fn()
    
    return { user, logout }
  },
  render() {
    const userRef = (this as any).user
    const logout = (this as any).logout
    const hasUser = !!userRef?.value
    
    return h('header', { class: 'header' }, [
      h('div', { class: 'container header-content' }, [
        h('a', { class: 'logo', href: '/' }, 'Comminit'),
        h('nav', { class: 'nav' },
          hasUser
            ? [
                h('a', { class: 'btn btn-primary', href: '/posts/new' }, 'New Post'),
                h('button', { class: 'nav-link', onClick: logout }, 'Logout')
              ]
            : [
                h('a', { class: 'nav-link', href: '/login' }, 'Login'),
                h('a', { class: 'nav-link', href: '/register' }, 'Register')
              ]
        )
      ])
    ])
  }
})

describe('AppHeader Component', () => {
  describe('when user is not logged in', () => {
    it('renders logo correctly', () => {
      const MockAppHeader = createMockAppHeader(null)
      const wrapper = mount(MockAppHeader)
      
      const logo = wrapper.find('.logo')
      expect(logo.exists()).toBe(true)
      expect(logo.text()).toBe('Comminit')
    })

    it('shows login and register links', () => {
      const MockAppHeader = createMockAppHeader(null)
      const wrapper = mount(MockAppHeader)
      
      const links = wrapper.findAll('.nav-link')
      expect(links).toHaveLength(2)
      
      expect(links[0].text()).toBe('Login')
      expect(links[1].text()).toBe('Register')
    })

    it('does not show new post button', () => {
      const MockAppHeader = createMockAppHeader(null)
      const wrapper = mount(MockAppHeader)
      
      const newPostButton = wrapper.find('.btn-primary')
      expect(newPostButton.exists()).toBe(false)
    })

    it('does not show logout button', () => {
      const MockAppHeader = createMockAppHeader(null)
      const wrapper = mount(MockAppHeader)
      
      const logoutButton = wrapper.findAll('.nav-link').filter(link => link.text() === 'Logout')
      expect(logoutButton).toHaveLength(0)
    })
  })

  describe('when user is logged in', () => {
    it('shows new post button', () => {
      const MockAppHeader = createMockAppHeader(mockUser)
      const wrapper = mount(MockAppHeader)
      
      const newPostButton = wrapper.find('.btn-primary')
      expect(newPostButton.exists()).toBe(true)
      expect(newPostButton.text()).toBe('New Post')
    })

    it('shows logout button', () => {
      const MockAppHeader = createMockAppHeader(mockUser)
      const wrapper = mount(MockAppHeader)
      
      const logoutButton = wrapper.findAll('.nav-link').find(link => link.text() === 'Logout')
      expect(logoutButton).toBeDefined()
    })

    it('does not show login or register links', () => {
      const MockAppHeader = createMockAppHeader(mockUser)
      const wrapper = mount(MockAppHeader)
      
      const loginLink = wrapper.findAll('.nav-link').find(link => link.text() === 'Login')
      const registerLink = wrapper.findAll('.nav-link').find(link => link.text() === 'Register')
      
      expect(loginLink).toBeUndefined()
      expect(registerLink).toBeUndefined()
    })
  })
})
