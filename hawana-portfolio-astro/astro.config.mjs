import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://hawanatamang.com.np',
  integrations: [sitemap()],
  output: 'static',
  trailingSlash: 'never',
});
