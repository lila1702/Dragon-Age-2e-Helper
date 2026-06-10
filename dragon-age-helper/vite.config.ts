import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { owlbearManifestPlugin } from './vite/owlbearManifestPlugin'

const base = process.env.VITE_BASE_PATH ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react(), owlbearManifestPlugin(base)],
  server: {
    // Required since Vite 6.0.9: Owlbear (https://www.owlbear.rodeo) fetches the manifest cross-origin.
    // https://docs.owlbear.rodeo/extensions/tutorial-hello-world/create-your-site/
    cors: {
      origin: ['https://www.owlbear.rodeo', 'https://owlbear.rodeo'],
    },
  },
})
