import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

/**
 * Hook that ensures the language parameter is always present in the URL
 * and appears as the first parameter
 */
export const useEnsureLanguageParam = () => {
	const { i18n } = useTranslation();
	const router = useRouter();

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

				return true; // URL a été modifiée
			}

			// Si le paramètre lang est présent mais ne correspond pas à la langue actuelle
			if (langParam !== currentLang) {
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

					return true; // URL a été modifiée
				}
			}

			return false; // URL n'a pas été modifiée
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
	}, [i18n, router]);

	// Fonction utilitaire pour ajouter le paramètre lang à une URL
	const addLangToUrl = (url: string): string => {
		const urlObj = new URL(url, window.location.origin);
		const currentLang = i18n.language.startsWith("en") ? "en" : "fr";

		// Collecter tous les paramètres actuels
		const params = Array.from(urlObj.searchParams.entries());

		// Supprimer tous les paramètres
		urlObj.search = "";

		// Ajouter lang en premier
		urlObj.searchParams.set("lang", currentLang);

		// Réajouter les autres paramètres
		for (const [key, value] of params) {
			if (key !== "lang") {
				urlObj.searchParams.append(key, value);
			}
		}

		return urlObj.toString();
	};

	return { addLangToUrl };
};
