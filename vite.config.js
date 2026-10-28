import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Where the development server forwards /api (the miata-api server).
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5000';

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: { '/api': apiProxyTarget },
    },
    preview: {
      port: 4173,
      proxy: { '/api': apiProxyTarget },
    },
    build: {
      outDir: 'dist',
      // public/assets holds the website theme files; bundles go to their own folder.
      assetsDir: 'static',
      sourcemap: false,
      chunkSizeWarningLimit: 700,
    },
    test: { environment: 'node', include: ['src/**/*.test.js'] },
  };
});
