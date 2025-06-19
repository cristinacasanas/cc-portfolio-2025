import { CACHE_CONFIG, CACHE_KEYS } from "@/lib/cache-keys";
import {
	getAllProjects,
	getProjectById,
	getProjectsByCategory,
} from "@/lib/queries";
import { client } from "@/lib/sanity";
import { detectDevice, getOptimizedConfig } from "@/utils/device";
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
			// Use enhanced device detection
			const deviceInfo = detectDevice();
			const config = getOptimizedConfig(
				deviceInfo.isOldDevice,
				deviceInfo.isMobile,
			);

			// Projet spécifique
			if (filters?.project) {
				const projects = await client.fetch(getProjectById(filters.project));
				return projects || [];
			}

			// Catégorie spécifique
			if (filters?.category) {
				const projects = await client.fetch(
					getProjectsByCategory(filters.category),
				);
				return projects || [];
			}

			// Tous les projets avec optimisation mobile
			let queryString = getAllProjects;

			// More aggressive limitations on mobile
			if (deviceInfo.isMobile || deviceInfo.isLowEndDevice) {
				if (filters?.thumbnailsOnly) {
					queryString += `[0...${config.maxThumbnails}]`;
				} else {
					queryString += `[0...${config.maxProjects}]`;
				}
			} else if (deviceInfo.isOldDevice) {
				// Standard old device limitations
				if (filters?.thumbnailsOnly) {
					queryString += "[0...20]";
				} else {
					queryString += "[0...10]";
				}
			}

			const projects = await client.fetch(queryString);
			return projects || [];
		},
		...CACHE_CONFIG.STATIC, // Use STATIC config for projects
	});
}

export function useProject(projectId?: string) {
	const queryClient = useQueryClient();

	return useQuery({
		queryKey: CACHE_KEYS.PROJECTS({ project: projectId }),
		queryFn: async (): Promise<ProjectWithCategories | null> => {
			if (!projectId) return null;

			// Try to get from cache first
			const cachedProjects = queryClient.getQueryData<ProjectWithCategories[]>(
				CACHE_KEYS.PROJECTS(),
			);

			if (cachedProjects) {
				const cachedProject = cachedProjects.find(
					(p) => p.slug?.current === projectId || p._id === projectId,
				);
				if (cachedProject) return cachedProject;
			}

			// Fetch from API
			const projects = await client.fetch(getProjectById(projectId));
			return projects?.[0] || null;
		},
		enabled: Boolean(projectId),
		...CACHE_CONFIG.DYNAMIC, // Use DYNAMIC config for individual project
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
