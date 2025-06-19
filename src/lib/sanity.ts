import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

export const client = createClient({
	projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
	dataset: import.meta.env.VITE_SANITY_DATASET,
	useCdn: import.meta.env.VITE_SANITY_USE_CDN !== "false",
	apiVersion: import.meta.env.VITE_SANITY_API_VERSION,
	token: import.meta.env.VITE_SANITY_TOKEN,
});

// Set up the image URL builder
const builder = imageUrlBuilder(client);

// Function to generate optimized image URLs from Sanity references
export function urlFor(source: { asset?: { _ref: string } } | string) {
	return builder.image(source);
}

// Optimized image URL functions for different use cases
export function urlForThumbnail(source: { asset?: { _ref: string } } | string) {
	return builder
		.image(source)
		.width(400)
		.height(300)
		.fit("crop")
		.quality(85)
		.format("webp")
		.auto("format"); // Laisse Sanity choisir le meilleur format
}

export function urlForGallery(source: { asset?: { _ref: string } } | string) {
	return builder
		.image(source)
		.width(1200)
		.quality(90)
		.format("webp")
		.auto("format");
}

export function urlForMobile(source: { asset?: { _ref: string } } | string) {
	return builder
		.image(source)
		.width(600)
		.quality(85)
		.format("webp")
		.auto("format");
}

export function urlForLab(
	source: { asset?: { _ref: string } } | string,
	size: "small" | "medium" | "large" = "medium",
) {
	const sizes = {
		small: 300,
		medium: 500,
		large: 800,
	};

	return builder
		.image(source)
		.width(sizes[size])
		.quality(85)
		.format("webp")
		.auto("format");
}

// Nouvelle fonction pour les thumbnails ultra-optimisés
export function urlForThumbnailMini(
	source: { asset?: { _ref: string } } | string,
) {
	return builder
		.image(source)
		.width(200)
		.height(150)
		.fit("crop")
		.quality(75)
		.format("webp")
		.auto("format");
}

// Nouvelle fonction pour le lazy loading avec placeholder
export function urlForPlaceholder(
	source: { asset?: { _ref: string } } | string,
) {
	return builder
		.image(source)
		.width(100)
		.height(75)
		.fit("crop")
		.quality(40)
		.format("webp")
		.blur(20)
		.auto("format");
}

// Fonction pour obtenir l'image originale sans aucune transformation
export function urlForOriginal(source: { asset?: { _ref: string } } | string) {
	return builder.image(source).url();
}
