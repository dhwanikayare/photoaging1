import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // This forces Vite to pre-bundle the mediapipe library
    include: ['@mediapipe/face_detection'],
  },
  build: {
    commonjsOptions: {
      // This ensures the CommonJS (old style) mediapipe files 
      // are converted to ESM (new style) correctly
      include: [/@mediapipe\/face_detection/, /node_modules/],
    },
  },
})