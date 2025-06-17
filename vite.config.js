import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { resolve } from "node:path";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

// https://vitejs.dev/config/
export default defineConfig({
	base: "/",
	server: {
		port: 3000,
		strictPort: false,
	},
	plugins: [
		TanStackRouterVite({
			autoCodeSplitting: true,
			routeMatcher: "src/routes/**/*.tsx",
		}),
		viteReact(),
		tailwindcss(),
	],
	test: {
		globals: true,
		environment: "jsdom",
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
	build: {
		sourcemap: true,
		outDir: "dist",
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					if (id.includes("node_modules")) {
						return "vendor";
					}
				},
			},
		},
	},
});
