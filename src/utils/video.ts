/**
 * Check if an item is a video based on Sanity's structure
 * Videos can be identified by their _type field or file reference pattern
 */
export const isVideo = (item: unknown): boolean => {
	// Handle null/undefined case
	if (!item) return false;

	// Type guard for objects
	if (typeof item !== "object") return false;
	const itemObj = item as Record<string, unknown>;

	// Check if it's explicitly defined as a video type
	if (itemObj._type === "video") return true;

	// Check if it's a file asset reference (for videos stored as files)
	if (
		itemObj.asset &&
		typeof itemObj.asset === "object" &&
		itemObj.asset !== null
	) {
		const asset = itemObj.asset as { _ref?: string };
		if (asset._ref?.startsWith("file-")) {
			return true;
		}
	}

	// For array fields where thumbnail might be an array
	if (Array.isArray(itemObj)) {
		// Check if any item in the array is a video
		return itemObj.some((subItem) => {
			if (!subItem || typeof subItem !== "object") return false;

			const sub = subItem as Record<string, unknown>;
			if (sub._type === "video") return true;

			const asset = sub.asset as { _ref?: string } | undefined;
			if (asset?._ref?.startsWith("file-")) return true;

			return false;
		});
	}

	return false;
};

/**
 * Generates a unique identifier for video assets
 * Helps prevent React key conflicts when the same video is used multiple times
 */
export const getUniqueVideoKey = (item: unknown, suffix = ""): string => {
	// Handle null/undefined case
	if (!item || typeof item !== "object") {
		return `video-undefined-${Date.now()}-${suffix}`;
	}

	const itemObj = item as Record<string, unknown>;

	// Check for asset reference
	if (
		itemObj.asset &&
		typeof itemObj.asset === "object" &&
		itemObj.asset !== null
	) {
		const asset = itemObj.asset as { _ref?: string };
		if (asset._ref) {
			return `video-${asset._ref}-${suffix}`;
		}
	}

	// Fallback
	return `video-undefined-${Date.now()}-${suffix}`;
};

/**
 * Converts a Sanity file reference to a proper URL
 * Uses a simple string replacement approach that works with all file formats
 */
export const getVideoUrl = (fileRef: string): string => {
	if (!fileRef) return "";

	// Extract project ID and dataset from environment variables
	const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
	const dataset = import.meta.env.VITE_SANITY_DATASET;

	if (!projectId || !dataset) {
		console.error("Missing Sanity project ID or dataset");
		return "";
	}

	// For file references, we need to:
	// 1. Remove the "file-" prefix
	// 2. Replace the extension marker (e.g., "-mp4") with a dot (e.g., ".mp4")
	const fileId = fileRef.replace(/^file-/, "");

	// Handle common video extensions
	const url = `https://cdn.sanity.io/files/${projectId}/${dataset}/${fileId}`
		.replace(/-mp4$/, ".mp4")
		.replace(/-webm$/, ".webm")
		.replace(/-ogg$/, ".ogg")
		.replace(/-mov$/, ".mov");

	return url;
};
