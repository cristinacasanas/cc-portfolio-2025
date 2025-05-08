import { urlFor } from "@/lib/sanity";
import { useNavigate, useSearch } from "@tanstack/react-router";
import clsx from "clsx";
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
	const { category } = useSearch({ from: "/" });

	const handleClick = () => {
		const projectId = item.slug?.current || item._id;

		// Créer un objet search qui ne contient que les paramètres non vides
		const search: Record<string, string> = {
			project: projectId,
		};

		// N'ajouter la catégorie que si elle existe
		if (category) {
			search.category = category;
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

	return (
		<button
			type="button"
			onClick={handleClick}
			className="block size-full cursor-pointer"
		>
			<Image
				className={clsx(className, "min-h-full min-w-full")}
				ratio="4/5"
				src={item.thumbnail?.asset?._ref ? urlFor(item.thumbnail).url() : ""}
				alt={item.title}
				draggable={false}
			/>
		</button>
	);
};
