import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    commonjsOptions: {
      include: [/node_modules/]
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-icons',
      'react-router',
      'react-router-dom'
    ]
  },
  base: './'  // for Heroku deployment
})
