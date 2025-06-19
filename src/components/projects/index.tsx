import Plus from "@/components/ui/icons/plus";
import { Image } from "@/components/ui/image";
import { useProjectVisibility } from "@/hooks/use-project-visibility";
import { useLanguage } from "@/hooks/useLanguage";
import { urlForGallery, urlForThumbnail } from "@/lib/sanity";
import { getVideoUrl, isVideo } from "@/utils/video";
import {} from "@tanstack/react-router";
import clsx from "clsx";
import { AnimatePresence, type PanInfo, motion } from "framer-motion";
import React from "react";
import type { Categories, Projects } from "studio/sanity.types";

type ProjectWithCategories = Projects & {
	expandedCategories?: Categories[];
};

const ProjectCard = ({ project }: { project: ProjectWithCategories }) => {
	const [isOpen, setIsOpen] = React.useState(false);
	const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
	const [direction, setDirection] = React.useState(0);
	const projectId = project.slug?.current || project._id;

	// Use the custom hook for visibility detection
	const { ref } = useProjectVisibility({
		projectId,
		threshold: 0.5,
		rootMargin: window.innerWidth < 768 ? "-15% 0px" : "-20% 0px",
	});

	// Function to handle image navigation
	const navigateImage = (newIndexInput: number) => {
		const galleryLength = project.gallery?.length || 1;
		let newIndex = newIndexInput;

		if (newIndex < 0) {
			newIndex = galleryLength - 1;
		} else if (newIndex >= galleryLength) {
			newIndex = 0;
		}

		setDirection(newIndex > currentImageIndex ? 1 : -1);
		setCurrentImageIndex(newIndex);
	};

	return (
		<div
			ref={ref}
			data-project-id={projectId}
			className="inline-flex w-full flex-col items-start justify-start gap-1.5 self-stretch md:gap-2.5"
		>
			<MainImage
				item={project.gallery?.[currentImageIndex]}
				title={project.title}
				direction={direction}
				onDrag={handleDragEnd}
			/>
			<Carousel
				images={project.gallery}
				currentIndex={currentImageIndex}
				setCurrentIndex={navigateImage}
			/>
			<ProjectInfo isOpen={isOpen} setIsOpen={setIsOpen} project={project} />
			<ProjectDescription isOpen={isOpen} description={project.description} />
		</div>
	);

	// Handle drag end event for the main image
	function handleDragEnd(
		_: MouseEvent | TouchEvent | PointerEvent,
		info: PanInfo,
	) {
		const { offset, velocity } = info;
		const swipeThreshold = 50;

		if (offset.x > swipeThreshold || velocity.x > 800) {
			// Swipe right - go to previous image
			navigateImage(currentImageIndex - 1);
		} else if (offset.x < -swipeThreshold || velocity.x < -800) {
			// Swipe left - go to next image
			navigateImage(currentImageIndex + 1);
		}
	}
};

// Media item component that handles both images and videos
interface MediaItemProps {
	item: NonNullable<Projects["gallery"]>[0];
	title?: string;
	className?: string;
	ratio?: "16/9" | "4/3" | "1/1" | "3/4" | "9/16" | "4/5";
	priority?: boolean;
	[key: string]: unknown;
}

const MediaItem = ({
	item,
	title,
	className,
	ratio = "16/9",
	priority = false,
	...props
}: MediaItemProps) => {
	if (!item) {
		return null;
	}

	// Handle array items (as per schema)
	if (Array.isArray(item)) {
		const mediaItem = item.find((t) => t && typeof t === "object");
		if (!mediaItem) return null;

		// Recursively call MediaItem with the found item
		return (
			<MediaItem
				item={mediaItem}
				title={title}
				className={className}
				ratio={ratio}
				priority={priority}
				{...props}
			/>
		);
	}

	const isVideoItem = isVideo(item);

	if (!item.asset?._ref) {
		return null;
	}

	let src = "";

	try {
		if (isVideoItem) {
			// Get video URL using the utility function
			src = getVideoUrl(item.asset._ref);
		} else {
			// Use optimized image URL based on context
			const isGalleryItem = className?.includes("gallery") || ratio === "16/9";
			src = isGalleryItem
				? urlForGallery(item).url()
				: urlForThumbnail(item).url();
		}
	} catch (error) {
		console.error("Error generating URL:", error);
		return null;
	}

	if (isVideoItem) {
		return (
			<Video
				className={className}
				src={src}
				alt={item.alt || title || "Project video"}
				ratio={ratio}
				{...props}
			/>
		);
	}

	return (
		<Image
			className={className}
			ratio={ratio}
			src={src}
			alt={item.alt || title || "Project content"}
			{...props}
		/>
	);
};

