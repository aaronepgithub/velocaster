import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const cartoKey =
    env.VITE_CARTO_KEY ||
    env.CARTO_KEY ||
    process.env.VITE_CARTO_KEY ||
    process.env.CARTO_KEY ||
    'cb1_4n6s_1_2a3839f43a46a26f3418c169';

  return {
    base: process.env.GITHUB_PAGES === 'true' ? '/velocaster/' : './',
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_CARTO_KEY': JSON.stringify(cartoKey),
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
