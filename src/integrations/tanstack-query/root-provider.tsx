import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 20 * 60 * 1000, // 20 minutes - cache encore plus long
			gcTime: 4 * 60 * 60 * 1000, // 4 heures - conservation plus longue
			refetchOnWindowFocus: false,
			refetchOnMount: false,
			refetchOnReconnect: false,
			refetchInterval: false, // Désactive les refetch automatiques
			retry: 1,
			networkMode: "online",
			// Optimisation pour la persistance
			persister: undefined, // Permet d'ajouter une persistance locale plus tard
		},
		// Configuration pour les mutations
		mutations: {
			retry: 0, // Pas de retry pour les mutations
			networkMode: "online",
		},
	},
});

export function getContext() {
	return {
		queryClient,
	};
}

export function Provider({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}
