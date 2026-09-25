/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Relativ base så appen virker på GitHub Pages under /<repo>/
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Treningsapp',
        short_name: 'Trening',
        lang: 'nb',
        display: 'standalone',
        background_color: '#111418',
        theme_color: '#111418',
        start_url: '.',
        icons: [],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