const MainImage = ({
	item,
	title,
	direction,
	onDrag,
}: {
	item?: NonNullable<Projects["gallery"]>[0];
	title?: string;
	direction: number;
	onDrag: (
		event: MouseEvent | TouchEvent | PointerEvent,
		info: PanInfo,
	) => void;
}) => {
	// Define animation variants without using string for position
	const variants = {
		enter: (direction: number) => ({
			x: direction > 0 ? "100%" : "-100%",
			opacity: 0,
		}),
		center: {
			x: 0,
			opacity: 1,
		},
		exit: (direction: number) => ({
			x: direction > 0 ? "-100%" : "100%",
			opacity: 0,
		}),
	};

	if (!item) return null;

	return (
		<div className="relative inline-flex w-full flex-col items-start justify-start gap-1.5 self-stretch overflow-hidden md:gap-2.5">
			<div className="relative aspect-video w-full">
				<motion.div
					className="relative w-full cursor-grab"
					drag="x"
					dragElastic={0.3}
					dragConstraints={{ left: 0, right: 0 }}
					onDragEnd={onDrag}
					whileTap={{ cursor: "grabbing" }}
					style={{ position: "relative", height: "100%" }}
				>
					<div style={{ position: "absolute", inset: 0 }}>
						<AnimatePresence initial={false} mode="sync" custom={direction}>
							<motion.div
								key={item.asset?._ref}
								custom={direction}
								variants={variants}
								initial="enter"
								animate="center"
								exit="exit"
								transition={{
									x: { stiffness: 300 },
									opacity: { duration: 0.2 },
								}}
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									width: "100%",
									height: "100%",
								}}
							>
								<MediaItem
									className="size-full object-cover"
									item={item}
									title={title}
									draggable={false}
									ratio="16/9"
								/>
							</motion.div>
						</AnimatePresence>
					</div>
				</motion.div>
			</div>
		</div>
	);
};

const Carousel = ({
	images,
	currentIndex,
	setCurrentIndex,
}: {
	images: Projects["gallery"];
	currentIndex: number;
	setCurrentIndex: (index: number) => void;
}) => {
	return (
		<div className="inline-flex w-full items-center gap-1.5 overflow-x-scroll md:gap-2.5">
			{images?.map((item, index) => (
				<button
					key={item.asset?._ref}
					className={clsx(
						"cursor-pointer border-0 bg-white p-0",
						currentIndex !== index && "opacity-50",
					)}
					onClick={() => setCurrentIndex(index)}
					type="button"
				>
					<div className="h-[61px] w-[108px] overflow-hidden">
						<MediaItem
							item={item}
							alt={item.alt || ""}
							draggable={false}
							className="size-full cursor-pointer bg-white object-cover"
							ratio="16/9"
							controls={false}
							muted={true}
						/>
					</div>
				</button>
			))}
		</div>
	);
};

