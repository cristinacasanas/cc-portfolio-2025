import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Configuration ultra-aggressive pour portfolio
			staleTime: 6 * 60 * 60 * 1000, // 6 heures - projets changent très rarement
			gcTime: 48 * 60 * 60 * 1000, // 48 heures - cache très long terme
			refetchOnWindowFocus: false, // Jamais de refetch sur focus
			refetchOnMount: false, // Utilise toujours le cache
			refetchOnReconnect: "always", // Resync seulement après reconnexion
			refetchInterval: false, // Pas de polling
			retry: 1, // Un seul retry
			retryDelay: 1000, // Délai court entre retries
			networkMode: "online",
			// Optimisations avancées
			refetchIntervalInBackground: false,
			notifyOnChangeProps: "all", // Réactivité optimale
		},
		mutations: {
			retry: 0, // Pas de retry pour mutations
			networkMode: "online",
		},
	},
});

export function getContext() {
	return {
		queryClient,
	};
}

// Prefetch intelligent pour l'optimisation
export function prefetchCriticalData() {
	// Prefetch des projets principaux au démarrage
	queryClient.prefetchQuery({
		queryKey: ["projects", undefined],
		staleTime: 12 * 60 * 60 * 1000, // 12h
	});

	// Prefetch des catégories
	queryClient.prefetchQuery({
		queryKey: ["categories"],
		staleTime: 4 * 60 * 60 * 1000, // 4h
	});
}

export function Provider({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}
