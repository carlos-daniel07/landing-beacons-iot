// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://beaconsiottechnologies.com",
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
  },
});
