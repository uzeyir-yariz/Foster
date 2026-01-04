import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // Relative paths for Electron
  server: {
    port: 3500,
    open: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
