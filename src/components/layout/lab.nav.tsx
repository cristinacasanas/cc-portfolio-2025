import { Drag } from "@/components/ui/icons/drag";
import { Grid } from "@/components/ui/icons/grid";
import { List } from "@/components/ui/icons/list";
import { Link, useSearch } from "@tanstack/react-router";

export const LabNav = () => {
	// Get the current view from TanStack Router's search params
	const search = useSearch({ from: "/lab" });
	const view = search.view || "canvas";

	return (
		<nav className="">
			<div className="flex h-full items-center justify-center gap-6">
				<Link
					to="/lab"
					search={{ view: "list" }}
					className="px-3 py-2"
					aria-current={view === "list" ? "page" : undefined}
				>
					<List />
				</Link>
				<Link
					to="/lab"
					search={{ view: "grid" }}
					className="px-3 py-2"
					aria-current={view === "grid" ? "page" : undefined}
				>
					<Grid />
				</Link>
				<Link
					to="/lab"
					search={{ view: "canvas" }}
					className="px-3 py-2"
					aria-current={view === "canvas" ? "page" : undefined}
				>
					<Drag />
				</Link>
			</div>
		</nav>
	);
};
