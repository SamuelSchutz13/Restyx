import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

const port = process.env.RESTYX_DEV_PORT ?? '4317';

export default defineConfig({
  root: 'src/web',
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src/web', import.meta.url)) } },
  build: { outDir: '../../dist/web', emptyOutDir: true },
  // In dev, open the token URL printed by `npm run dev:server` once, then use the Vite URL.
  server: { proxy: { '/api': { target: `http://127.0.0.1:${port}`, changeOrigin: true } } },
});
