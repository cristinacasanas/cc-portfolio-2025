/**
 * Clés de cache centralisées pour TanStack Query
 */
export const CACHE_KEYS = {
	// Projects
	PROJECTS: (filters?: { category?: string; project?: string }) =>
		["projects", filters] as const,

	// Categories
	CATEGORIES: ["categories"] as const,

	// Lab
	LAB: ["lab"] as const,

	// Network
	NETWORK: ["network"] as const,

	// About
	ABOUT: ["about"] as const,
} as const;

/**
 * Configuration de cache par type de données
 */
export const CACHE_CONFIG = {
	// Données statiques (changent rarement)
	STATIC: {
		staleTime: 30 * 60 * 1000, // 30 minutes
		gcTime: 8 * 60 * 60 * 1000, // 8 heures
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		refetchOnReconnect: false,
	},

	// Données dynamiques (changent parfois)
	DYNAMIC: {
		staleTime: 15 * 60 * 1000, // 15 minutes
		gcTime: 4 * 60 * 60 * 1000, // 4 heures
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		refetchOnReconnect: false,
	},

	// Données fréquentes (changent souvent)
	FREQUENT: {
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 2 * 60 * 60 * 1000, // 2 heures
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		refetchOnReconnect: false,
	},
} as const;
