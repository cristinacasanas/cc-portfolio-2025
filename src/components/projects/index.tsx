import Plus from "@/components/ui/icons/plus";
import { Image } from "@/components/ui/image";
import { useLanguage } from "@/hooks/useLanguage";
import { urlFor } from "@/lib/sanity";
import {
	clear as clearScrollService,
	registerProject,
} from "@/lib/scroll.service";
import { getVideoUrl, isVideo } from "@/utils/video";
import clsx from "clsx";
import { AnimatePresence, type PanInfo, motion } from "framer-motion";
import React, { useEffect, useRef } from "react";
import type { Categories, Projects } from "studio/sanity.types";

type ProjectWithCategories = Projects & {
	expandedCategories?: Categories[];
};

// Référence globale pour suivre tous les projets et leurs positions
export const projectsRegistry = {
	projects: new Map<string, { element: HTMLDivElement; position: number }>(),
	lastProjectId: null as string | null,

	// Méthode pour enregistrer un projet
	registerProject(id: string, element: HTMLDivElement, position: number) {
		this.projects.set(id, { element, position });
		// Enregistrer également dans le ScrollService
		registerProject(id, element);
		// Mettre à jour le dernier projet (celui avec la position la plus élevée)
		if (
			this.lastProjectId === null ||
			position > (this.projects.get(this.lastProjectId)?.position || 0)
		) {
			this.lastProjectId = id;
		}
	},

	// Méthode pour vérifier si un projet est le dernier
	isLastProject(id: string): boolean {
		return id === this.lastProjectId;
	},

	// Méthode pour nettoyer le registre
	clear() {
		this.projects.clear();
		this.lastProjectId = null;
		clearScrollService();
	},
};

