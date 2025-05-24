import { Image, type ImageProps } from "@/components/ui/image";
import { collection } from "@/mock/collection";
import { type VariantProps, cva } from "class-variance-authority";
import clsx from "clsx";
import { useCallback, useRef, useState } from "react";

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
				small: "w-52 h-[260px]",
				medium: "w-[624px] h-[780px]",
				large: "w-screen h-screen",
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
				large: "h-full w-full object-contain",
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
	"w-full flex flex-col items-center py-4 relative",
	{
		variants: {
			spacing: {
				default: "gap-2",
				expanded: "gap-8",
				fullscreen: "gap-8",
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
	const [selectedId, setSelectedId] = useState<string | number | null>(null);
	const [currentGlobalSizeState, setCurrentGlobalSizeState] = useState(0);
	const scrollStateRef = useRef<ScrollState | null>(null);

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
				// Medium - scroll vers le début de l'image

				// Debug pour medium
				const rect = element.getBoundingClientRect();

				element.scrollIntoView({
					behavior: "instant",
					block: "start",
					inline: "nearest",
				});

				// Vérifier après scroll
				setTimeout(() => {
					const newRect = element.getBoundingClientRect();
				}, 10);
			} else if (sizeState === 2) {
				const rect = element.getBoundingClientRect();
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
						element.scrollIntoView({
							behavior: "instant",
							block: "center",
							inline: "nearest",
						});

						// Vérifier le résultat
						setTimeout(() => {
							const finalRect = element.getBoundingClientRect();
						}, 10);

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
				setTimeout(() => {
					const finalRect = element.getBoundingClientRect();
				}, 10);
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
					setSelectedId(null);
					setCurrentGlobalSizeState(0);
				} else {
					setCurrentGlobalSizeState(nextState);
				}

				setTimeout(() => {
					scrollToImageImmediate(clickedId, nextState);
				}, 0);
			} else {
				scrollStateRef.current = {
					imageId: clickedId,
					originalScrollY: currentScrollY,
				};

				setSelectedId(clickedId);
				setCurrentGlobalSizeState(1);

				setTimeout(() => {
					scrollToImageImmediate(clickedId, 1);
				}, 0);
			}
		},
		[selectedId, currentGlobalSizeState, scrollToImageImmediate],
	);

	return (
		<div>
			<div ref={containerRef} className={listContainerVariants({ spacing })}>
				{collection.map((item, index) => (
					<button
						key={item.id}
						type="button"
						onClick={(e) => handleImageClick(e, item.id)}
						className="appearance-none bg-transparent border-0 p-0 m-0 cursor-pointer"
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
		</div>
	);
};
