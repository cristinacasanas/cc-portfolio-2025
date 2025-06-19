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
	// Optimize dependencies for faster dev server
	optimizeDeps: {
		include: [
			"react",
			"react-dom",
			"react/jsx-runtime",
			"@tanstack/react-router",
			"@tanstack/react-query",
			"framer-motion",
			"@sanity/client",
			"@sanity/image-url",
		],
	},
	build: {
		// Disable sourcemaps in production
		sourcemap: false,
		// Enable CSS code splitting
		cssCodeSplit: true,
		// Advanced minification
		minify: "terser",
		// Generate manifest
		manifest: true,
		// Optimize chunk size
		chunkSizeWarningLimit: 1000,
		terserOptions: {
			compress: {
				drop_console: true,
				drop_debugger: true,
				dead_code: true,
			},
			format: {
				comments: false,
			},
		},
		rollupOptions: {
			output: {
				// Simplified chunking strategy
				manualChunks: {
					"react-vendor": ["react", "react-dom"],
					"tanstack-vendor": [
						"@tanstack/react-router",
						"@tanstack/react-query",
					],
					"animation-vendor": ["framer-motion", "gsap"],
					"sanity-vendor": [
						"@sanity/client",
						"@sanity/image-url",
						"@portabletext/react",
					],
					"i18n-vendor": [
						"i18next",
						"react-i18next",
						"i18next-browser-languagedetector",
					],
				},
			},
		},
		// Report compressed chunk sizes
		reportCompressedSize: true,
		target: "esnext",
	},
	// CSS optimization
	css: {
		// Enable CSS modules optimization
		modules: {
			localsConvention: "camelCaseOnly",
		},
		// Advanced CSS processing
		preprocessorOptions: {
			// Enable CSS source maps in development only
			sourceMap: process.env.NODE_ENV === "development",
		},
		// Enable CSS code splitting
		devSourcemap: false,
	},
});
