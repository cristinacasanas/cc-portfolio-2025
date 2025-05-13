import { useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface LanguageParamProviderProps {
	children: ReactNode;
}

/**
 * Component that ensures the language parameter is always present in the URL
 */
export const LanguageParamProvider = ({
	children,
}: LanguageParamProviderProps) => {
	const router = useRouter();
	const navigate = useNavigate();
	const { i18n } = useTranslation();

	// Middleware pour intercepter toutes les navigations et s'assurer que lang est présent et en premier
	useEffect(() => {
		// Fonction pour vérifier et corriger l'URL
		const checkAndFixUrl = () => {
			const url = new URL(window.location.href);
			const searchParams = url.searchParams;
			const langParam = searchParams.get("lang");
			const currentLang = i18n.language.startsWith("en") ? "en" : "fr";

			// Si le paramètre lang n'est pas présent ou n'est pas valide, le corriger
			if (!langParam || (langParam !== "fr" && langParam !== "en")) {
				// Reconstruire l'URL avec lang en premier
				const newUrl = new URL(window.location.href);
				const oldParams = Array.from(newUrl.searchParams.entries());

				// Supprimer tous les paramètres
				newUrl.search = "";

				// Ajouter lang en premier
				newUrl.searchParams.set("lang", currentLang);

				// Réajouter les autres paramètres (sauf lang qui est déjà ajouté)
				for (const [key, value] of oldParams) {
					if (key !== "lang") {
						newUrl.searchParams.append(key, value);
					}
				}

				// Remplacer l'URL sans recharger la page
				window.history.replaceState({}, "", newUrl.toString());

				// Mettre à jour la langue dans i18next
				i18n.changeLanguage(currentLang);
			} else if (langParam !== currentLang) {
				// Si le paramètre lang est présent mais ne correspond pas à la langue actuelle
				i18n.changeLanguage(langParam);
			}

			// Vérifier si lang est le premier paramètre
			const urlString = window.location.href;
			const queryStart = urlString.indexOf("?");

			if (queryStart !== -1) {
				const queryString = urlString.substring(queryStart + 1);
				if (!queryString.startsWith("lang=")) {
					// Reconstruire l'URL avec lang en premier
					const newUrl = new URL(window.location.href);
					const oldParams = Array.from(newUrl.searchParams.entries());

					// Supprimer tous les paramètres
					newUrl.search = "";

					// Ajouter lang en premier
					// Utiliser une valeur sûre pour langParam (non null)
					const safeLanguage = langParam || currentLang;
					newUrl.searchParams.set("lang", safeLanguage);

					// Réajouter les autres paramètres (sauf lang qui est déjà ajouté)
					for (const [key, value] of oldParams) {
						if (key !== "lang") {
							newUrl.searchParams.append(key, value);
						}
					}

					// Remplacer l'URL sans recharger la page
					window.history.replaceState({}, "", newUrl.toString());
				}
			}
		};

		// Vérifier l'URL au chargement initial
		checkAndFixUrl();

		// Ajouter un écouteur d'événements pour les changements d'URL
		const handleUrlChange = () => {
			checkAndFixUrl();
		};

		// Écouter les événements de navigation
		window.addEventListener("popstate", handleUrlChange);

		// Utiliser l'API correcte pour écouter les changements de navigation
		const unsubscribe = router.subscribe("onBeforeLoad", () => {
			setTimeout(checkAndFixUrl, 0);
		});

		// Nettoyer les écouteurs d'événements
		return () => {
			window.removeEventListener("popstate", handleUrlChange);
			unsubscribe();
		};
	}, [router, i18n]);

	return <>{children}</>;
};
