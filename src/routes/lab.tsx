import { createFileRoute, useSearch } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

// Use lazy loading for the component
const LabView = lazy(() => import("@/views/lab.view"));

export const Route = createFileRoute("/lab")({
	component: RouteComponent,
	validateSearch: (search: Record<string, unknown>) => {
		// Extract and validate the view parameter
		const view = search?.view?.toString() || "canvas";
		return {
			view: view === "grid" || view === "canvas" ? view : "canvas",
		};
	},
});

function RouteComponent() {
	// Get the view from search params
	const { view } = useSearch({ from: "/lab" });

	return (
		<div className="w-full h-full flex flex-col">
			<div className="flex-1">
				<Suspense fallback={<div className="p-4">Loading lab view...</div>}>
					<LabView initialView={view} />
				</Suspense>
			</div>
		</div>
	);
}
