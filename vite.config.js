import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // *** THIS IS THE FIX ***
  // It must match your repository name: "Text-To-Speech"
  base: "/text-to-speech-app/", 
})