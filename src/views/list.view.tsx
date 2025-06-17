import { Image, type ImageProps } from "@/components/ui/image";

import { getLab } from "@/lib/queries/lab";
import { client } from "@/lib/sanity";
import { listStore } from "@/stores/list.store";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@tanstack/react-store";
import { type VariantProps, cva } from "class-variance-authority";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Lab } from "studio/sanity.types";

interface CollectionItemType {
	id: string | number;
	image: string;
	altText?: string;
}

const imageWrapperVariants = cva("flex items-center justify-center", {
	variants: {
		size: {
			small: "h-[103.60px] w-[83px] md:h-[260px] md:w-52",
			medium: "h-[207px] w-[166px] md:h-[414.40px] md:w-[332px]",
			large: "min-h-screen w-screen md:min-h-[100vh] md:w-screen",
		},
	},
	defaultVariants: {
		size: "small",
	},
});

const imageVariants = cva("object-cover", {
	variants: {
		size: {
			small: "h-full w-full",
			medium: "h-full w-full",
			large: "min-h-screen w-full object-cover",
		},
	},
	defaultVariants: {
		size: "small",
	},
});

interface SizedImageDisplayProps
	extends VariantProps<typeof imageWrapperVariants> {
	id: string | number;
	item: CollectionItemType;
	sizeState: number;
	isSelected: boolean;
}

const SizedImageDisplay = ({
	id,
	item,
	sizeState,
	isSelected,
}: SizedImageDisplayProps) => {
	const size = sizeState === 0 ? "small" : sizeState === 1 ? "medium" : "large";
	const imageRatio: ImageProps["ratio"] = size === "small" ? "4/5" : undefined;

	return (
		<div
			id={`image-wrapper-${String(id)}`}
			className={clsx(
				imageWrapperVariants({ size }),
				isSelected ? "z-50" : "z-0",
				"transition-all duration-500 ease-out",
			)}
		>
			<Image
				id={`image-${String(id)}`}
				className={clsx(
					imageVariants({ size }),
					"transition-all duration-500 ease-out",
				)}
				src={item.image}
				alt={item.altText || `Image ${item.id}`}
				ratio={imageRatio}
			/>
		</div>
	);
};

const listContainerVariants = cva(
	"relative flex w-full flex-col items-center pb-28",
	{
		variants: {
			spacing: {
				default: "gap-2",
				expanded: "gap-2",
				fullscreen: "gap-0",
			},
		},
		defaultVariants: {
			spacing: "default",
		},
	},
);

interface ScrollState {
	imageId: string | number;
	originalScrollY: number;
}

export const ListView = () => {
	const containerRef = useRef<HTMLDivElement>(null);
	const { currentGlobalSizeState, selectedId } = useStore(listStore);
	const scrollStateRef = useRef<ScrollState | null>(null);
	const pendingScrollRef = useRef<string | number | null>(null);

	const { data } = useQuery({
		queryKey: ["lab"],
		queryFn: async () => {
			const data = await client.fetch<Lab[]>(getLab);
			return data;
		},
	});

	// Flatten all images from all lab entries and create collection format
	const collection = useMemo(() => {
		if (!data) return [];
		return data.flatMap(
			(lab, labIndex) =>
				lab.images
					?.map((img, index) => ({
						id: `lab-${labIndex}-${index}`,
						image: (img as { asset?: { url?: string } }).asset?.url || "",
						altText: `Lab image ${index}`,
					}))
					.filter((item) => item.image) || [],
		);
	}, [data]);

	const spacing =
		currentGlobalSizeState === 0
			? "default"
			: currentGlobalSizeState === 1
				? "expanded"
				: "fullscreen";

	// Effect pour gérer le scroll quand l'état change
	useEffect(() => {
		if (
			pendingScrollRef.current &&
			(currentGlobalSizeState === 1 || currentGlobalSizeState === 2)
		) {
			const imageId = pendingScrollRef.current;
			pendingScrollRef.current = null;

			// Use a proper ScrollBehavior instead of "instant"
			const element = document.getElementById(`image-wrapper-${imageId}`);
			if (element) {
				element.scrollIntoView({
					behavior: "auto", // Use "auto" instead of "instant" for better compatibility
					block: currentGlobalSizeState === 2 ? "start" : "center",
					inline: "nearest",
				});

				// Changer selectedId immédiatement aussi
				listStore.setState((prev) => ({
					...prev,
					selectedId: imageId,
				}));
			}
		}
	}, [currentGlobalSizeState]);

	const handleImageClick = useCallback(
		(e: React.MouseEvent<HTMLButtonElement>, clickedId: string | number) => {
			e.preventDefault();
			e.stopPropagation();

			const currentScrollY = window.scrollY;

			// Étape 1: Aucune image sélectionnée → zoom moyen sur l'image cliquée
			if (currentGlobalSizeState === 0) {
				scrollStateRef.current = {
					imageId: clickedId,
					originalScrollY: currentScrollY,
				};

				pendingScrollRef.current = clickedId;

				listStore.setState((prev) => ({
					...prev,
					currentGlobalSizeState: 1,
					selectedId: clickedId, // On peut le faire immédiatement pour l'étape 1
				}));
				return;
			}

			// Étape 2: Zoom moyen → fullscreen sur l'image cliquée
			if (currentGlobalSizeState === 1) {
				pendingScrollRef.current = clickedId;

				listStore.setState((prev) => ({
					...prev,
					currentGlobalSizeState: 2,
					// On ne change pas selectedId ici, ça sera fait dans l'useEffect après le scroll
				}));
				return;
			}

			// Étape 3: Fullscreen → retour au zoom minimal
			if (currentGlobalSizeState === 2) {
				pendingScrollRef.current = null;

				listStore.setState((prev) => ({
					...prev,
					currentGlobalSizeState: 0,
					selectedId: null,
				}));

				// Retour à la position originale immédiatement
				if (scrollStateRef.current?.originalScrollY !== undefined) {
					window.scrollTo({
						top: scrollStateRef.current?.originalScrollY || 0,
						behavior: "auto", // Use standard "auto" instead of "instant"
					});
					scrollStateRef.current = null;
				}
				return;
			}
		},
		[currentGlobalSizeState],
	);

	return (
		<motion.div
			ref={containerRef}
			className={listContainerVariants({ spacing })}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3 }}
		>
			{collection.map((item) => (
				<button
					key={item.id}
					type="button"
					onClick={(e) => handleImageClick(e, item.id)}
					className="m-0 cursor-pointer appearance-none border-0 bg-transparent p-0"
				>
					<SizedImageDisplay
						id={item.id}
						item={item}
						sizeState={currentGlobalSizeState}
						isSelected={selectedId === item.id}
					/>
				</button>
			))}
		</motion.div>
	);
};
