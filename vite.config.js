import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const httpsConfig = mode !== 'production'
    ? (() => {
      try {
        return {
          key: fs.readFileSync('localhost-key.pem'),
          cert: fs.readFileSync('localhost.pem'),
        }
      } catch {
        return false
      }
    })()
    : false

  return {
    plugins: [react()],
    server: {
      https: httpsConfig,
      port: 5173
    }
  }
})

