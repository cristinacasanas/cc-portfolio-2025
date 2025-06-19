import { CACHE_CONFIG, CACHE_KEYS } from "@/lib/cache-keys";
import {
	getAllProjects,
	getProjectById,
	getProjectsByCategory,
} from "@/lib/queries";
import { client } from "@/lib/sanity";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

export function useProjectsPrefetch() {
	const queryClient = useQueryClient();

	const prefetchProject = (projectId: string) => {
		queryClient.prefetchQuery({
			queryKey: CACHE_KEYS.PROJECTS({ project: projectId }),
			queryFn: () => client.fetch(getProjectById(projectId)),
			staleTime: 12 * 60 * 60 * 1000,
			gcTime: 7 * 24 * 60 * 60 * 1000,
		});
	};

	const prefetchCategory = (category: string) => {
		queryClient.prefetchQuery({
			queryKey: CACHE_KEYS.PROJECTS({ category }),
			queryFn: () => client.fetch(getProjectsByCategory(category)),
			staleTime: 12 * 60 * 60 * 1000,
			gcTime: 7 * 24 * 60 * 60 * 1000,
		});
	};

	return { prefetchProject, prefetchCategory };
}
