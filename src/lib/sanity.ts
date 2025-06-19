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
		.width(300)
		.height(225)
		.fit("crop")
		.quality(75)
		.format("webp");
}

export function urlForGallery(source: { asset?: { _ref: string } } | string) {
	return builder.image(source).width(600).quality(80).format("webp");
}

export function urlForMobile(source: { asset?: { _ref: string } } | string) {
	return builder.image(source).width(400).quality(75).format("webp");
}

export function urlForLab(
	source: { asset?: { _ref: string } } | string,
	size: "small" | "medium" | "large" = "medium",
) {
	const sizes = {
		small: 200,
		medium: 350,
		large: 600,
	};

	return builder.image(source).width(sizes[size]).quality(70).format("webp");
}

// Nouvelle fonction pour les thumbnails ultra-optimisés
export function urlForThumbnailMini(
	source: { asset?: { _ref: string } } | string,
) {
	return builder
		.image(source)
		.width(150)
		.height(112)
		.fit("crop")
		.quality(60)
		.format("webp");
}

// Nouvelle fonction pour le lazy loading avec placeholder
export function urlForPlaceholder(
	source: { asset?: { _ref: string } } | string,
) {
	return builder
		.image(source)
		.width(50)
		.height(37)
		.fit("crop")
		.quality(30)
		.format("webp")
		.blur(20);
}
