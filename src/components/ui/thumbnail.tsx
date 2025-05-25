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
			className="block h-full cursor-pointer"
		>
			<Image
				className={clsx(
					className,
					"aspect-[4/5] h-full w-auto md:min-w-full md:max-w-full",
				)}
				ratio="4/5"
				src={getImageUrl()}
				alt={item.title}
				draggable={false}
			/>
		</button>
	);
};
