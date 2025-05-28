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
	if (!item?._id) {
		return null;
	}

	const handleClick = () => {
		const projectId = item.slug?.current || item._id;
		if (projectId) {
			scrollToProject(projectId);
		}
	};

	const getImageUrl = () => {
		if (!item?.thumbnail?.asset?._ref) return "";

		try {
			// Use Sanity's transformation API to enforce 4:5 aspect ratio
			return urlFor(item.thumbnail).url();
		} catch (error) {
			console.warn("Error generating image URL:", error);
			return "";
		}
	};
	return (
		<button
			type="button"
			onClick={handleClick}
			className="block h-full w-full cursor-pointer"
		>
			<Image
				className={clsx(className, "h-auto w-full object-cover")}
				ratio="4/5"
				src={getImageUrl()}
				alt={item.title || "Thumbnail"}
				draggable={false}
			/>
		</button>
	);
};
