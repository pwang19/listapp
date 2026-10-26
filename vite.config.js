import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Node 22+ ships its own localStorage global, which shadows jsdom's in tests.
const nodeMajor = Number(process.versions.node.split('.')[0]);

export default defineConfig({
  plugins: [react({ include: '**/*.{jsx,js}' })],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    poolOptions: {
      forks: {
        execArgv: nodeMajor >= 22 ? ['--no-experimental-webstorage'] : [],
      },
    },
  },
});
