export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/supabase',
    '@pinia/nuxt',
    '@nuxtjs/seo',
  ],
  supabase: {
    redirect: false,
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
    }
  },
  site: {
    url: process.env.SITE_URL || 'https://comminit.example.com',
    name: 'comminit',
    description: 'A modern, open‑source platform for meaningful discussions',
    defaultLocale: 'en',
  },
  app: {
    head: {
      title: 'comminit · initialize communication',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        { 
          rel: 'stylesheet', 
          href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600;800&family=Syne:wght@400;600;700;800&display=swap' 
        },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'manifest', href: '/site.webmanifest' }
      ],
      htmlAttrs: {
        lang: 'en',
        class: 'noise-overlay'
      }
    }
  },
  sitemap: {
    enabled: true,
  },
  robots: {
    enabled: true,
  },
  ogImage: {
    enabled: true,
  },
  schema: {
    enabled: true,
  },
})
