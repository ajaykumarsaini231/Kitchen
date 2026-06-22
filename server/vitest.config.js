import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      JWT_SECRET: 'test-secret',
      // Ensure tests use the in-memory DB, never an external MONGODB_URI.
      MONGODB_URI: '',
    },
    testTimeout: 30000,
    hookTimeout: 120000,
    fileParallelism: false,
  },
});
