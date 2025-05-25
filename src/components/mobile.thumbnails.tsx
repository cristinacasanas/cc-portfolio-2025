import {
	getAllProjectsSimple,
	getProjectsByCategorySimple,
} from "@/lib/queries";
import { client } from "@/lib/sanity";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Projects } from "studio/sanity.types";
import { Thumbnail } from "./ui/thumbnail";

interface ProjectInViewEvent extends CustomEvent {
	detail: {
		projectId: string;
		isInTopHalf?: boolean;
		intersectionRatio?: number;
		centrality?: number;
		visibleRatio?: number;
		enteringFromTop?: boolean;
		isActive?: boolean;
	};
}

export const MobileThumbnails = () => {
	const { category, project } = useSearch({ from: "/" });
	const [visibleProject, setVisibleProject] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const thumbnailRefs = useRef<Map<string, HTMLDivElement>>(new Map());
	const scrollingRef = useRef(false);
	const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const activeProjectsRef = useRef<Set<string>>(new Set());
	const enteringProjectsRef = useRef<Set<string>>(new Set());
	const isMountedRef = useRef(true);

	useEffect(() => {
		if (visibleProject && containerRef.current && !scrollingRef.current) {
			const activeThumb = thumbnailRefs.current.get(visibleProject);
			if (activeThumb && containerRef.current) {
				try {
					const containerRect = containerRef.current.getBoundingClientRect();
					const thumbRect = activeThumb.getBoundingClientRect();

					const scrollLeft =
						thumbRect.left +
						containerRef.current.scrollLeft -
						containerRect.left -
						containerRect.width / 2 +
						thumbRect.width / 2;

					containerRef.current.scrollTo({
						left: scrollLeft,
						behavior: "smooth",
					});
				} catch (error) {
					console.warn("Error scrolling to thumbnail:", error);
				}
			}
		}
	}, [visibleProject]);

	const {
		data: allProjects,
		isSuccess: allProjectsSuccess,
		error: allProjectsError,
	} = useQuery({
		queryKey: ["allMobileThumbnails"],
		queryFn: async () => {
			try {
				return client.fetch<Projects[]>(getAllProjectsSimple);
			} catch (error) {
				console.error("Error fetching all projects:", error);
				return [];
			}
		},
		retry: 3,
		retryDelay: 1000,
	});

	const {
		data: categoryProjects,
		isSuccess: categorySuccess,
		error: categoryError,
	} = useQuery({
		queryKey: ["categoryMobileThumbnails", { category }],
		queryFn: async () => {
			if (!category) return null;
			try {
				return client.fetch<Projects[]>(getProjectsByCategorySimple(category));
			} catch (error) {
				console.error("Error fetching category projects:", error);
				return [];
			}
		},
		enabled: !!category,
		retry: 3,
		retryDelay: 1000,
	});

	const categoryProjectIds = new Set<string>();
	if (category && categoryProjects) {
		for (const item of categoryProjects) {
			const projectId = item.slug?.current || item._id;
			categoryProjectIds.add(projectId);
		}
	}

	const sortedProjects =
		allProjects && Array.isArray(allProjects)
			? [...allProjects]
					.filter(
						(project) => project?._id && (project.slug?.current || project._id),
					)
					.sort((a, b) => {
						if (!category || !categoryProjectIds.size) return 0;

						const aInCategory = categoryProjectIds.has(
							a.slug?.current || a._id,
						);
						const bInCategory = categoryProjectIds.has(
							b.slug?.current || b._id,
						);

						if (aInCategory && !bInCategory) return -1;
						if (!aInCategory && bInCategory) return 1;
						return 0;
					})
			: [];

	useEffect(() => {
		if (project) {
			setVisibleProject(project);
			return;
		}

		if (allProjectsSuccess && sortedProjects.length > 0) {
			let firstProjectId: string;

			if (
				category &&
				categorySuccess &&
				categoryProjects &&
				categoryProjects.length > 0
			) {
				firstProjectId =
					categoryProjects[0].slug?.current || categoryProjects[0]._id;
			} else {
				firstProjectId =
					sortedProjects[0].slug?.current || sortedProjects[0]._id;
			}

			if (!visibleProject) {
				setVisibleProject(firstProjectId);
			}
		}
	}, [
		project,
		category,
		allProjects,
		allProjectsSuccess,
		categoryProjects,
		categorySuccess,
		sortedProjects,
		visibleProject,
	]);

	useEffect(() => {
		const handleVisibleProject = (e: ProjectInViewEvent) => {
			const {
				projectId,
				isActive,
				enteringFromTop = false,
				centrality = 0,
				visibleRatio = 0,
			} = e.detail;

			if (!projectId) return;

			if (centrality === 0 && visibleRatio === 0) {
				if (activeProjectsRef.current.has(projectId)) {
					activeProjectsRef.current.delete(projectId);
				}
				if (enteringProjectsRef.current.has(projectId)) {
					enteringProjectsRef.current.delete(projectId);
				}
				return;
			}

			if (enteringFromTop) {
				enteringProjectsRef.current.add(projectId);
			} else {
				enteringProjectsRef.current.delete(projectId);
			}

			if (isActive) {
				activeProjectsRef.current.add(projectId);
			} else {
				activeProjectsRef.current.delete(projectId);
			}

			if (scrollingRef.current) {
				return;
			}

			if (enteringFromTop && projectId !== visibleProject) {
				setVisibleProject(projectId);
				return;
			}

			if (isActive && projectId !== visibleProject) {
				setVisibleProject(projectId);
			}
		};

		window.addEventListener(
			"projectInView",
			handleVisibleProject as EventListener,
		);

		return () => {
			window.removeEventListener(
				"projectInView",
				handleVisibleProject as EventListener,
			);
			activeProjectsRef.current.clear();
			enteringProjectsRef.current.clear();
		};
	}, [visibleProject]);

	useEffect(() => {
		const handleScroll = () => {
			scrollingRef.current = true;

			if (scrollTimerRef.current) {
				clearTimeout(scrollTimerRef.current);
			}

			scrollTimerRef.current = setTimeout(() => {
				if (!isMountedRef.current) return;

				scrollingRef.current = false;

				if (enteringProjectsRef.current.size > 0) {
					const enteringProject = Array.from(enteringProjectsRef.current)[0];
					if (enteringProject !== visibleProject && isMountedRef.current) {
						setVisibleProject(enteringProject);
						return;
					}
				}

				if (activeProjectsRef.current.size > 0) {
					const activeProject = Array.from(activeProjectsRef.current)[0];
					if (activeProject !== visibleProject && isMountedRef.current) {
						setVisibleProject(activeProject);
					}
				}
			}, 150);
		};

		document.addEventListener("scroll", handleScroll, { passive: true });
		const container = containerRef.current;
		if (container) {
			container.addEventListener("scroll", handleScroll, {
				passive: true,
			});
		}

		return () => {
			document.removeEventListener("scroll", handleScroll);
			if (container) {
				container.removeEventListener("scroll", handleScroll);
			}
			if (scrollTimerRef.current) {
				clearTimeout(scrollTimerRef.current);
			}
		};
	}, [visibleProject]);

	// Nettoyage des références lors du changement de projets
	useEffect(() => {
		thumbnailRefs.current.clear();
		activeProjectsRef.current.clear();
		enteringProjectsRef.current.clear();
	}, [sortedProjects]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			isMountedRef.current = false;
			if (scrollTimerRef.current) {
				clearTimeout(scrollTimerRef.current);
			}
		};
	}, []);

	const getProjectOpacity = (projectId: string) => {
		if (!projectId) return 0;

		let isVisible = projectId === visibleProject;

		if (!visibleProject && sortedProjects.length > 0) {
			if (category && categoryProjects && categoryProjects.length > 0) {
				const firstCategoryProjectId =
					categoryProjects[0]?.slug?.current || categoryProjects[0]?._id;
				isVisible = projectId === firstCategoryProjectId;
			} else {
				const firstProjectId =
					sortedProjects[0]?.slug?.current || sortedProjects[0]?._id;
				isVisible = projectId === firstProjectId;
			}
		}

		if (scrollingRef.current) {
			if (category) {
				const inCategory = categoryProjectIds.has(projectId);
				if (inCategory) {
					return isVisible ? 0.9 : 0.7;
				}
				return 0;
			}
			return isVisible ? 0.9 : 0.6;
		}

		if (category) {
			const inCategory = categoryProjectIds.has(projectId);
			if (inCategory) {
				return isVisible ? 1 : 0.7;
			}
			return 0;
		}

		return isVisible ? 1 : 0.5;
	};

	return (
		<div
			ref={containerRef}
			className="sticky mt-2 inline-flex w-screen items-start gap-1.5 self-stretch overflow-x-auto pr-3 md:hidden"
			style={
				{
					"--header-height": "42px",
					"--mobile-thumbnails-bar-height": "50px",
				} as React.CSSProperties
			}
		>
			{sortedProjects
				.map((item) => {
					if (!item?._id) return null;

					const projectId = item.slug?.current || item._id;
					if (!projectId) return null;

					return (
						<motion.div
							key={item._id}
							ref={(el) => {
								if (el && projectId) {
									thumbnailRefs.current.set(projectId, el);
								}
							}}
							animate={{
								opacity: getProjectOpacity(projectId),
							}}
							transition={{
								duration: scrollingRef.current ? 0.1 : 0.3,
								ease: "easeOut",
							}}
							className={clsx("max-w-1/8 transition-opacity duration-300")}
							onClick={() => {
								if (projectId) {
									setVisibleProject(projectId);
								}
							}}
						>
							<Thumbnail className="h-full" item={item} />
						</motion.div>
					);
				})
				.filter(Boolean)}
		</div>
	);
};
