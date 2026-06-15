import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { owlbearManifestPlugin } from './vite/owlbearManifestPlugin'

const base = process.env.VITE_BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [react(), owlbearManifestPlugin(base)],
  server: {
    host: true,
    allowedHosts: true,
    cors: true,
  },
})
