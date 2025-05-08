import { useNavigate, useSearch } from "@tanstack/react-router";
import React from "react";
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
	const { category: selectedCategory } = useSearch({ from: "/" });

	const handleClick = () => {
		if (category === "all") {
			navigate({
				to: "/",
				search: {
					category: undefined as unknown as string,
				},
				replace: true,
			});
		} else {
			navigate({
				to: "/",
				search: {
					category: category.slug?.current || category._id,
				},
				replace: true,
			});
		}
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
