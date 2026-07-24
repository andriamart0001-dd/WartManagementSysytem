// =============================================================================
// vite.config.js — Vite Configuration for React
// =============================================================================
// This config file enables React JSX support and configures the dev server.
// =============================================================================

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Frontend dev server runs on port 5173
    open: false  // Do not auto-open browser tab on start
  }
});
