import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { owlbearManifestPlugin } from './vite/owlbearManifestPlugin'

const base = process.env.VITE_BASE_PATH ?? '/'
const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base,
  plugins: [react(), owlbearManifestPlugin(base)],
  resolve: {
    alias: {
      '@dragon-age/domain': path.resolve(rootDir, '../packages/domain/src/index.ts'),
      '@dragon-age/client': path.resolve(rootDir, '../packages/client/src/index.ts'),
    },
  },
  server: {
    host: true,
    allowedHosts: true,
    cors: true,
  },
})
