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
import type { Project } from "studio/sanity.types";
import { Thumbnail } from "./ui/thumbnail";

interface ProjectInViewEvent extends CustomEvent {
	detail: { projectId: string };
}

export const MobileThumbnails = () => {
	const { category, project } = useSearch({ from: "/" });
	const [visibleProject, setVisibleProject] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const thumbnailRefs = useRef<Map<string, HTMLDivElement>>(new Map());
	const initializedRef = useRef(false);
	const disableProjectInViewEvents = useRef(true);
	const firstLoadComplete = useRef(false);

	const { data: allProjects, isSuccess: allProjectsSuccess } = useQuery({
		queryKey: ["allMobileThumbnails"],
		queryFn: async () => {
			return client.fetch<Project[]>(getAllProjectsSimple);
		},
	});

	const { data: categoryProjects, isSuccess: categorySuccess } = useQuery({
		queryKey: ["categoryMobileThumbnails", { category }],
		queryFn: async () => {
			if (!category) return null;
			return client.fetch<Project[]>(getProjectsByCategorySimple(category));
		},
		enabled: !!category,
	});

	const categoryProjectIds = new Set<string>();
	if (category && categoryProjects) {
		for (const item of categoryProjects) {
			const projectId = item.slug?.current || item._id;
			categoryProjectIds.add(projectId);
		}
	}

	useEffect(() => {
		if (project) {
			setVisibleProject(project);
			initializedRef.current = true;
			disableProjectInViewEvents.current = false;
			return;
		}

		if (allProjectsSuccess && allProjects && allProjects.length > 0) {
			if (
				category &&
				categorySuccess &&
				categoryProjects &&
				categoryProjects.length > 0
			) {
				const firstCategoryProjectId =
					categoryProjects[0].slug?.current || categoryProjects[0]._id;
				setVisibleProject(firstCategoryProjectId);
			} else {
				const firstProjectId =
					allProjects[0].slug?.current || allProjects[0]._id;
				setVisibleProject(firstProjectId);
			}

			initializedRef.current = true;

			setTimeout(() => {
				disableProjectInViewEvents.current = false;
				firstLoadComplete.current = true;
			}, 1000);
		}
	}, [
		project,
		category,
		allProjects,
		allProjectsSuccess,
		categoryProjects,
		categorySuccess,
	]);

	useEffect(() => {
		const handleVisibleProject = (e: ProjectInViewEvent) => {
			if (disableProjectInViewEvents.current) {
				return;
			}

			if (!firstLoadComplete.current && allProjects && allProjects.length > 0) {
				if (category && categoryProjects && categoryProjects.length > 0) {
					const firstCategoryProjectId =
						categoryProjects[0].slug?.current || categoryProjects[0]._id;
					if (
						e.detail.projectId !== firstCategoryProjectId &&
						e.detail.projectId !== project
					) {
						return;
					}
				} else {
					const firstProjectId =
						allProjects[0].slug?.current || allProjects[0]._id;
					if (
						e.detail.projectId !== firstProjectId &&
						e.detail.projectId !== project
					) {
						return;
					}
				}
			}

			setVisibleProject(e.detail.projectId);
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
		};
	}, [allProjects, categoryProjects, project, category]);

	useEffect(() => {
		const handleUserInteraction = () => {
			if (disableProjectInViewEvents.current) {
				disableProjectInViewEvents.current = false;
				firstLoadComplete.current = true;
			}
		};

		document.addEventListener("scroll", handleUserInteraction, { once: true });

		if (containerRef.current) {
			containerRef.current.addEventListener(
				"touchstart",
				handleUserInteraction,
				{ once: true },
			);
			containerRef.current.addEventListener(
				"mousedown",
				handleUserInteraction,
				{ once: true },
			);
		}

		return () => {
			document.removeEventListener("scroll", handleUserInteraction);
			if (containerRef.current) {
				containerRef.current.removeEventListener(
					"touchstart",
					handleUserInteraction,
				);
				containerRef.current.removeEventListener(
					"mousedown",
					handleUserInteraction,
				);
			}
		};
	}, []);

	useEffect(() => {
		if (!visibleProject || !containerRef.current) {
			return;
		}

		const activeThumb = thumbnailRefs.current.get(visibleProject);
		if (activeThumb) {
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
		}
	}, [visibleProject]);

	useEffect(() => {
		thumbnailRefs.current.clear();

		if (allProjects && allProjects.length === 0) {
			initializedRef.current = false;
			setVisibleProject(null);
		}

		firstLoadComplete.current = false;
		disableProjectInViewEvents.current = true;
	}, [allProjects]);

	const getProjectOpacity = (projectId: string) => {
		let isVisible = projectId === visibleProject;

		if (!visibleProject && allProjects && allProjects.length > 0) {
			if (category && categoryProjects && categoryProjects.length > 0) {
				const firstCategoryProjectId =
					categoryProjects[0].slug?.current || categoryProjects[0]._id;
				isVisible = projectId === firstCategoryProjectId;
			} else {
				const firstProjectId =
					allProjects[0].slug?.current || allProjects[0]._id;
				isVisible = projectId === firstProjectId;
			}
		}

		if (category) {
			const inCategory = categoryProjectIds.has(projectId);
			if (inCategory) {
				return isVisible ? 1 : 0.7;
			}
			return isVisible ? 0.6 : 0.2;
		}

		return isVisible ? 1 : 0.5;
	};

	return (
		<div
			ref={containerRef}
			className="sticky mt-2 inline-flex h-auto w-screen items-start gap-1.5 self-stretch overflow-x-auto pr-3 md:hidden"
		>
			{allProjects?.map((item) => {
				const projectId = item.slug?.current || item._id;
				return (
					<motion.div
						key={item._id}
						ref={(el) => {
							if (el) thumbnailRefs.current.set(projectId, el);
						}}
						animate={{
							opacity: getProjectOpacity(projectId),
						}}
						transition={{ duration: 0.3 }}
						className={clsx("max-w-1/8 transition-opacity duration-300")}
					>
						<Thumbnail className="h-full" item={item} />
					</motion.div>
				);
			})}
		</div>
	);
};
