import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  define: {
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? ""),
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "")
  },
  plugins: [react()],
  server: {
    port: 5173
  }
});
