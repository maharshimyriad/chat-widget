import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.js',
      name: 'LamChatWidget',
      formats: ['iife'],
      fileName: () => 'lam-chat-widget.js',
    },
    outDir: 'dist/embed',
    emptyOutDir: true,
    cssCodeSplit: false,
  },
});