// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import mdx from '@astrojs/mdx';

import vercel from '@astrojs/vercel';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },

  devToolbar:{
    enabled:false
  },
  site:"https://hawanatamang.com.np/",

  integrations: [mdx(), sitemap()],
  adapter: vercel()
});