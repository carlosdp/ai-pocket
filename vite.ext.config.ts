/// <reference types="vitest" />
import { crx, defineManifest } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const manifest = defineManifest({
  manifest_version: 3,
  name: 'Overload',
  version: '1.0.0',
  key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAn9kYEEcLOgnpxJ4lPXVNJr+GeUvcTODki1TXYmVs00Go05p2RsHjCeB9Y47MtBgT4gXqnMQVmjHd86fvaC8R/Ju7XMNifxL8Un6192UJ43ssvKwTeMI3y35O5/SYgPERvcxBnUtWRVN/EcJyExLKHmqWs09UxcaV/ayHB43utdq4FMV+G29JmYyVTQjkpPhoZRcy2l9UI2e+Wk9TX5GWDVkqtVkO6m5dySJl493V/WeBFppFqbkGid3lA/Oz9Chi1Xb8pIfIZjPbGkXhael6WPv3QpU/geJuQDMG4wz5GKTBAiM7dLwC6rzjSGzXTDzdQolP9KlG+S6w6U68BMQ4NQIDAQAB',
  action: {
    default_popup: 'src/extension/index.html',
  },
  background: {
    service_worker: 'src/extension/background.ts',
    type: 'module',
  },
  host_permissions: [`${process.env.URL}/*`],
  externally_connectable: {
    matches: [`${process.env.URL}/*`],
  },
  permissions: ['activeTab', 'tabs', 'storage'],
});

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    global: process.env.VITEST ? 'global' : 'globalThis',
    'import.meta.env.URL': JSON.stringify(process.env.URL),
  },
  plugins: [crx({ manifest }), react()],
  publicDir: 'public_ext',
});
