import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import * as TanstackQuery from "./integrations/tanstack-query/root-provider";

// Import i18n configuration
import i18next from "i18next";
import "./i18n";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import "./styles.css";
import { LanguageParamProvider } from "@/providers/language-provider";
import reportWebVitals from "./reportWebVitals.ts";

// Force language parameter in URL if not present
const ensureLanguageInUrl = () => {
	const url = new URL(window.location.href);
	const langParam = url.searchParams.get("lang");

	// If no lang parameter is present, add it based on detected language or default to French
	if (!langParam) {
		const currentLang = i18next.language.startsWith("en") ? "en" : "fr";
		url.searchParams.set("lang", currentLang);
		window.history.replaceState({}, "", url.toString());
	}
};

// Ensure language parameter is in URL
ensureLanguageInUrl();

// Fonction pour réorganiser les paramètres d'URL avec lang en premier
const reorderUrlParams = (url: URL): URL => {
	const searchParams = url.searchParams;
	const langParam = searchParams.get("lang");
	const currentLang =
		langParam || (i18next.language.startsWith("en") ? "en" : "fr");

	// Collecter tous les paramètres actuels
	const params = Array.from(searchParams.entries());

	// Créer une nouvelle URL avec les mêmes propriétés
	const newUrl = new URL(url.toString());

	// Supprimer tous les paramètres
	newUrl.search = "";

	// Ajouter lang en premier
	newUrl.searchParams.set("lang", currentLang);

	// Réajouter les autres paramètres dans un ordre spécifique
	// D'abord project si présent
	const projectParam = searchParams.get("project");
	if (projectParam) {
		newUrl.searchParams.append("project", projectParam);
	}

	// Ensuite category si présent
	const categoryParam = searchParams.get("category");
	if (categoryParam) {
		newUrl.searchParams.append("category", categoryParam);
	}

	// Puis tous les autres paramètres
	for (const [key, value] of params) {
		if (key !== "lang" && key !== "project" && key !== "category") {
			newUrl.searchParams.append(key, value);
		}
	}

	return newUrl;
};

// Intercepter toutes les modifications d'URL
const originalPushState = window.history.pushState;
const originalReplaceState = window.history.replaceState;

// Remplacer pushState pour s'assurer que lang est toujours en premier
window.history.pushState = function (
	data: unknown,
	unused: string,
	url?: string | URL,
) {
	// Appeler la fonction originale
	const result = originalPushState.call(this, data, unused, url);

	// Vérifier et réorganiser les paramètres si nécessaire
	const currentUrl = new URL(window.location.href);
	const queryString = currentUrl.search;

	if (queryString && !queryString.startsWith("?lang=")) {
		const newUrl = reorderUrlParams(currentUrl);
		originalReplaceState.call(this, data, unused, newUrl.toString());
	}

	return result;
};

// Remplacer replaceState pour s'assurer que lang est toujours en premier
window.history.replaceState = function (
	data: unknown,
	unused: string,
	url?: string | URL,
) {
	// Appeler la fonction originale
	const result = originalReplaceState.call(this, data, unused, url);

	// Vérifier et réorganiser les paramètres si nécessaire
	const currentUrl = new URL(window.location.href);
	const queryString = currentUrl.search;

	if (queryString && !queryString.startsWith("?lang=")) {
		const newUrl = reorderUrlParams(currentUrl);
		originalReplaceState.call(this, data, unused, newUrl.toString());
	}

	return result;
};

// Create a new router instance
const router = createRouter({
	routeTree,
	context: {
		...TanstackQuery.getContext(),
	},
	defaultPreload: "intent",
	scrollRestoration: true,
	defaultStructuralSharing: true,
	defaultPreloadStaleTime: 0,
	// @ts-expect-error - L'option transformSearchParams n'est pas encore typée dans la version actuelle
	transformSearchParams: {
		parse: (params: string) => {
			const searchParams = Object.fromEntries(new URLSearchParams(params));

			// If lang parameter is present, set the language
			if (
				searchParams.lang &&
				(searchParams.lang === "fr" || searchParams.lang === "en")
			) {
				i18next.changeLanguage(searchParams.lang);
			} else {
				// If no lang parameter, add it to the URL
				const currentLang = i18next.language.startsWith("en") ? "en" : "fr";
				searchParams.lang = currentLang;
			}

			return searchParams;
		},
		serialize: (params: Record<string, string>) => {
			// Ensure lang parameter is always included
			if (!params.lang || (params.lang !== "fr" && params.lang !== "en")) {
				params.lang = i18next.language.startsWith("en") ? "en" : "fr";
			}

			// Construire manuellement la chaîne de requête pour s'assurer que lang est en premier
			let searchString = `lang=${params.lang}`;

			// Ajouter les autres paramètres dans un ordre spécifique
			// D'abord project si présent
			if (params.project) {
				searchString += `&project=${params.project}`;
			}

			// Ensuite category si présent
			if (params.category) {
				searchString += `&category=${params.category}`;
			}

			// Puis tous les autres paramètres
			for (const [key, value] of Object.entries(params)) {
				if (
					key !== "lang" &&
					key !== "project" &&
					key !== "category" &&
					value !== undefined &&
					value !== null &&
					value !== ""
				) {
					searchString += `&${key}=${encodeURIComponent(String(value))}`;
				}
			}

			// Ne pas ajouter de point d'interrogation si la chaîne est vide
			return searchString ? `?${searchString}` : "";
		},
	},
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

// Render the app
const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<StrictMode>
			<TanstackQuery.Provider>
				<RouterProvider
					router={router}
					// Wrap the router with the LanguageParamProvider
					defaultComponent={({ children }) => (
						<LanguageParamProvider>{children}</LanguageParamProvider>
					)}
				/>
			</TanstackQuery.Provider>
		</StrictMode>,
	);
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
