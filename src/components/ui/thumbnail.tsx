import { urlFor } from "@/lib/sanity";
import { scrollToProject } from "@/lib/scroll.service";
import clsx from "clsx";
import type { Projects } from "studio/sanity.types";
import { Image } from "./image";

// Helper to determine if a media item is a video based on _ref
const isVideo = (item: { asset?: { _ref?: string } }): boolean => {
	if (!item?.asset?._ref) return false;
	const ref = item.asset._ref;
	return ref.startsWith("file-");
};

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

	const getMediaUrl = () => {
		if (!item?.thumbnail?.asset?._ref) return "";

		try {
			if (isVideo(item.thumbnail)) {
				// Handle video URL
				return `https://cdn.sanity.io/files/${
					import.meta.env.VITE_SANITY_PROJECT_ID
				}/${import.meta.env.VITE_SANITY_DATASET}/${item.thumbnail.asset._ref
					.replace("file-", "")
					.replace("-mp4", ".mp4")
					.replace("-webm", ".webm")
					.replace("-ogg", ".ogg")
					.replace("-mov", ".mov")}`;
			}
			// Use Sanity's transformation API for images
			return urlFor(item.thumbnail).url();
		} catch (error) {
			console.warn("Error generating media URL:", error);
			return "";
		}
	};

	const isVideoThumbnail = isVideo(item.thumbnail || {});
	const mediaUrl = getMediaUrl();

	return (
		<button
			type="button"
			onClick={handleClick}
			className="block h-full w-full cursor-pointer"
		>
			{isVideoThumbnail ? (
				<video
					className={clsx(className, "h-auto w-full bg-white object-cover")}
					src={mediaUrl}
					autoPlay
					loop
					muted
					playsInline
					draggable={false}
					style={{ aspectRatio: "4/5" }}
				>
					<track kind="captions" />
				</video>
			) : (
				<Image
					className={clsx(className, "h-auto w-full object-cover")}
					ratio="4/5"
					src={mediaUrl}
					alt={item.title || "Thumbnail"}
					draggable={false}
				/>
			)}
		</button>
	);
};
