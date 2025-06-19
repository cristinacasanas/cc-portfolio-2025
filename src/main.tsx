import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode, Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";

import * as TanstackQuery from "./integrations/tanstack-query/root-provider";
import "./i18n";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import "./styles.css";
import reportWebVitals from "./reportWebVitals.ts";

// Lazy load analytics to reduce initial bundle size
const Analytics = lazy(() =>
	import("@vercel/analytics/react").then((module) => ({
		default: module.Analytics,
	})),
);
const SpeedInsights = lazy(() =>
	import("@vercel/speed-insights/react").then((module) => ({
		default: module.SpeedInsights,
	})),
);

// Create a new router instance
const router = createRouter({
	routeTree,
	context: {
		...TanstackQuery.getContext(),
	},
	defaultPreload: "intent",
	scrollRestoration: true,
	defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

// Render the app
const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<StrictMode>
			<TanstackQuery.Provider>
				<Suspense fallback={null}>
					<Analytics />
					<SpeedInsights />
				</Suspense>
				<RouterProvider router={router} />
			</TanstackQuery.Provider>
		</StrictMode>,
	);
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
