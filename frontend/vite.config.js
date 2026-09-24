import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    proxy: {
      // Forwards any request starting with /api to your Express
      // backend instead of letting Vite's dev server swallow it
      // and return index.html (the "<!doctype" JSON error).
      "/api": {
        target: "http://localhost:5000", // change to your backend's actual port
        changeOrigin: true,
      },
    },
  },
});

/* npx vite --host 127.0.0.1 */
