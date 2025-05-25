import { Image, type ImageProps } from "@/components/ui/image";

import { getLab } from "@/lib/queries/lab";
import { client } from "@/lib/sanity";
import { listStore } from "@/stores/list.store";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@tanstack/react-store";
import { type VariantProps, cva } from "class-variance-authority";
import clsx from "clsx";
import { useCallback, useMemo, useRef } from "react";
import type { Lab } from "studio/sanity.types";

interface CollectionItemType {
	id: string | number;
	image: string;
	altText?: string;
}

const imageWrapperVariants = cva(
	"flex items-center justify-center transition-all duration-300 ease-in-out",
	{
		variants: {
			size: {
				small: "h-[103.60px] w-[83px] md:h-[260px] md:w-52",
				medium: "h-[207px] w-[166px] md:h-[414.40px] md:w-[332px]",
				large: "max-h-screen min-h-none w-screen md:max-h-none md:min-h-screen",
			},
		},
		defaultVariants: {
			size: "small",
		},
	},
);

const imageVariants = cva(
	"object-cover transition-all duration-300 ease-in-out",
	{
		variants: {
			size: {
				small: "h-full w-full",
				medium: "h-full w-full",
				large: "min-h-screen min-w-screen object-cover",
			},
		},
		defaultVariants: {
			size: "small",
		},
	},
);

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
				"transition-all duration-300 ease-in-out",
				isSelected ? "z-50" : "z-0",
			)}
		>
			<Image
				id={`image-${String(id)}`}
				className={imageVariants({ size })}
				src={item.image}
				alt={item.altText || `Image ${item.id}`}
				ratio={imageRatio}
			/>
		</div>
	);
};

const listContainerVariants = cva(
	"relative flex w-full flex-col items-center",
	{
		variants: {
			spacing: {
				default: "gap-2",
				expanded: "gap-2",
				fullscreen: "",
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

	const scrollToImageImmediate = useCallback(
		(imageId: string | number, sizeState: number) => {
			const element = document.getElementById(`image-wrapper-${imageId}`);

			if (sizeState === 0) {
				// Retour à small - restaurer position originale
				const originalY = scrollStateRef.current?.originalScrollY || 0;
				window.scrollTo({
					top: originalY,
					behavior: "instant",
				});
			} else if (sizeState === 1) {
				element?.scrollIntoView({
					behavior: "instant",
					block: "start",
					inline: "nearest",
				});
			} else if (sizeState === 2) {
				const rect = element?.getBoundingClientRect();
				if (!rect) return;

				const currentScrollY = window.scrollY;

				// Informations sur la position de l'image dans la liste
				const imageIndex = collection.findIndex((item) => item.id === imageId);
				const totalImages = collection.length;
				const isLastTwoImages = imageIndex >= totalImages - 2;

				// Calculer les dimensions du document
				const documentHeight = Math.max(
					document.body.scrollHeight,
					document.documentElement.scrollHeight,
				);
				const windowHeight = window.innerHeight;
				const maxScroll = Math.max(0, documentHeight - windowHeight);

				// Calculer la position cible
				let targetScroll = currentScrollY + rect.top;

				// Pour les dernières images, utiliser une approche différente
				if (isLastTwoImages) {
					// Essayer de centrer l'image dans la vue
					const centerOffset = (windowHeight - rect.height) / 2;
					targetScroll = currentScrollY + rect.top - centerOffset;

					// Si ça dépasse encore, utiliser scrollIntoView
					if (targetScroll > maxScroll || targetScroll < 0) {
						element?.scrollIntoView({
							behavior: "instant",
							block: "center",
							inline: "nearest",
						});

						return;
					}
				}

				// Limiter le scroll aux bornes du document
				targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));
				window.scrollTo({
					top: targetScroll,
					behavior: "instant",
				});

				// Vérifier le résultat final
				setTimeout(() => {}, 10);
			}
		},
		[],
	);

	const handleImageClick = useCallback(
		(e: React.MouseEvent, clickedId: string | number) => {
			e.preventDefault();
			e.stopPropagation();

			const currentScrollY = window.scrollY;

			if (selectedId === clickedId) {
				const nextState = (currentGlobalSizeState + 1) % 3;

				if (nextState === 0) {
					listStore.setState((prev) => ({
						...prev,
						currentGlobalSizeState: 0,
						selectedId: null,
					}));
				} else {
					listStore.setState((prev) => ({
						...prev,
						currentGlobalSizeState: nextState,
					}));
				}

				setTimeout(() => {
					scrollToImageImmediate(clickedId, nextState);
				}, 0);
			} else {
				scrollStateRef.current = {
					imageId: clickedId,
					originalScrollY: currentScrollY,
				};

				listStore.setState((prev) => ({
					...prev,
					currentGlobalSizeState: 1,
					selectedId: clickedId,
				}));

				setTimeout(() => {
					scrollToImageImmediate(clickedId, 1);
				}, 0);
			}
		},
		[selectedId, currentGlobalSizeState, scrollToImageImmediate],
	);

	return (
		<div ref={containerRef} className={listContainerVariants({ spacing })}>
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
		</div>
	);
};
