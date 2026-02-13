// vite.config.ts is written as pure ESM. Keep import/export syntax only
// to avoid mixing CommonJS and ESM which can cause startup errors.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
})
