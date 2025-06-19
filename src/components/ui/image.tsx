import { urlForPlaceholder } from "@/lib/sanity";
import type { ImageUrlBuilder } from "@sanity/image-url/lib/types/builder";
import { type VariantProps, cva } from "class-variance-authority";
import clsx from "clsx";
import { type ForwardedRef, forwardRef, useState } from "react";

export interface ImageProps
	extends Omit<React.ComponentPropsWithoutRef<"img">, "src"> {
	src?: string | ImageUrlBuilder;
	alt: string;
	ratio?: AspectRatio;
	imageClassName?: string;
	usePlaceholder?: boolean; // Nouvelle prop pour activer les placeholders
}

export type AspectRatio =
	| "1/1"
	| "16/9"
	| "21/9"
	| "4/3"
	| "3/4"
	| "4/5"
	| "5/4"
	| "2/3"
	| "3/2"
	| "9/16";

const imageVariants = cva("w-full h-full object-cover", {
	variants: {
		ratio: {
			"1/1": "aspect-[1/1]",
			"16/9": "aspect-[16/9]",
			"21/9": "aspect-[21/9]",
			"4/3": "aspect-[4/3]",
			"3/4": "aspect-[3/4]",
			"4/5": "aspect-[4/5]",
			"5/4": "aspect-[5/4]",
			"2/3": "aspect-[2/3]",
			"3/2": "aspect-[3/2]",
			"9/16": "aspect-[9/16]",
		},
	},
	defaultVariants: {
		ratio: "4/5",
	},
});

export interface ImageWrapperProps extends VariantProps<typeof imageVariants> {
	className?: string;
}

function getImageSrc(src?: string | ImageUrlBuilder): string {
	if (!src) return "";

	if (typeof src === "string") {
		return src;
	}

	// Handle ImageUrlBuilder object
	if (src && typeof src === "object" && "url" in src) {
		return src.url();
	}

	return "";
}

// Fonction pour obtenir un placeholder optimisé
function getPlaceholderSrc(src?: string | ImageUrlBuilder): string {
	if (!src) return "";

	if (typeof src === "string") {
		// Si c'est déjà une URL, essayer de générer un placeholder via Sanity
		try {
			// Extraire le asset ID si possible et générer un placeholder
			const assetMatch = src.match(/image-([a-zA-Z0-9]+)-/);
			if (assetMatch) {
				return urlForPlaceholder({ asset: { _ref: assetMatch[0] } }).url();
			}
		} catch {
			// Si ça échoue, retourner une image très petite
			return `${src}?w=50&h=37&fit=crop&q=30&blur=20`;
		}
	}

	// Handle ImageUrlBuilder object
	if (src && typeof src === "object" && "url" in src) {
		try {
			// Convertir en string d'abord pour eviter l'erreur de type
			const srcString = src.url();
			return urlForPlaceholder({ asset: { _ref: srcString } }).url();
		} catch {
			return `${src.url()}?w=50&h=37&fit=crop&q=30&blur=20`;
		}
	}

	return "";
}

export const Image = forwardRef<HTMLImageElement, ImageProps>(
	(
		{
			className,
			imageClassName,
			ratio = "4/5",
			src,
			alt,
			usePlaceholder = true,
			loading = "lazy", // Lazy loading par défaut
			decoding = "async", // Décodage asynchrone par défaut
			...props
		},
		ref: ForwardedRef<HTMLImageElement>,
	) => {
		const [imageLoaded, setImageLoaded] = useState(false);
		const [imageError, setImageError] = useState(false);

		const imageSrc = getImageSrc(src);
		const placeholderSrc = usePlaceholder ? getPlaceholderSrc(src) : "";

		// Si pas de src, ne pas afficher l'image
		if (!imageSrc) {
			return null;
		}

		return (
			<div className={clsx(imageVariants({ ratio }), className)}>
				{/* Placeholder visible pendant le chargement */}
				{usePlaceholder && placeholderSrc && !imageLoaded && !imageError && (
					<img
						src={placeholderSrc}
						alt="Loading placeholder"
						className={clsx(
							"absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
							imageClassName,
						)}
						loading="eager" // Charger le placeholder immédiatement
						decoding="sync"
					/>
				)}

				{/* Image principale */}
				<img
					ref={ref}
					src={imageSrc}
					alt={alt}
					className={clsx(
						"w-full h-full object-cover transition-opacity duration-300",
						imageLoaded ? "opacity-100" : "opacity-0",
						imageClassName,
					)}
					loading={loading}
					decoding={decoding}
					onLoad={() => setImageLoaded(true)}
					onError={() => setImageError(true)}
					{...props}
				/>
			</div>
		);
	},
);
