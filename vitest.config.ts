import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// `astro:content` is a virtual module only available inside the Astro build.
// Alias it to a lightweight stub so pure utilities that live alongside
// `getCollection` imports can be unit-tested in plain Node.
export default defineConfig({
  resolve: {
    alias: {
      'astro:content': fileURLToPath(
        new URL('./test/stubs/astro-content.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
