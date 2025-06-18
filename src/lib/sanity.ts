import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

export const client = createClient({
	projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
	dataset: import.meta.env.VITE_SANITY_DATASET,
	useCdn: import.meta.env.VITE_SANITY_USE_CDN === "true",
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
		.quality(80)
		.format("webp");
}

export function urlForGallery(source: { asset?: { _ref: string } } | string) {
	return builder.image(source).width(800).quality(85).format("webp");
}

export function urlForMobile(source: { asset?: { _ref: string } } | string) {
	return builder.image(source).width(600).quality(80).format("webp");
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

	return builder.image(source).width(sizes[size]).quality(75).format("webp");
}
