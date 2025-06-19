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
		.quality(80)
		.format("webp")
		.auto("format"); // Let Sanity choose the best format (WebP/AVIF)
}

export function urlForGallery(source: { asset?: { _ref: string } } | string) {
	return builder
		.image(source)
		.width(1200)
		.height(675) // 16:9 aspect ratio
		.fit("crop")
		.quality(85)
		.format("webp")
		.auto("format");
}

export function urlForMobile(source: { asset?: { _ref: string } } | string) {
	return builder
		.image(source)
		.width(600)
		.height(337) // 16:9 aspect ratio
		.fit("crop")
		.quality(80)
		.format("webp")
		.auto("format");
}

export function urlForLab(
	source: { asset?: { _ref: string } } | string,
	size: "small" | "medium" | "large" = "medium",
) {
	const sizes = {
		small: { width: 300, height: 300 },
		medium: { width: 500, height: 500 },
		large: { width: 800, height: 800 },
	};

	const { width, height } = sizes[size];

	return builder
		.image(source)
		.width(width)
		.height(height)
		.fit("crop")
		.quality(80)
		.format("webp")
		.auto("format");
}

// High quality version for important images (like hero/LCP)
export function urlForHero(source: { asset?: { _ref: string } } | string) {
	return builder
		.image(source)
		.width(1920)
		.height(1080)
		.fit("crop")
		.quality(90)
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
		.quality(30)
		.format("webp")
		.blur(20)
		.auto("format");
}

export function urlForOriginal(source: { asset?: { _ref: string } } | string) {
	return builder.image(source).quality(95).format("webp").auto("format");
}
