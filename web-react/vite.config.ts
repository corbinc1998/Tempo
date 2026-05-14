import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Vite config.
 *
 * Key bit - the proxy. Locally the React dev server (:5173) needs to reach the
 * BFF (:8081) and we want the same code path that works in prod. The proxy
 * forwards /api/* and /health to the BFF so the React code can just call
 * relative URLs ('/api/dashboard') in dev and prod alike.
 *
 * In prod CloudFront does this routing; vite.config.ts isn't used there.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
});
