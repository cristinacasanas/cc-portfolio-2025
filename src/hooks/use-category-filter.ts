import { useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

/**
 * Hook to handle category filtering via URL parameters
 */
export const useCategoryFilter = () => {
	const navigate = useNavigate();
	const router = useRouter();
	const { i18n } = useTranslation();
	const { category, project } = useSearch({ from: "/" });

	/**
	 * Filter projects by category
	 * @param categorySlug - The category slug to filter by, or "all" to show all projects
	 */
	const filterByCategory = useCallback(
		(categorySlug: string) => {
			// Récupérer la langue actuelle
			const currentLang = i18n.language.startsWith("en") ? "en" : "fr";

			// Récupérer les autres paramètres d'URL actuels
			const currentSearch = { ...router.state.location.search };

			// Créer un objet search avec lang en premier
			const search: Record<string, string> = {
				lang: currentLang,
			};

			// Ajouter project s'il existe
			if (project) {
				search.project = project;
			}

			// Ajouter category si ce n'est pas "all"
			if (categorySlug !== "all") {
				search.category = categorySlug;
			}

			// Ajouter les autres paramètres existants
			for (const [key, value] of Object.entries(currentSearch)) {
				if (
					key !== "lang" &&
					key !== "project" &&
					key !== "category" &&
					value !== undefined
				) {
					search[key] = value;
				}
			}

			navigate({
				to: "/",
				search,
				replace: true,
			});
		},
		[navigate, router, i18n, project],
	);

	/**
	 * Check if a category is currently selected
	 * @param categorySlug - The category slug to check
	 * @returns true if the category is selected
	 */
	const isCategorySelected = useCallback(
		(categorySlug?: string) => {
			if (categorySlug === "all" || !categorySlug) {
				return !category;
			}
			return category === categorySlug;
		},
		[category],
	);

	return {
		currentCategory: category,
		filterByCategory,
		isCategorySelected,
	};
};
