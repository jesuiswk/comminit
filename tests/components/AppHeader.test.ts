import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AppHeader from '../../components/AppHeader.vue'
import { mockLoggedOutUser, mockLoggedInUser, mockUser } from '../setup'

describe('AppHeader Component', () => {
  beforeEach(() => {
    // Reset to logged out user state before each test
    mockLoggedOutUser()
  })

  it('renders logo correctly', () => {
    const wrapper = mount(AppHeader, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a><slot /></a>',
            props: ['to']
          }
        }
      }
    })
    
    const logo = wrapper.find('.logo')
    expect(logo.exists()).toBe(true)
    expect(logo.text()).toBe('Comminit')
  })

  describe('when user is not logged in', () => {
    it('shows login and register links', () => {
      const wrapper = mount(AppHeader, {
        global: {
          stubs: {
            NuxtLink: {
              template: '<a><slot /></a>',
              props: ['to']
            }
          }
        }
      })
      
      const links = wrapper.findAll('.nav-link')
      expect(links).toHaveLength(2)
      
      const loginLink = wrapper.find('.nav-link:nth-child(1)')
      const registerLink = wrapper.find('.nav-link:nth-child(2)')
      
      expect(loginLink.exists()).toBe(true)
      expect(loginLink.text()).toBe('Login')
      
      expect(registerLink.exists()).toBe(true)
      expect(registerLink.text()).toBe('Register')
    })

    it('does not show new post button', () => {
      const wrapper = mount(AppHeader, {
        global: {
          stubs: {
            NuxtLink: {
              template: '<a><slot /></a>',
              props: ['to']
            }
          }
        }
      })
      
      const newPostButton = wrapper.find('.btn-primary')
      expect(newPostButton.exists()).toBe(false)
    })

    it('does not show logout button', () => {
      const wrapper = mount(AppHeader, {
        global: {
          stubs: {
            NuxtLink: {
              template: '<a><slot /></a>',
              props: ['to']
            }
          }
        }
      })
      
      const logoutButtons = wrapper.findAll('.nav-link').filter(link => link.text() === 'Logout')
      expect(logoutButtons).toHaveLength(0)
    })
  })

  describe('when user is logged in', () => {
    beforeEach(() => {
      mockLoggedInUser()
    })

    it('shows new post button', () => {
      const wrapper = mount(AppHeader, {
        global: {
          stubs: {
            NuxtLink: {
              template: '<a><slot /></a>',
              props: ['to']
            }
          }
        }
      })
      
      const newPostButton = wrapper.find('.btn-primary')
      expect(newPostButton.exists()).toBe(true)
      expect(newPostButton.text()).toBe('New Post')
    })

    it('shows logout button', () => {
      const wrapper = mount(AppHeader, {
        global: {
          stubs: {
            NuxtLink: {
              template: '<a><slot /></a>',
              props: ['to']
            }
          }
        }
      })
      
      const logoutButton = wrapper.find('.nav-link:last-child')
      expect(logoutButton.exists()).toBe(true)
      expect(logoutButton.text()).toBe('Logout')
    })

    it('does not show login or register links', () => {
      const wrapper = mount(AppHeader, {
        global: {
          stubs: {
            NuxtLink: {
              template: '<a><slot /></a>',
              props: ['to']
            }
          }
        }
      })
      
      const loginLinks = wrapper.findAll('.nav-link').filter(link => link.text() === 'Login')
      const registerLinks = wrapper.findAll('.nav-link').filter(link => link.text() === 'Register')
      
      expect(loginLinks).toHaveLength(0)
      expect(registerLinks).toHaveLength(0)
    })
  })
})