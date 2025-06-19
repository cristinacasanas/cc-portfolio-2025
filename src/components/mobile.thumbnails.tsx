import { useProjects } from "@/hooks/use-projects";
import { useThumbnailSync } from "@/hooks/use-thumbnail-sync";
import { useSearch } from "@tanstack/react-router";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Categories, Projects } from "studio/sanity.types";
import { Thumbnail } from "./ui/thumbnail";

type ProjectWithCategories = Projects & {
	expandedCategories?: Categories[];
};

export const MobileThumbnails = () => {
	const { category, project } = useSearch({ from: "/" });
	const containerRef = useRef<HTMLDivElement>(null);
	const thumbnailRefs = useRef<Map<string, HTMLDivElement>>(new Map());
	const isScrollingRef = useRef(false);

	// Use the thumbnail sync hook
	const { activeProject } = useThumbnailSync({
		debounceMs: 150,
	});

	// Query for all projects (thumbnails only)
	const { data: allProjects } = useProjects({ thumbnailsOnly: true });

	// Filter projects based on category
	const { displayedProjects, matchingProjectIds } = useMemo(() => {
		if (!allProjects) {
			return { displayedProjects: [], matchingProjectIds: new Set<string>() };
		}

		if (!category) {
			return {
				displayedProjects: allProjects,
				matchingProjectIds: new Set<string>(),
			};
		}

		// Client-side filtering for category
		const matching: ProjectWithCategories[] = [];
		const nonMatching: ProjectWithCategories[] = [];
		const matchingIds = new Set<string>();

		for (const project of allProjects) {
			const hasCategory = project.expandedCategories?.some(
				(cat: Categories) =>
					cat.slug?.current === category || cat._id === category,
			);

			if (hasCategory) {
				matching.push(project);
				matchingIds.add(project.slug?.current || project._id || "");
			} else {
				nonMatching.push(project);
			}
		}

		return {
			displayedProjects: [...matching, ...nonMatching],
			matchingProjectIds: matchingIds,
		};
	}, [allProjects, category]);

	// Simplified scroll to thumbnail function
	const scrollToThumbnail = useCallback((projectId: string) => {
		if (!projectId || !containerRef.current || isScrollingRef.current) {
			return;
		}

		const container = containerRef.current;
		const thumbnail = thumbnailRefs.current.get(projectId);
		if (!thumbnail) return;

		isScrollingRef.current = true;

		try {
			const containerRect = container.getBoundingClientRect();
			const thumbnailRect = thumbnail.getBoundingClientRect();

			// Calculate scroll position to center the thumbnail
			const scrollLeft =
				thumbnail.offsetLeft - (containerRect.width - thumbnailRect.width) / 2;

			container.scrollTo({
				left: Math.max(
					0,
					Math.min(scrollLeft, container.scrollWidth - container.clientWidth),
				),
				behavior: "smooth",
			});
		} catch (error) {
			console.error("Scroll error:", error);
		}

		// Reset scrolling flag
		setTimeout(() => {
			isScrollingRef.current = false;
		}, 500);
	}, []);

	// Handle URL project parameter
	useEffect(() => {
		if (project) {
			setTimeout(() => scrollToThumbnail(project), 50);
		}
	}, [project, scrollToThumbnail]);

	// Handle active project changes
	useEffect(() => {
		if (activeProject) {
			scrollToThumbnail(activeProject);
		}
	}, [activeProject, scrollToThumbnail]);

	// Calculate opacity for projects
	const getProjectOpacity = useCallback(
		(projectId: string) => {
			if (!projectId) return 0;

			const matchesCategory = category
				? matchingProjectIds.has(projectId)
				: true;
			const isActive = projectId === activeProject;

			if (!category) {
				return isActive ? 1 : 0.35;
			}

			return matchesCategory ? (isActive ? 1 : 0.6) : 0;
		},
		[activeProject, category, matchingProjectIds],
	);

	// Handle thumbnail click
	const handleThumbnailClick = useCallback((projectId: string) => {
		const projectElement = document.querySelector(
			`[data-project-id="${projectId}"]`,
		);
		if (projectElement) {
			projectElement.scrollIntoView({
				behavior: "smooth",
				block: "center",
			});
		}
	}, []);

	// Render individual thumbnail
	const renderThumbnail = useCallback(
		(item: ProjectWithCategories) => {
			if (!item?._id) return null;

			const projectId = item.slug?.current || item._id;
			if (!projectId) return null;

			const isActive = projectId === activeProject;
			const matchesCategory = category
				? matchingProjectIds.has(projectId)
				: true;

			return (
				<motion.div
					key={item._id}
					ref={(el) => {
						if (el && projectId) {
							thumbnailRefs.current.set(projectId, el);
						}
					}}
					initial={{ opacity: 0.35 }}
					animate={{ opacity: getProjectOpacity(projectId) }}
					transition={{
						duration: 0.2,
						ease: "easeOut",
						type: "tween",
					}}
					className={clsx(
						"h-full w-full",
						isActive ? "z-10" : "z-0",
						!matchesCategory && category ? "pointer-events-none" : "",
					)}
					onClick={() => {
						if (projectId && (matchesCategory || !category)) {
							handleThumbnailClick(projectId);
						}
					}}
				>
					<Thumbnail className="h-full w-full bg-white" item={item} />
				</motion.div>
			);
		},
		[
			activeProject,
			getProjectOpacity,
			category,
			matchingProjectIds,
			handleThumbnailClick,
		],
	);

	return (
		<div
			ref={containerRef}
			className="relative mt-2 flex h-auto w-full items-start gap-1.5 self-stretch overflow-x-auto scroll-smooth pb-1 will-change-scroll md:hidden"
		>
			{displayedProjects.map(renderThumbnail).filter(Boolean)}
		</div>
	);
};
