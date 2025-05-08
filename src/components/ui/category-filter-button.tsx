import { useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import React from "react";
import { useTranslation } from "react-i18next";
import type { Category } from "studio/sanity.types";

type CategoryFilterButtonProps = {
	category: Category | "all";
	className?: string;
};

export const CategoryFilterButton: React.FC<CategoryFilterButtonProps> = ({
	category,
	className = "",
}) => {
	const navigate = useNavigate();
	const router = useRouter();
	const { i18n } = useTranslation();
	const { category: selectedCategory, project } = useSearch({ from: "/" });

	const handleClick = () => {
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
		if (category !== "all") {
			search.category = category.slug?.current || category._id;
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
	};

	// Determine if this button is active
	const isActive = React.useMemo(() => {
		if (category === "all") {
			return !selectedCategory;
		}
		return selectedCategory === (category.slug?.current || category._id);
	}, [category, selectedCategory]);

	const title = React.useMemo(() => {
		if (category === "all") {
			return "Tous";
		}
		return category.title?.fr || category.title?.en || "";
	}, [category]);

	return (
		<button
			type="button"
			onClick={handleClick}
			className={`font-mono uppercase leading-none ${isActive ? "text-text-primary font-bold" : "text-text-secondary"} ${className}`}
		>
			{title}
		</button>
	);
};
