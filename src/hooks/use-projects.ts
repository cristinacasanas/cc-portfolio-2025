import { CACHE_CONFIG, CACHE_KEYS } from "@/lib/cache-keys";
import {
	getAllProjects,
	getProjectById,
	getProjectsByCategory,
} from "@/lib/queries";
import { client } from "@/lib/sanity";
import { useQuery } from "@tanstack/react-query";
import type { Categories, Projects } from "studio/sanity.types";

type ProjectWithCategories = Projects & {
	expandedCategories?: Categories[];
};

export function useProjects(filters?: {
	category?: string;
	project?: string;
	thumbnailsOnly?: boolean;
}) {
	return useQuery({
		queryKey: CACHE_KEYS.PROJECTS(filters),
		queryFn: async (): Promise<ProjectWithCategories[]> => {
			// Projet spécifique
			if (filters?.project) {
				return client.fetch<ProjectWithCategories[]>(
					getProjectById(filters.project),
				);
			}

			// Projets par catégorie
			if (filters?.category) {
				return client.fetch<ProjectWithCategories[]>(
					getProjectsByCategory(filters.category),
				);
			}

			// Tous les projets (optimisé pour thumbnails si demandé)
			if (filters?.thumbnailsOnly) {
				return client.fetch<ProjectWithCategories[]>(
					`*[_type == "projects"] | order(orderRank) {
						_id,
						title,
						slug,
						thumbnail,
						"expandedCategories": categories[]-> {
							_id,
							title,
							slug
						}
					}`,
				);
			}

			// Tous les projets complets
			return client.fetch<ProjectWithCategories[]>(getAllProjects);
		},
		...CACHE_CONFIG.DYNAMIC,
	});
}
