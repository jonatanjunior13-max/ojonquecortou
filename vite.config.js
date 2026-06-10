import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { posts } from './src/data/posts.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const srcImages = [
  "C:\\Users\\jonat\\.gemini\\antigravity\\brain\\bab3f6e7-df37-4501-91cc-4a7445936312\\media__1779742637978.jpg",
  "C:\\Users\\jonat\\.gemini\\antigravity\\brain\\596317c0-68b8-4610-9993-d41ae372cebb\\media__1779204349484.jpg",
  "C:\\Users\\jonat\\.gemini\\antigravity\\brain\\596317c0-68b8-4610-9993-d41ae372cebb\\media__1779204307347.jpg",
  "C:\\Users\\jonat\\.gemini\\antigravity\\brain\\596317c0-68b8-4610-9993-d41ae372cebb\\media__1779204040308.jpg"
]

const destImage = path.join(__dirname, 'public', 'jon-perfil.jpg')

for (const src of srcImages) {
  if (fs.existsSync(src)) {
    try {
      fs.copyFileSync(src, destImage);
      console.log("SUCCESSFULLY COPIED PROFILE IMAGE FROM", src, "TO", destImage);
      break;
    } catch (err) {
      console.error("ERROR COPYING PROFILE IMAGE:", err);
    }
  }
}


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
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
  },
  plugins: [
    react(), 
    seoLinksPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,webp}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        skipWaiting: true,
        clientsClaim: true,
        // Impede que o Service Worker intercepte chamadas do Firebase/Firestore
        // Isso resolve o problema de sincronização no PWA
        runtimeCaching: [
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
        ],
      },
      manifest: {
        name: 'O Jon Que Cortou - Admin',
        short_name: 'Jon Admin',
        description: 'Painel de Agendamento do Salão',
        theme_color: '#fdfbf7',
        background_color: '#fdfbf7',
        display: 'standalone',
        icons: [
          {
            src: '/jon-perfil.jpg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: '/jon-perfil.jpg',
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      }
    })
  ],
})
