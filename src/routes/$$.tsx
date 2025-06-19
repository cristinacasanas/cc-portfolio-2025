import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$$")({
	beforeLoad: () => {
		// Redirection vers la racine pour toutes les routes non trouvées
		throw redirect({
			to: "/",
			replace: true,
		});
	},
	component: () => null, // Ne devrait jamais être rendu
});
