import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import topLevelAwait from "vite-plugin-top-level-await";
import crossOriginIsolation from "vite-plugin-cross-origin-isolation";
import nodePolyfills from "rollup-plugin-polyfill-node";
import { default as swc } from "rollup-plugin-swc";
// import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    "process.env": {},
  },
  esbuild: false,
  worker: {
    plugins: [
      react(),
      nodePolyfills({
        include: ["util"],
      }),
      topLevelAwait({
        // The export name of top-level await promise for each chunk module
        promiseExportName: "__tla",
        // The function to generate import names of top-level await promise in each chunk module
        promiseImportName: (i) => `__tla_${i}`,
      }),
    ],
  },
  build: {
    minify: false,
  },
  plugins: [
    react(),
    topLevelAwait({
      // The export name of top-level await promise for each chunk module
      promiseExportName: "__tla",
      // The function to generate import names of top-level await promise in each chunk module
      promiseImportName: (i) => `__tla_${i}`,
    }),
    crossOriginIsolation(),
    nodePolyfills({
      include: ["util"],
    }),
  ],
});
