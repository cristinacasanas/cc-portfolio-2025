import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 10 * 60 * 1000, // 10 minutes - augmenté pour éviter les requêtes fréquentes
			gcTime: 60 * 60 * 1000, // 1 heure - cache plus long pour économiser la bande passante
			refetchOnWindowFocus: false, // Évite les refetch automatiques
			refetchOnMount: false, // Évite le refetch au montage si les données sont encore fraîches
			refetchOnReconnect: false, // Évite les refetch à la reconnexion
			retry: 1, // Réduit à 1 tentative pour éviter les requêtes multiples en cas d'échec
			networkMode: "online", // Ne fait des requêtes qu'en ligne
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
