import { defineConfig } from 'vite';

// base: GitHub-Pages-Unterpfad. Lokal (dev) egal, für Pages = Repo-Name.
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? (process.env.BASE_PATH ?? '/Project-Library/') : '/',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
  },
}));
