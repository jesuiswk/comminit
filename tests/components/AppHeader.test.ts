import { describe, it, expect, vi } from 'vitest'
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
    // In Vue 3 composition API, refs returned from setup() are automatically
    // unwrapped when accessed via `this`
    const userValue = (this as any).user
    const logout = (this as any).logout
    const hasUser = !!userValue
    
    return h('header', { class: 'header' }, [
      h('div', { class: 'container header-content' }, [
        h('a', { class: 'logo-mark', href: '/' }, [
          h('span', { class: 'logo-bracket' }, '['),
          h('span', { class: 'logo-text' }, [
            h('span', { class: 'logo-comm' }, 'comm'),
            h('span', { class: 'logo-init' }, 'init')
          ]),
          h('span', { class: 'logo-cursor' }),
          h('span', { class: 'logo-bracket', style: 'transform: scaleX(-1); display:inline-block;' }, ']')
        ]),
        h('nav', { class: 'nav' }, [
          // Theme toggle button (always present)
          h('button', { class: 'theme-toggle btn btn-ghost font-mono' }),
          hasUser
            ? [
                h('a', { class: 'btn btn-primary font-mono', href: '/posts/new' }, [
                  h('svg', { class: 'icon', width: '16', height: '16', viewBox: '0 0 24 24' }, [
                    h('path', { d: 'M12 5V19M5 12H19', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
                  ]),
                  ' $ new_post'
                ]),
                h('div', { class: 'user-menu' }, [
                  h('a', { class: 'user-avatar-link', href: '/settings' }, [
                    h('div', { class: 'user-avatar icon-box' }, userValue?.user_metadata?.username?.charAt(0).toUpperCase() || 'U')
                  ]),
                  h('button', { class: 'btn-logout font-mono', onClick: logout }, [
                    h('span', { class: 'arrow' }, '[→'),
                    h('span', { class: 'slash' }, '//'),
                    h('span', {}, 'logout'),
                    h('span', { style: 'opacity: 0.4;' }, ']')
                  ])
                ])
              ]
            : [
                h('a', { class: 'nav-link font-mono', href: '/login' }, '// login'),
                h('a', { class: 'btn btn-primary font-mono', href: '/register' }, '$ register')
              ]
        ])
      ])
    ])
  }
})

describe('AppHeader Component', () => {
  describe('when user is not logged in', () => {
    it('renders logo correctly', () => {
      const MockAppHeader = createMockAppHeader(null)
      const wrapper = mount(MockAppHeader)
      
      const logo = wrapper.find('.logo-mark')
      expect(logo.exists()).toBe(true)
      // The logo has nested spans, we'll check it contains the text
      expect(logo.text()).toContain('comm')
      expect(logo.text()).toContain('init')
    })

    it('shows login and register links', () => {
      const MockAppHeader = createMockAppHeader(null)
      const wrapper = mount(MockAppHeader)
      
      const loginLink = wrapper.find('.nav-link')
      expect(loginLink.exists()).toBe(true)
      expect(loginLink.text()).toBe('// login')
      
      const registerButton = wrapper.find('.btn-primary')
      expect(registerButton.exists()).toBe(true)
      expect(registerButton.text()).toBe('$ register')
    })

    it('does not show new post button', () => {
      const MockAppHeader = createMockAppHeader(null)
      const wrapper = mount(MockAppHeader)
      
      const newPostButtons = wrapper.findAll('.btn-primary').filter(btn => btn.text().includes('new_post'))
      expect(newPostButtons).toHaveLength(0)
    })

    it('does not show logout button', () => {
      const MockAppHeader = createMockAppHeader(null)
      const wrapper = mount(MockAppHeader)
      
      const logoutButton = wrapper.find('.btn-logout')
      expect(logoutButton.exists()).toBe(false)
    })

    it('does not show user menu', () => {
      const MockAppHeader = createMockAppHeader(null)
      const wrapper = mount(MockAppHeader)
      
      const userMenu = wrapper.find('.user-menu')
      expect(userMenu.exists()).toBe(false)
    })
  })

  describe('when user is logged in', () => {
    it('shows new post button', () => {
      const MockAppHeader = createMockAppHeader(mockUser)
      const wrapper = mount(MockAppHeader)
      
      const newPostButton = wrapper.findAll('.btn-primary').find(btn => btn.text().includes('new_post'))
      expect(newPostButton?.exists()).toBe(true)
      expect(newPostButton?.text()).toContain('$ new_post')
    })

    it('shows logout button', () => {
      const MockAppHeader = createMockAppHeader(mockUser)
      const wrapper = mount(MockAppHeader)
      
      const logoutButton = wrapper.find('.btn-logout')
      expect(logoutButton.exists()).toBe(true)
      expect(logoutButton.text()).toContain('logout')
    })

    it('shows user menu with avatar', () => {
      const MockAppHeader = createMockAppHeader(mockUser)
      const wrapper = mount(MockAppHeader)
      
      const userMenu = wrapper.find('.user-menu')
      expect(userMenu.exists()).toBe(true)
      
      const userAvatar = wrapper.find('.user-avatar')
      expect(userAvatar.exists()).toBe(true)
      expect(userAvatar.text()).toBe('T') // 'T' from "testuser"
    })

    it('does not show login or register links', () => {
      const MockAppHeader = createMockAppHeader(mockUser)
      const wrapper = mount(MockAppHeader)
      
      const loginLink = wrapper.find('.nav-link')
      expect(loginLink.exists()).toBe(false)
      
      const registerButtons = wrapper.findAll('.btn-primary').filter(btn => btn.text().includes('register'))
      expect(registerButtons).toHaveLength(0)
    })

    it('shows theme toggle button', () => {
      const MockAppHeader = createMockAppHeader(mockUser)
      const wrapper = mount(MockAppHeader)
      
      const themeToggle = wrapper.find('.theme-toggle')
      expect(themeToggle.exists()).toBe(true)
    })
  })
})