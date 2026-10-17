import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const cartoKey =
    env.VITE_CARTO_KEY ||
    env.CARTO_KEY ||
    process.env.VITE_CARTO_KEY ||
    process.env.CARTO_KEY ||
    'cb1_4n6s_1_2a3839f43a46a26f3418c169';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_CARTO_KEY': JSON.stringify(cartoKey),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
