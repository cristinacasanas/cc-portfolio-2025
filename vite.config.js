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
		sourcemap: false,
		outDir: "dist",
		minify: "terser",
		terserOptions: {
			compress: {
				drop_console: true,
				drop_debugger: true,
			},
		},
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					if (id.includes("node_modules")) {
						if (id.includes("react") || id.includes("react-dom")) {
							return "react-vendor";
						}
						if (id.includes("@tanstack")) {
							return "tanstack-vendor";
						}
						if (id.includes("framer-motion") || id.includes("gsap")) {
							return "animation-vendor";
						}
						if (
							id.includes("clsx") ||
							id.includes("class-variance-authority")
						) {
							return "ui-vendor";
						}
						if (id.includes("i18next")) {
							return "i18n-vendor";
						}
						if (id.includes("@sanity") || id.includes("groq")) {
							return "sanity-vendor";
						}
						return "vendor";
					}

					if (id.includes("src/views/")) {
						return "views";
					}
					if (id.includes("src/components/")) {
						return "components";
					}
					if (id.includes("src/stores/")) {
						return "stores";
					}
					if (id.includes("src/lib/")) {
						return "lib";
					}
				},
			},
		},
		chunkSizeWarningLimit: 1000,
		cssCodeSplit: true,
	},
	esbuild: {
		legalComments: "none",
	},
});
