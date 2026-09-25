import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { isPetVisitsReviewPreview, validateReviewApiBase } from "./src/lib/api-base";

if (isPetVisitsReviewPreview(process.env.VERCEL_ENV)) {
  validateReviewApiBase(process.env);
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@layouts": path.resolve(__dirname, "./src/layouts"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
  server: {
    port: 5173,
    open: true,
  },
});
