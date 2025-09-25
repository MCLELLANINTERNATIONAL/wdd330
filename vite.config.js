import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/',
  publicDir: 'public',
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        cart: resolve(__dirname, 'src/cart/index.html'),
        checkout: resolve(__dirname, 'src/checkout/index.html'),
        product: resolve(__dirname, 'src/product_pages/index.html'),
        product_listing: resolve(__dirname, 'src/product_listing/index.html'),
        search_results: resolve(__dirname, 'src/search_results/index.html'),
        register_page: resolve(__dirname, 'src/register_page/index.html'),
      },
    },
  },
});
