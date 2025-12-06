import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  // Fix symlink/junction path resolution issues
  root: path.resolve(__dirname),
  resolve: {
    // Resolve symlinks to their real paths to avoid path confusion
    preserveSymlinks: false,
  },
  build: {
    // Ensure build output paths are relative to the resolved root
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
})
