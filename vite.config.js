import { defineConfig } from 'vite';

export default defineConfig({
  // 상대 경로로 빌드해야 Capacitor(Android)에서 그대로 열린다
  base: './',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000,
  },
  server: {
    host: true,
  },
});
