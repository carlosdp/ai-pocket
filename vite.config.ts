/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.URL ?? undefined,
  define: {
    // global: process.env.VITEST ? 'global' : 'globalThis',
    'import.meta.env.URL': JSON.stringify(process.env.URL),
  },
  plugins: [react()],
});
