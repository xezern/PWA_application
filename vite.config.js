// vite.config.js
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: '.',
      filename: 'sw.js',
      includeAssets: ['favicon.svg', 'robots.txt', 'icons/*.png', 'icons/*.avif'],
      manifest: {
        name: 'Postgram - Contact Manager PWA',
        short_name: 'Postgram',
        description: 'Online və offline işləyən kontakt idarəçisi',
        theme_color: '#00695c',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          { 
            src: '/icons/icon-48x48.png', 
            sizes: '48x48', 
            type: 'image/png',
            purpose: 'any maskable'
          },
          { 
            src: '/icons/icon-72x72.png', 
            sizes: '72x72', 
            type: 'image/png' 
          },
          { 
            src: '/icons/icon-96x96.png', 
            sizes: '96x96', 
            type: 'image/png' 
          },
          { 
            src: '/icons/icon-128x128.png', 
            sizes: '128x128', 
            type: 'image/png' 
          },
          { 
            src: '/icons/icon-144x144.png', 
            sizes: '144x144', 
            type: 'image/png' 
          },
          { 
            src: '/icons/icon-152x152.png', 
            sizes: '152x152', 
            type: 'image/png' 
          },
          { 
            src: '/icons/icon-192x192.png', 
            sizes: '192x192', 
            type: 'image/png',
            purpose: 'any maskable'
          },
          { 
            src: '/icons/icon-256x256.png', 
            sizes: '256x256', 
            type: 'image/png' 
          },
          { 
            src: '/icons/icon-384x384.png', 
            sizes: '384x384', 
            type: 'image/png' 
          },
          { 
            src: '/icons/icon-512x512.png', 
            sizes: '512x512', 
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    })
  ]
});
