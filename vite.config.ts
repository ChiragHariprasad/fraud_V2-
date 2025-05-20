import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0',      // ← binds to all interfaces (LAN + localhost)
    port: 5173,           // ← or any port you like
    strictPort: true,     // ← fail if 3000 is taken, don't fall back
  },
  build: {
    outDir: 'dist',
  },
});
