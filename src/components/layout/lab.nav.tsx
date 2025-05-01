import { Link, useSearch } from "@tanstack/react-router";

export const LabNav = () => {
	// Get the current view from TanStack Router's search params
	const search = useSearch({ from: "/lab" });
	const view = search.view || "canvas";

	return (
		<nav className="w-40 mx-auto h-16 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg">
			<div className="h-full flex items-center justify-center space-x-6">
				<Link
					to="/lab"
					search={{ view: "grid" }}
					className={`px-3 py-2 transition-colors uppercase ${
						view === "grid" ? "text-blue-600" : "hover:text-blue-600"
					}`}
				>
					Grid
				</Link>
				<Link
					to="/lab"
					search={{ view: "canvas" }}
					className={`px-3 py-2 transition-colors uppercase ${
						view === "canvas" ? "text-blue-600" : "hover:text-blue-600"
					}`}
				>
					Canvas
				</Link>
			</div>
		</nav>
	);
};
