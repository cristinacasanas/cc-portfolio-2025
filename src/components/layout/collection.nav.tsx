import { Link } from "@tanstack/react-router";

export const CollectionNav = () => {
	return <nav className="w-40 mx-auto h-16 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg">
    <div className="h-full flex items-center justify-center space-x-6">
        <Link
          to="/collection"
          className="px-3 py-2 hover:text-blue-600 transition-colors uppercase"
        >
          Grid
        </Link>
        <Link
          to="/collection"
          className="px-3 py-2 hover:text-blue-600 transition-colors uppercase"
        >
          Canvas
        </Link>
      </div>
  </nav>;
};
