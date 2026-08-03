import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { posts } from './src/data/posts.js'

function seoLinksPlugin() {
  return {
    name: 'seo-links-plugin',
    transformIndexHtml(html) {
      const links = posts.map(post => `<a href="/blog/${post.slug}">${post.title}</a>`).join('\n        ');
      const injection = `<nav style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;">
        <a href="/">Início</a>
        <a href="/sobre">Sobre o Jon</a>
        <a href="/servicos">Serviços</a>
        <a href="/galeria">Galeria</a>
        <a href="/depoimentos">Depoimentos</a>
        <a href="/blog">Blog</a>
        ${links}
      </nav>`;
      
      return html.replace(/<nav style="position: absolute;.*?<\/nav>/s, injection);
    }
  }
}

import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router-dom')) return 'router-vendor';
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react-vendor';
            if (id.includes('firebase') || id.includes('@firebase')) return 'firebase-vendor';
            if (id.includes('lucide-react')) return 'icons-vendor';
            return 'vendor';
          }
        }
      }
    }
  },
  plugins: [
    react(), 
    seoLinksPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/blog\//, /^\/admin\//],
        skipWaiting: true,
        clientsClaim: true,
        // Impede que o Service Worker intercepte chamadas do Firebase/Firestore
        // Isso resolve o problema de sincronização no PWA
        runtimeCaching: [
          {
            // Imagens cacheiam sob demanda (na primeira vez que aparecem em tela),
            // em vez de baixar tudo de uma vez na instalação do PWA
            urlPattern: /\.(?:png|jpe?g|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 60, // 60 dias
              },
            },
          },
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/firebase\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/identitytoolkit\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/securetoken\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/.*\.firebaseio\.com\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/.*\.firebasestorage\.app\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/storage\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
      manifest: {
        name: 'O Jon Que Cortou',
        short_name: 'Jon Cortou',
        description: 'Studio do Jon - Especialista em Cachos',
        theme_color: '#141414',
        background_color: '#141414',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/logo-app.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