const ProjectCard = ({ project }: { project: ProjectWithCategories }) => {
	const [isOpen, setIsOpen] = React.useState(false);
	const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
	const [direction, setDirection] = React.useState(0);
	const ref = useRef<HTMLDivElement>(null);
	const projectId = project.slug?.current || project._id;

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

	// Enregistrer la position du projet lors du montage
	useEffect(() => {
		if (!ref.current) return;

		// Calculer la position verticale du projet dans le document
		const position = ref.current.getBoundingClientRect().top + window.scrollY;
		projectsRegistry.registerProject(projectId, ref.current, position);

		return () => {
			// Si tous les projets sont démontés, nettoyer le registre
			if (document.querySelectorAll("[data-project-id]").length === 1) {
				projectsRegistry.clear();
			}
		};
	}, [projectId]);

	useEffect(() => {
		if (!ref.current) return;

		// Détecter si c'est un appareil tactile
		const isTouchDevice =
			"ontouchstart" in window || navigator.maxTouchPoints > 0;
		const isMobile = window.innerWidth < 768;

		const observerOptions = {
			threshold: isTouchDevice
				? [0, 0.2, 0.4, 0.6, 0.8, 1.0]
				: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
			rootMargin: isMobile ? "-15% 0px" : "-20% 0px",
		};

		// Fonction pour calculer le pourcentage du projet visible dans la fenêtre
		const calculateVisibleRatio = (rect: DOMRectReadOnly): number => {
			const visibleTop = Math.max(0, rect.top);
			const visibleBottom = Math.min(window.innerHeight, rect.bottom);
			const visibleHeight = Math.max(0, visibleBottom - visibleTop);
			return visibleHeight / rect.height;
		};

		// Fonction pour calculer à quel point le projet est centré dans la vue
		const calculateCentrality = (rect: DOMRectReadOnly): number => {
			const projectCenter = rect.top + rect.height / 2;
			const viewportCenter = window.innerHeight / 2;
			const distanceFromCenter = Math.abs(projectCenter - viewportCenter);
			const maxDistance = window.innerHeight / 2;

			return 1 - Math.min(1, distanceFromCenter / maxDistance);
		};

		// Fonction pour déterminer si le projet est entrant par le haut
		const isEnteringFromTop = (rect: DOMRectReadOnly): boolean => {
			const topEdgePosition = rect.top;
			return topEdgePosition >= 0 && topEdgePosition < window.innerHeight * 0.3;
		};

		// Fonction pour vérifier si on est au bas de la page
		const isNearBottomOfPage = (): boolean => {
			const scrollPosition = window.scrollY + window.innerHeight;
			const documentHeight = document.documentElement.scrollHeight;
			return documentHeight - scrollPosition < documentHeight * 0.1;
		};

		let lastEventTime = 0;
		let lastScrollY = window.scrollY;
		let scrollVelocity = 0;

		const observer = new IntersectionObserver((entries) => {
			const now = Date.now();
			const currentScrollY = window.scrollY;

			// Calculer la vélocité de scroll
			scrollVelocity = Math.abs(currentScrollY - lastScrollY);
			lastScrollY = currentScrollY;

			// Throttle adaptatif basé sur la vélocité de scroll
			const adaptiveThrottle =
				scrollVelocity > 300 ? 300 : isTouchDevice ? 200 : 100;

			if (now - lastEventTime < adaptiveThrottle) return;
			lastEventTime = now;

			for (const entry of entries) {
				const boundingRect = entry.boundingClientRect;
				const visibleRatio = calculateVisibleRatio(boundingRect);
				const centrality = calculateCentrality(boundingRect);
				const enteringFromTop = isEnteringFromTop(boundingRect);
				const isLastProject = projectsRegistry.isLastProject(projectId);
				const isAtBottom = isNearBottomOfPage();

				// Vérifier si on est au tout début de la page
				const isAtTopOfPage = window.scrollY < 100;
				const isFirstProject =
					projectsRegistry.projects.size > 0 &&
					Array.from(projectsRegistry.projects.entries()).sort(
						([, a], [, b]) => a.position - b.position,
					)[0][0] === projectId;

				// Calculer un score de visibilité unifié
				let visibilityScore = visibleRatio * 0.5 + centrality * 0.5;

				if (enteringFromTop) {
					visibilityScore += 0.2;
				}

				if (isLastProject && isAtBottom && visibleRatio > 0.2) {
					visibilityScore += 0.3;
				}

				// Bonus spécial pour le premier projet quand on est en haut de page
				if (isFirstProject && isAtTopOfPage && visibleRatio > 0.3) {
					visibilityScore += 0.4;
				}

				// Seuils plus élevés pour les appareils tactiles et les scrolls rapides
				const activeThreshold =
					(isTouchDevice ? 0.7 : 0.6) + (scrollVelocity > 200 ? 0.1 : 0);
				const visibilityThreshold = isTouchDevice ? 0.25 : 0.2;

				// Déterminer si le projet est actif
				const isActive =
					(centrality > activeThreshold && visibleRatio > 0.4) ||
					enteringFromTop ||
					(isLastProject && isAtBottom && visibleRatio > visibilityThreshold) ||
					(isFirstProject && isAtTopOfPage && visibleRatio > 0.3);

				// Toujours émettre l'événement si le projet est visible
				if (entry.isIntersecting && visibleRatio > 0.15) {
					const event = new CustomEvent("projectInView", {
						detail: {
							projectId,
							isActive,
							intersectionRatio: visibilityScore,
							centrality,
							visibleRatio,
							enteringFromTop,
						},
					});
					window.dispatchEvent(event);
				} else if (!entry.isIntersecting) {
					// Émettre un événement de sortie
					const event = new CustomEvent("projectInView", {
						detail: {
							projectId,
							isActive: false,
							intersectionRatio: 0,
							centrality: 0,
							visibleRatio: 0,
							enteringFromTop: false,
						},
					});
					window.dispatchEvent(event);
				}
			}
		}, observerOptions);

		observer.observe(ref.current);

		return () => {
			if (ref.current) {
				observer.unobserve(ref.current);
			}
		};
	}, [projectId]);

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
				playsInline
				autoPlay
				loop
				muted
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

// Media item component that handles both images and videos
interface MediaItemProps {
	item: NonNullable<Projects["gallery"]>[0];
	title?: string;
	className?: string;
	ratio?: "16/9" | "4/3" | "1/1" | "3/4" | "9/16" | "4/5";
	[key: string]: unknown;
}

const MediaItem = ({
	item,
	title,
	className,
	ratio = "16/9",
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
			// Get image URL using Sanity's urlFor
			src = urlFor(item).url();
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
			alt={item.alt || title || "Project image"}
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
					<div className="w-[108px] h-[61px] overflow-hidden">
						<MediaItem
							item={item}
							alt={item.alt || ""}
							draggable={false}
							className="w-full h-full cursor-pointer bg-white object-cover"
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

export { ProjectCard };
