import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  publicDir: 'public',
  server: {
    proxy: {
      '/api/ticketmaster': {
        target: 'https://app.ticketmaster.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ticketmaster/, ''),
        secure: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Proxy response:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
        },
      },
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        cart: resolve(__dirname, 'cart/index.html'),
        checkout: resolve(__dirname, 'checkout/index.html'),
        product_pages: resolve(__dirname, 'product_pages/index.html'),
        product_listing: resolve(__dirname, 'product_listing/index.html'),
        search_results: resolve(__dirname, 'search_results/index.html'),
        register_page: resolve(__dirname, 'register_page/index.html'),
        my_events: resolve(__dirname, 'my_events/index.html'),
        success: resolve(__dirname, 'checkout/success.html'),
      },
    },
  },
});
