import { collection } from "@/mock/collection";
import { Link } from "@tanstack/react-router";
import { Sidebar } from "../sidebar";

export const ThumbnailsSidebar = () => {
	return (
		<Sidebar className="max-h-screen gap-1 overflow-y-auto" position="right">
			{collection.map((item) => (
				<Link to={`/projects/${item.id}`} key={item.id}>
					<img className="aspect-[4/5]" src={item.image} alt={item.id} />
				</Link>
			))}
		</Sidebar>
	);
};
