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
 * Configuration de cache optimisée pour portfolio
 */
export const CACHE_CONFIG = {
	// Projets Portfolio (ultra-statiques)
	STATIC: {
		staleTime: 12 * 60 * 60 * 1000, // 12 heures - projets quasi-immutables
		gcTime: 7 * 24 * 60 * 60 * 1000, // 7 jours - cache extrêmement long
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		refetchOnReconnect: "always", // Resync après déconnexion
		refetchInterval: false,
	},

	// Métadonnées (categories, about)
	DYNAMIC: {
		staleTime: 4 * 60 * 60 * 1000, // 4 heures - changent peu
		gcTime: 48 * 60 * 60 * 1000, // 48 heures - conservation longue
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		refetchOnReconnect: "always",
		refetchInterval: false,
	},

	// Lab/Network (plus dynamiques)
	FREQUENT: {
		staleTime: 60 * 60 * 1000, // 1 heure - données potentiellement changeantes
		gcTime: 12 * 60 * 60 * 1000, // 12 heures
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		refetchOnReconnect: "always",
		refetchInterval: false,
	},
} as const;
