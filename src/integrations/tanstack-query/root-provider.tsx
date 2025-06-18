import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 2 * 60 * 1000, // 2 minutes - suffisant pour éviter les requêtes répétées
			gcTime: 10 * 60 * 1000, // 10 minutes - cache raisonnable
			refetchOnWindowFocus: false, // Évite les refetch automatiques
			refetchOnMount: true, // Permet le refetch au montage pour charger les données
			refetchOnReconnect: false, // Évite les refetch à la reconnexion
			retry: 2, // 2 tentatives en cas d'échec
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
