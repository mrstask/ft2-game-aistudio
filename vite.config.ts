import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          tileLab: path.resolve(__dirname, 'tile-lab.html'),
          wallLab: path.resolve(__dirname, 'wall-lab.html'),
          animationPreview: path.resolve(__dirname, 'animation-preview.html'),
          devLevelEditor: path.resolve(__dirname, 'dev-level-editor.html'),
          devLevelPreview: path.resolve(__dirname, 'dev-level-preview.html'),
          devCharacterEditor: path.resolve(__dirname, 'dev-character-editor.html'),
          devCharacterPreview: path.resolve(__dirname, 'dev-character-preview.html'),
          devSystems: path.resolve(__dirname, 'dev-systems.html'),
        },
      },
    },
  };
});
