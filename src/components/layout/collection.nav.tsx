import { Link } from "@tanstack/react-router";

export const CollectionNav = () => {
	return <nav className="sticky bottom-16 left-0 w-80 mx-auto h-16 bg-white/50 backdrop-blur-sm rounded-lg shadow-lg">
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center flex-1 justify-center gap-3">
        <Link
          to="/collection"
          activeProps={{ className: "bg-neutral-200" }}
          className="px-3 py-1.5 rounded-md hover:bg-neutral-100 transition-colors"
        >
          Grid
        </Link>
        <Link
          to="/canvas"
          activeProps={{ className: "bg-neutral-200" }}
          className="px-3 py-1.5 rounded-md hover:bg-neutral-100 transition-colors"
        >
          Canvas
        </Link>
        <button className="px-3 py-1.5 rounded-md hover:bg-neutral-100 transition-colors">
          List
        </button>
      </div>
    </div>
  </nav>;
};
