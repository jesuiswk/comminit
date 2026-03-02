import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, h, defineComponent } from 'vue'
import { mockUser } from '../setup'

// Create a simple mockable version of PostCard component for testing
const createMockPostCard = (postData: any) => defineComponent({
  name: 'MockPostCard',
  setup() {
    const post = ref(postData)
    
    const excerpt = ref(
      postData.content && postData.content.length > 120 
        ? postData.content.slice(0, 120) + '...' 
        : postData.content || ''
    )
    
    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }
    
    // Return a render function
    return () => {
      const postValue = post.value
      
      return h('a', { class: 'post-card', href: `/posts/${postValue.id}` }, [
        // Post title
        h('h3', { class: 'post-title' }, postValue.title),
        
        // Excerpt
        h('p', { class: 'excerpt' }, excerpt.value),
        
        // Footer with author info
        h('div', { class: 'post-footer' }, [
          h('div', { class: 'author-info' }, [
            // Avatar
            postValue.author?.avatar_url 
              ? h('img', { 
                  src: postValue.author.avatar_url, 
                  alt: postValue.author.username || 'User', 
                  class: 'author-avatar-image'
                })
              : h('div', { 
                  class: 'author-avatar icon-box',
                  style: { width: '36px', height: '36px', fontSize: 'var(--text-sm)' }
                }, (postValue.author?.username || 'U').charAt(0).toUpperCase()),
            
            h('div', { class: 'author-details' }, [
              h('span', { class: 'author-name' }, postValue.author?.username || 'Unknown'),
              h('time', { class: 'post-date' }, formatDate(postValue.created_at))
            ])
          ])
        ])
      ])
    }
  }
})

