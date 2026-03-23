// import path from 'path'
// import react from '@vitejs/plugin-react'
// import { defineConfig } from 'vite'

// export default defineConfig({
//   plugins: [react()],
//   resolve: {
//     alias: {
//       '@': path.resolve(__dirname, './src'),
//     },
//   },
//   server: {
//     proxy: {
//       '/api': {
//         target: 'https://api.samsonthomas.app',
//         changeOrigin: true,
//       },
//     },
//   },
// })
import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://api.samsonthomas.app',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: false,       // Disables readable source maps
    minify: 'terser',       // Stronger minification than default esbuild
    terserOptions: {
      compress: {
        drop_console: true,   // Removes all console.log statements
        drop_debugger: true,  // Removes debugger statements
      },
      mangle: {
        toplevel: true,       // Aggressively renames variables/functions
      },
    } as any,
  },
})