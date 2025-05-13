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

// Function to generate image URLs from Sanity references
export function urlFor(source: { asset?: { _ref: string } } | string) {
	return builder.image(source);
}
