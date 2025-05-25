import { urlFor } from "@/lib/sanity";
import { scrollToProject } from "@/lib/scroll.service";
import clsx from "clsx";
import type { Projects } from "studio/sanity.types";
import { Image } from "./image";

export const Thumbnail = ({
	item,
	className,
}: {
	item: Projects;
	className?: string;
}) => {
	const handleClick = () => {
		const projectId = item.slug?.current || item._id;
		scrollToProject(projectId);
	};

	const getImageUrl = () => {
		if (!item.thumbnail?.asset?._ref) return "";

		// Use Sanity's transformation API to enforce 4:5 aspect ratio
		return urlFor(item.thumbnail)
			.width(300) // Set a base width (will be responsively scaled by CSS)
			.height(375) // 4:5 ratio (300 * 5/4 = 375)
			.fit("crop")
			.url();
	};
	return (
		<button
			type="button"
			onClick={handleClick}
			className="block h-full cursor-pointer"
		>
			<Image
				className={clsx(
					className,
					"min-h-full w-auto md:min-w-full md:max-w-full",
				)}
				ratio="4/5"
				src={getImageUrl()}
				alt={item.title}
				draggable={false}
			/>
		</button>
	);
};
