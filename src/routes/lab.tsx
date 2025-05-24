import { LabNav } from "@/components/layout/lab.nav";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

// Use lazy loading for the LabView component
const LabView = lazy(() => import("@/views/lab.view"));

export const Route = createFileRoute("/lab")({
	component: LabRouteComponent,
	validateSearch: (search: Record<string, unknown>) => {
		// Extract and validate the view parameter
		const view = search?.view?.toString() || "canvas";
		return {
			view:
				view === "grid" || view === "canvas" || view === "list"
					? view
					: "canvas",
		};
	},
});

function LabRouteComponent() {
	// Get the view from search params
	const { view } = useSearch({ from: "/lab" });

	return (
		// This div will now be a child of the main <Container> from __root.tsx
		// Adjust styling as needed if it's meant to fill the container or have specific layout within it.
		<div className="h-full w-full p-4">
			<Suspense>
				<LabView initialView={view} />
			</Suspense>
			<LabFooter />
		</div>
	);
}

export const LabFooter = () => {
	return (
		<div className="pointer-events-none fixed right-6 bottom-6 left-6 z-50 flex items-end justify-between">
			<h1 className="font-extralight font-mono text-[262px] uppercase leading-[195.52px]">
				Lab
			</h1>
			<div className="pointer-events-auto">
				<LabNav />
			</div>
		</div>
	);
};
