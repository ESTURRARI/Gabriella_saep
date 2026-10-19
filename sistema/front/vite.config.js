import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Tudo que o front chama em /api e repassado para o back (FastAPI) em 127.0.0.1:8000.
// Assim nao ha problema de CORS durante o desenvolvimento.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
