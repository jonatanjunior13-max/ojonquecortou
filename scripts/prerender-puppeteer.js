import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '../dist');

// Define your static routes
const routes = [
  '/',
  '/servicos',
  '/sobre',
  '/blog',
  '/depoimentos',
  '/galeria'
];

// Extract blog post slugs to pre-render them as well
const postsContent = fs.readFileSync(path.join(__dirname, '../src/data/posts.js'), 'utf-8');
const slugRegex = /slug:\s*[`'"]([^`'"\n]+)[`'"]/g;
let match;
while ((match = slugRegex.exec(postsContent)) !== null) {
  routes.push(`/blog/${match[1]}`);
}

async function startServer() {
  const shellHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
  const app = express();
  app.use(express.static(distDir));
  app.use((req, res) => {
    res.send(shellHtml);
  });

  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      resolve({
        port: server.address().port,
        close: () => server.close()
      });
    });
  });
}

async function prerender() {
  console.log('Starting pre-rendering process...');
  const server = await startServer();
  const port = server.port;
  console.log(`Local server started on port ${port}`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // To avoid fetching external analytics/pixel scripts during pre-rendering
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('google-analytics') || url.includes('googletagmanager') || url.includes('facebook.net') || url.includes('ahrefs')) {
      req.abort();
    } else {
      req.continue();
    }
  });

  for (const route of routes) {
    const url = `http://localhost:${port}${route}`;
    console.log(`Pre-rendering: ${route}`);
    
    try {
      // Wait until there are no network connections for at least 500 ms.
      // This ensures React has mounted and populated the DOM.
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // Grab the fully rendered HTML
      const html = await page.evaluate(() => {
        return '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
      });

      // Remove the <script type="module" src="/src/main.jsx"></script> if it was somehow injected or keep it.
      // Vite build replaces it with the compiled assets anyway.
      
      // Calculate the correct output file path
      const routeDir = path.join(distDir, route === '/' ? '' : route);
      fs.mkdirSync(routeDir, { recursive: true });
      fs.writeFileSync(path.join(routeDir, 'index.html'), html);
      
      console.log(`✓ Generated ${route}/index.html`);
    } catch (e) {
      console.error(`✗ Error rendering ${route}:`, e);
    }
  }

  await browser.close();
  server.close();
  console.log('Pre-rendering complete!');
}

prerender().catch(console.error);
