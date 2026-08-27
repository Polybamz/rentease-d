import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig(({ mode }) => {
  // Vite only exposes VITE_-prefixed vars, and only to the client. The
  // Cloudinary credentials are server-only secrets, so hand them to the dev
  // server process instead; in production the host supplies them and real
  // environment values always win over .env.
  for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), "CLOUDINARY_"))) {
    if (process.env[key] === undefined) process.env[key] = value;
  }

  return {
    plugins: [
      tanstackStart({
        server: { entry: "server" },
      }),
      react(),
      tsconfigPaths(),
      tailwindcss(),
    ],
  };
});
