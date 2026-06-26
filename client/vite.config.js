import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
// Configured with port 3000 for local development
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  }
});
