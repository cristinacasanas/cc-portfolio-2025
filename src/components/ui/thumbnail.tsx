import { urlFor } from "@/lib/sanity";
import { useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import type { Project } from "studio/sanity.types";
import { Image } from "./image";

export const Thumbnail = ({
	item,
	className,
}: {
	item: Project;
	className?: string;
}) => {
	const navigate = useNavigate();
	const router = useRouter();
	const { i18n } = useTranslation();
	const { category } = useSearch({ from: "/" });

	const handleClick = () => {
		const projectId = item.slug?.current || item._id;

		// Récupérer la langue actuelle
		const currentLang = i18n.language.startsWith("en") ? "en" : "fr";

		// Récupérer les autres paramètres d'URL actuels
		const currentSearch = { ...router.state.location.search };

		// Créer un objet search avec lang en premier
		const search: Record<string, string> = {
			lang: currentLang,
			project: projectId,
		};

		// N'ajouter la catégorie que si elle existe
		if (category) {
			search.category = category;
		}

		// Ajouter les autres paramètres existants (sauf lang et project qui sont déjà définis)
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

		const projectElements = document.querySelectorAll("[data-project-id]");
		for (const element of projectElements) {
			if (element.getAttribute("data-project-id") === projectId) {
				element.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});
				break;
			}
		}
	};

	// Generate image URL with proper aspect ratio for mobile thumbnails
	const getImageUrl = () => {
		if (!item.thumbnail?.asset?._ref) return "";

		// Use Sanity's transformation API to enforce 4:5 aspect ratio
		return urlFor(item.thumbnail)
			.width(300) // Set a base width (will be responsively scaled by CSS)
			.height(375) // 4:5 ratio (300 * 5/4 = 375)
			.fit("crop")
			.url();
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			className="block h-full cursor-pointer"
		>
			<Image
				className={clsx(
					className,
					"min-h-full w-auto md:min-w-full md:max-w-full",
				)}
				ratio="4/5"
				src={getImageUrl()}
				alt={item.title}
				draggable={false}
			/>
		</button>
	);
};
