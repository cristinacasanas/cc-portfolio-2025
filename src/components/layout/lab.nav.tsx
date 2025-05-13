import { Link, useSearch } from "@tanstack/react-router";

export const LabNav = () => {
	// Get the current view from TanStack Router's search params
	const search = useSearch({ from: "/lab" });
	const view = search.view || "canvas";

	return (
		<nav className="mx-auto h-16 w-40 rounded-lg bg-white/80 shadow-lg backdrop-blur-sm">
			<div className="flex h-full items-center justify-center space-x-6">
				<Link
					to="/lab"
					search={{ view: "grid" }}
					className={`px-3 py-2 uppercase transition-colors ${
						view === "grid" ? "text-blue-600" : "hover:text-blue-600"
					}`}
					aria-current={view === "grid" ? "page" : undefined}
				>
					Grid
				</Link>
				<Link
					to="/lab"
					search={{ view: "canvas" }}
					className={`px-3 py-2 uppercase transition-colors ${
						view === "canvas" ? "text-blue-600" : "hover:text-blue-600"
					}`}
					aria-current={view === "canvas" ? "page" : undefined}
				>
					Canvas
				</Link>
			</div>
		</nav>
	);
};
