// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    server: {
      host: '0.0.0.0',
      port: 4321,
      allowedHosts: 'all'
    }
  },
  server: {
    host: '0.0.0.0',
    port: 4321
  },
  adapter: node({
    mode: 'standalone'
  })
});

