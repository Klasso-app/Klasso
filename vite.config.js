import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// "base" doit correspondre au nom du dépôt GitHub pour que les assets se
// chargent correctement sur https://klasso-app.github.io/Klasso/
export default defineConfig({
  base: '/Klasso/',
  plugins: [react(), tailwindcss()],
})
