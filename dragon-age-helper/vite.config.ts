import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Required since Vite 6.0.9: Owlbear (https://www.owlbear.rodeo) fetches the manifest cross-origin.
    // https://docs.owlbear.rodeo/extensions/tutorial-hello-world/create-your-site/
    cors: {
      origin: ['https://www.owlbear.rodeo', 'https://owlbear.rodeo'],
    },
  },
})
