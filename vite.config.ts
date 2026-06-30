import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  plugins: [
    TanStackRouterVite({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
    tsconfigPaths(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false, // We register it manually in __root.tsx
      manifest: {
        name: "QuestLog",
        short_name: "QuestLog",
        description: "A minimalist Solo Leveling-inspired personal project and issue tracker.",
        theme_color: "#05060f",
        background_color: "#05060f",
        display: "standalone",
        start_url: "/Questlog/",
        icons: [
          {
            src: "/Questlog/favicon.ico",
            sizes: "64x64 32x32 24x24 16x16",
            type: "image/x-icon",
          },
        ],
      },
    }),
  ],
  build: {
    outDir: "dist",
  },
});
