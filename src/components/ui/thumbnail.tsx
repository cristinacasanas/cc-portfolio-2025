import type { collection } from "@/mock/collection";
import { Link } from "@tanstack/react-router";
import clsx from "clsx";
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
		<Link to="/projects" key={item.id} className="size-full block">
			<Image
				className={clsx(className, "min-w-full min-h-full")}
				ratio="4/5"
				src={item.image}
				alt={item.id}
			/>
		</Link>
	);
};
