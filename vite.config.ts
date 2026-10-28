import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { apiMiddleware } from './src/server/apiRouter.ts';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'fidelio-sqlite-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          apiMiddleware(req, res, next);
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          apiMiddleware(req, res, next);
        });
      },
    },
  ],
  server: {
    port: 5173,
    host: true,
  },
});
