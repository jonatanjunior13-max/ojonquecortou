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
        <a href="/blog">Blog</a>
        ${links}
      </nav>`;
      
      return html.replace(/<nav style="position: absolute;.*?<\/nav>/s, injection);
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), seoLinksPlugin()],
})
