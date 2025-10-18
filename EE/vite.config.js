export default defineConfig({
  // Keep the project rooted in the EE/ folder
  root: 'EE/',
  publicDir: 'public',
  appType: 'mpa',

  server: {
    proxy: {
      '/api/ticketmaster': {
        target: 'https://app.ticketmaster.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ticketmaster/, ''),
        secure: true,
        // Helpful dev logs
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('Proxying request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('Proxy response:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err, req) => {
            console.log('Proxy error:', err, 'for', req.url);
          });
        },
      },
    },
  },

  build: {
    // Output at the repo root: /dist
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'EE/index.html'),
        cart: resolve(__dirname, 'EE/cart/index.html'),
        checkout: resolve(__dirname, 'EE/checkout/index.html'),
        product_pages: resolve(__dirname, 'EE/product_pages/index.html'),
        product_listing: resolve(__dirname, 'EE/product_listing/index.html'),
        search_results: resolve(__dirname, 'EE/search_results/index.html'),
        register_page: resolve(__dirname, 'EE/register_page/index.html'),
        my_events: resolve(__dirname, 'EE/my_events/index.html'),
        success: resolve(__dirname, 'EE/checkout/success.html'),
      },
    },
  },
});