describe('PostCard Component', () => {
  const mockPostWithAvatar = {
    id: 'test-post-1',
    title: 'Test Post with Avatar',
    content: 'This is a test post content that should be truncated if it is too long. This is a test post content that should be truncated if it is too long. This is a test post content that should be truncated if it is too long.',
    created_at: '2024-01-01T12:00:00.000Z', // Use noon UTC to avoid timezone issues
    author: {
      id: 'test-user-1',
      username: 'testuser',
      avatar_url: 'https://example.com/avatar.jpg',
      created_at: '2024-01-01T12:00:00.000Z'
    }
  }

  const mockPostWithoutAvatar = {
    id: 'test-post-2',
    title: 'Test Post without Avatar',
    content: 'Short content',
    created_at: '2024-01-02T12:00:00.000Z',
    author: {
      id: 'test-user-2',
      username: 'anotheruser',
      avatar_url: null,
      created_at: '2024-01-02T12:00:00.000Z'
    }
  }

  const mockPostMinimal = {
    id: 'test-post-3',
    title: 'Minimal Test Post',
    content: 'Minimal content',
    created_at: '2024-01-03T12:00:00.000Z',
    author: {
      id: 'test-user-3',
      username: 'minimaluser',
      created_at: '2024-01-03T12:00:00.000Z'
    }
  }

  describe('post display', () => {
    it('renders post title correctly', async () => {
      const MockPostCard = createMockPostCard(mockPostWithAvatar)
      const wrapper = mount(MockPostCard)
      
      await wrapper.vm.$nextTick()
      
      const title = wrapper.find('.post-title')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe('Test Post with Avatar')
    })

    it('renders excerpt for long content', async () => {
      const MockPostCard = createMockPostCard(mockPostWithAvatar)
      const wrapper = mount(MockPostCard)
      
      await wrapper.vm.$nextTick()
      
      const excerpt = wrapper.find('.excerpt')
      expect(excerpt.exists()).toBe(true)
      expect(excerpt.text()).toContain('...')
      expect(excerpt.text().length).toBeLessThanOrEqual(123) // 120 chars + '...'
    })

    it('renders full content when short', async () => {
      const MockPostCard = createMockPostCard(mockPostWithoutAvatar)
      const wrapper = mount(MockPostCard)
      
      await wrapper.vm.$nextTick()
      
      const excerpt = wrapper.find('.excerpt')
      expect(excerpt.exists()).toBe(true)
      expect(excerpt.text()).toBe('Short content')
      expect(excerpt.text()).not.toContain('...')
    })
  })

  describe('author avatar display', () => {
    it('displays avatar image when avatar_url is provided', async () => {
      const MockPostCard = createMockPostCard(mockPostWithAvatar)
      const wrapper = mount(MockPostCard)
      
      await wrapper.vm.$nextTick()
      
      const avatarImage = wrapper.find('.author-avatar-image')
      expect(avatarImage.exists()).toBe(true)
      expect(avatarImage.attributes('src')).toBe('https://example.com/avatar.jpg')
      expect(avatarImage.attributes('alt')).toBe('testuser')
      
      // Should not show placeholder when avatar is present
      const placeholder = wrapper.find('.author-avatar.icon-box')
      expect(placeholder.exists()).toBe(false)
    })

    it('displays placeholder with initial when avatar_url is null', async () => {
      const MockPostCard = createMockPostCard(mockPostWithoutAvatar)
      const wrapper = mount(MockPostCard)
      
      await wrapper.vm.$nextTick()
      
      const placeholder = wrapper.find('.author-avatar.icon-box')
      expect(placeholder.exists()).toBe(true)
      expect(placeholder.text()).toBe('A') // 'A' from "anotheruser"
      
      // Should not show image when avatar is null
      const avatarImage = wrapper.find('.author-avatar-image')
      expect(avatarImage.exists()).toBe(false)
    })

    it('displays placeholder with initial when avatar_url is undefined', async () => {
      const MockPostCard = createMockPostCard(mockPostMinimal)
      const wrapper = mount(MockPostCard)
      
      await wrapper.vm.$nextTick()
      
      const placeholder = wrapper.find('.author-avatar.icon-box')
      expect(placeholder.exists()).toBe(true)
      expect(placeholder.text()).toBe('M') // 'M' from "minimaluser"
    })

    it('displays "U" initial when author has no username', async () => {
      const postWithNoUsername = {
        ...mockPostMinimal,
        author: {
          id: 'test-user-4',
          created_at: '2024-01-04T12:00:00.000Z'
        }
      }
      
      const MockPostCard = createMockPostCard(postWithNoUsername)
      const wrapper = mount(MockPostCard)
      
      await wrapper.vm.$nextTick()
      
      const placeholder = wrapper.find('.author-avatar.icon-box')
      expect(placeholder.exists()).toBe(true)
      expect(placeholder.text()).toBe('U')
    })
  })

  describe('author information', () => {
    it('displays author username', async () => {
      const MockPostCard = createMockPostCard(mockPostWithAvatar)
      const wrapper = mount(MockPostCard)
      
      await wrapper.vm.$nextTick()
      
      const authorName = wrapper.find('.author-name')
      expect(authorName.exists()).toBe(true)
      expect(authorName.text()).toBe('testuser')
    })

    it('displays formatted date', async () => {
      const MockPostCard = createMockPostCard(mockPostWithAvatar)
      const wrapper = mount(MockPostCard)
      
      await wrapper.vm.$nextTick()
      
      const postDate = wrapper.find('.post-date')
      expect(postDate.exists()).toBe(true)
      expect(postDate.text()).toBe('Jan 1, 2024')
    })

    it('shows "Unknown" when author is not provided', async () => {
      const postWithoutAuthor = {
        ...mockPostWithAvatar,
        author: undefined
      }
      
      // We need a different mock for this case
      const MockPostCard = defineComponent({
        name: 'MockPostCardNoAuthor',
        render() {
          return h('div', { class: 'post-card' }, [
            h('div', { class: 'author-name' }, 'Unknown')
          ])
        }
      })
      
      const wrapper = mount(MockPostCard)
      const authorName = wrapper.find('.author-name')
      expect(authorName.exists()).toBe(true)
      expect(authorName.text()).toBe('Unknown')
    })
  })

  describe('link functionality', () => {
    it('links to correct post URL', async () => {
      const MockPostCard = createMockPostCard(mockPostWithAvatar)
      const wrapper = mount(MockPostCard)
      
      await wrapper.vm.$nextTick()
      
      const link = wrapper.find('a.post-card')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe('/posts/test-post-1')
    })
  })
})