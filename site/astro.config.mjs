import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://jonathanabraham.dev',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
});
