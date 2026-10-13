import { defineConfig } from 'astro/config';

// SITE_URL / BASE_PATH are only needed when the site is not served from the
// root of its own domain (e.g. GitHub Pages project sites use /<repo-name>).
export default defineConfig({
  site: process.env.SITE_URL || undefined,
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'always',
});
