import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['sweetalert2', 'canvg', 'html2canvas', 'pako'],
      output: {
        manualChunks: {
          vendor: ['@angular/core', '@angular/common', '@angular/router'],
          ui: ['@angular/material', '@angular/cdk', 'bootstrap'],
          charts: ['chart.js', 'ng2-charts'],
          pdf: ['jspdf', 'pdf-lib', 'ng2-pdf-viewer'],
          auth: ['keycloak-angular', 'keycloak-js']
        }
      }
    },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  }
}); 