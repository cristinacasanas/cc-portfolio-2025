import { createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

// Use lazy loading for the component
const LabView = lazy(() => import("@/views/lab.view"));

export const Route = createFileRoute("/lab")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<Suspense fallback={<div className="p-4">Loading lab view...</div>}>
			<LabView />
		</Suspense>
	);
}
