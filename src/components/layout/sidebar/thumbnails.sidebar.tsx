import { Thumbnail } from "@/components/ui/thumbnail";
import { collection } from "@/mock/collection";
import { Sidebar } from "../sidebar";

export const ThumbnailsSidebar = () => {
	return (
		<Sidebar
			className="max-h-screen w-full flex-row gap-1.5 md:gap-2.5 md:flex-col md:overflow-y-auto"
			position="right"
		>
			{collection.map((item) => (
				<Thumbnail key={item.id} item={item} />
			))}
		</Sidebar>
	);
};
