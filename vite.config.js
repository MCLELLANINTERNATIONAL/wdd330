import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'EE/',
  publicDir: 'public',
  server: {
    proxy: {
      '/api/ticketmaster': {
        target: 'https://app.ticketmaster.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ticketmaster/, ''),
        secure: true,
      },
    },
  },
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'EE/index.html'),
        cart: resolve(__dirname, 'EE/cart/index.html'),
        checkout: resolve(__dirname, 'EE/checkout/index.html'),
        product: resolve(__dirname, 'EE/product_pages/index.html'),
        product_listing: resolve(__dirname, 'EE/product_listing/index.html'),
        search_results: resolve(__dirname, 'EE/search_results/index.html'),
        register_page: resolve(__dirname, 'EE/register_page/index.html'),
        my_events: resolve(__dirname, 'EE/my_events/index.html'),
        success: resolve(__dirname, 'EE/checkout/success.html'),
      },
    },
  },
});
