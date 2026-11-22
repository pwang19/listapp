import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { configDefaults } from 'vitest/config';

// Node 22+ ships its own localStorage global, which shadows jsdom's in tests.
const nodeMajor = Number(process.versions.node.split('.')[0]);

export default defineConfig(({ isSsrBuild }) => ({
  // The SSR build is the agent MCP server (npm run build:mcp), which needs no web assets.
  publicDir: isSsrBuild ? false : 'public',
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
    // Playwright owns e2e/; its *.spec.ts files would otherwise match Vitest's default pattern.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    poolOptions: {
      forks: {
        execArgv: nodeMajor >= 22 ? ['--no-experimental-webstorage'] : [],
      },
    },
  },
}));