const ProjectInfo = ({
	isOpen,
	setIsOpen,
	project,
}: {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	project: ProjectWithCategories;
}) => {
	const { getLocalizedContent } = useLanguage();

	const categoryTitles = project.expandedCategories
		?.map((category) => {
			const frTitle = category.title?.fr || "";
			const enTitle = category.title?.en || "";
			return getLocalizedContent(frTitle, enTitle);
		})
		.filter(Boolean)
		.join(", ");

	return (
		<div className="inline-flex items-center justify-between self-stretch">
			<div className="hidden w-[122px] items-start justify-start gap-1.5 py-0.5 md:flex md:gap-2.5">
				<h3 className="justify-start font-mono text-sm leading-[21px]">
					{categoryTitles}
				</h3>
			</div>
			<div className="flex w-[122px] items-start justify-center gap-1.5 py-0.5 md:gap-2.5">
				<h3 className="flex w-full justify-start font-mono text-sm leading-[21px] md:justify-center md:text-center">
					{project.title}
				</h3>
			</div>
			<div className="flex w-[122px] items-center justify-center gap-1.5 py-0.5 md:gap-2.5">
				<button
					type="button"
					className="flex cursor-pointer items-center justify-start gap-2.5 border-none bg-transparent p-0"
					onClick={() => setIsOpen(!isOpen)}
					aria-expanded={isOpen}
				>
					<h3 className="justify-start font-mono text-sm leading-[21px]">
						Description
					</h3>

					<Plus className="size-4" isOpen={isOpen} />
				</button>
			</div>
		</div>
	);
};

const ProjectDescription = ({
	isOpen,
	description,
}: { isOpen: boolean; description: Projects["description"] }) => {
	// Importing the useLanguage hook to get current language
	const { getLocalizedContent } = useLanguage();

	const localizedDescription = description
		? getLocalizedContent(description.fr || "", description.en || "")
		: "";

	return (
		<motion.div
			initial={false}
			animate={{
				height: isOpen ? "auto" : 0,
				opacity: isOpen ? 1 : 0,
				filter: isOpen ? "blur(0px)" : "blur(3px)",
			}}
			transition={{
				duration: 0.3,
				ease: "easeInOut",
			}}
			className="overflow-hidden"
		>
			<p className="py-2 text-center font-mono text-xs leading-[18px] md:text-sm md:leading-[21px]">
				{localizedDescription}
			</p>
		</motion.div>
	);
};

// Video component with the same props interface as Image
const Video = ({
	className,
	src,
	alt,
	ratio = "16/9",
	...props
}: {
	className?: string;
	src: string;
	alt: string;
	ratio?: "16/9" | "4/3" | "1/1" | "3/4" | "9/16" | "4/5";
}) => {
	const [hasError, setHasError] = React.useState(false);
	const videoRef = React.useRef<HTMLVideoElement>(null);

	// Get aspect ratio class
	const aspectClass = React.useMemo(() => {
		switch (ratio) {
			case "16/9":
				return "aspect-video";
			case "4/3":
				return "aspect-[4/3]";
			case "1/1":
				return "aspect-square";
			case "3/4":
				return "aspect-[3/4]";
			case "9/16":
				return "aspect-[9/16]";
			case "4/5":
				return "aspect-[4/5]";
			default:
				return "aspect-video";
		}
	}, [ratio]);

	// Try to reload the video if it fails to load
	React.useEffect(() => {
		let retryCount = 0;
		const maxRetries = 2;

		const tryReload = () => {
			if (videoRef.current && hasError && retryCount < maxRetries) {
				retryCount++;
				videoRef.current.load();
			}
		};

		if (hasError) {
			const timer = setTimeout(tryReload, 1000);
			return () => clearTimeout(timer);
		}
	}, [hasError]);

	if (!src) {
		return (
			<div
				className={clsx(
					aspectClass,
					"flex items-center justify-center bg-gray-100",
					className,
				)}
			>
				<span className="text-gray-400">Video source missing</span>
			</div>
		);
	}

	React.useEffect(() => {
		console.log("Video component - src:", src);
		videoRef.current?.play();
		console.log("Video component - playing");
	}, []);

	return (
		<>
			<video
				ref={videoRef}
				className={clsx(
					aspectClass,
					"h-auto w-full object-cover",
					className,
					hasError && "hidden",
				)}
				src={src}
				title={alt}
				autoPlay={true}
				playsInline
				loop
				muted
				preload="auto"
				onError={() => setHasError(true)}
				onLoadedData={() => setHasError(false)}
				{...props}
			>
				<track kind="captions" />
				Your browser does not support the video tag.
			</video>

			{hasError && (
				<div
					className={clsx(
						aspectClass,
						"flex items-center justify-center bg-gray-100",
						className,
					)}
				>
					<span className="text-gray-500">Failed to load video</span>
				</div>
			)}
		</>
	);
};

export { ProjectCard };
