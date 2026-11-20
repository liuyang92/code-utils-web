import { fileURLToPath, URL } from 'node:url'

export default {
  server: {
    host: '127.0.0.1'
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'node',
    pool: 'threads',
    include: ['tests/**/*.test.js']
  }
}
