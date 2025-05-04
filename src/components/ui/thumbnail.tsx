import type { collection } from "@/mock/collection";
import { Link } from "@tanstack/react-router";
import { Image } from "./image";
type CollectionItem = (typeof collection)[number];

export const Thumbnail = ({
	item,
	className,
}: {
	item: CollectionItem;
	className?: string;
}) => {
	return (
		<Link to="/projects" key={item.id} className="w-full block">
			<Image className={className} ratio="4/5" src={item.image} alt={item.id} />
		</Link>
	);
};
