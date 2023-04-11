/// <reference types="vitest" />
import { crx, defineManifest } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const DEV_KEY =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4BBB8Xgl9I9XqhVy0RrNLuC0+zvKBo4WMylaeWVIsKDvaMWSGiZesqXl2kSBGvKp0pAByqGZopqa7OdhccyrBgzp1msxulD3GzWMF/gyEupAVyFRWHHGKY8AFR+M0GVHWo3ONEKxqYV6Nlvz8PzLH1BtKEsDJ0LC6gxm41OlYcZEXUOJW7DAT90GRQRDFVb2eWMcXCUF3qUSleVL00nnIecDPrgF+m/fOrab86I2gNL+NRtPO+XBmLRnUVgqV/HvasEEsTbMSRclQsaRChjdZvlbulOEyGQcE0/DjYg+39Kq/cU84Eyndg10pvmUkLR+54UeoZn1obVCWHpbAfxTQQIDAQAB';
const PROD_KEY =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAn9kYEEcLOgnpxJ4lPXVNJr+GeUvcTODki1TXYmVs00Go05p2RsHjCeB9Y47MtBgT4gXqnMQVmjHd86fvaC8R/Ju7XMNifxL8Un6192UJ43ssvKwTeMI3y35O5/SYgPERvcxBnUtWRVN/EcJyExLKHmqWs09UxcaV/ayHB43utdq4FMV+G29JmYyVTQjkpPhoZRcy2l9UI2e+Wk9TX5GWDVkqtVkO6m5dySJl493V/WeBFppFqbkGid3lA/Oz9Chi1Xb8pIfIZjPbGkXhael6WPv3QpU/geJuQDMG4wz5GKTBAiM7dLwC6rzjSGzXTDzdQolP9KlG+S6w6U68BMQ4NQIDAQAB';
const NAME = 'Pouch';

const manifest = defineManifest({
  manifest_version: 3,
  name: `${NAME}${process.env.NODE_ENV === 'production' ? '' : ' Dev'}`,
  version: '1.0.0',
  description: 'Save bookmarks and have a personal briefing the next morning',
  key: process.env.NODE_ENV === 'production' ? PROD_KEY : DEV_KEY,
  icons: {
    16: 'public/favicon-16x16.png',
    32: 'public/favicon-32x32.png',
    48: 'public/favicon-48x48.png',
    128: 'public/favicon-128x128.png',
  },
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
  permissions: ['activeTab', 'storage'],
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
