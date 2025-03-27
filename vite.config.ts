import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
// @ts-ignore - Keine Typdefinition für api-middleware.js
import apiMiddleware from "./api-middleware.js";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..']
    },
    // Verbesserte Fehlerbehandlung
    hmr: {
      // HMR aktiviert
      overlay: true
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    // Add middleware to handle API requests
    {
      name: 'configure-server',
      configureServer(server: any) {
        server.middlewares.use(apiMiddleware);
      }
    }
  ].filter(Boolean),
  base: process.env.ELECTRON_RUN ? './' : '/',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Verbesserte Auflösung für dynamische Imports
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json']
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          // Verbesserte Teilung in Chunks für wichtige Komponenten
          'editor-core': [
            './src/components/ResourceEditor',
            './src/components/resource-editor/GeneralSection'
          ]
        }
      }
    }
  },
  // Verbesserte Optionen für Optimierungen
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
}));
