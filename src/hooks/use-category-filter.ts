import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback } from "react";

/**
 * Hook to handle category filtering via URL parameters
 */
export const useCategoryFilter = () => {
	const navigate = useNavigate();
	const { category } = useSearch({ from: "/" });

	/**
	 * Filter projects by category
	 * @param categorySlug - The category slug to filter by, or "all" to show all projects
	 */
	const filterByCategory = useCallback(
		(categorySlug: string) => {
			if (categorySlug === "all") {
				// Clear the category filter
				navigate({
					to: "/",
					search: {
						category: undefined as unknown as string,
					},
					replace: true,
				});
			} else {
				// Apply category filter
				navigate({
					to: "/",
					search: {
						category: categorySlug,
					},
					replace: true,
				});
			}
		},
		[navigate],
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
