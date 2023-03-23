/// <reference types="vitest" />
import { crx, defineManifest } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const manifest = defineManifest({
  manifest_version: 3,
  name: 'AI Pocket',
  version: '1.0.0',
  action: {
    default_popup: 'src/extension/index.html',
  },
  background: {
    service_worker: 'src/extension/background.ts',
    type: 'module',
  },
  host_permissions: [`${process.env.VITE_URL}/*`],
  externally_connectable: {
    matches: [`${process.env.VITE_URL}/*`],
  },
  permissions: ['activeTab', 'storage'],
});

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    global: process.env.VITEST ? 'global' : 'globalThis',
  },
  plugins: [crx({ manifest }), react()],
  publicDir: 'public_ext',
});
