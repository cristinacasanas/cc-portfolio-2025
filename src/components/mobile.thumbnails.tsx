import { getAllProjects, getProjectsByCategory } from "@/lib/queries";
import { client } from "@/lib/sanity";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Categories, Projects } from "studio/sanity.types";
import { Thumbnail } from "./ui/thumbnail";

type ProjectWithCategories = Projects & {
	expandedCategories?: Categories[];
};

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
	const isScrollingProgrammatically = useRef(false);
	const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastVisibleProjectRef = useRef<string | null>(null);
	const retryCountRef = useRef(0);
	const maxRetries = 3;

	const { data } = useQuery({
		queryKey: ["thumbnails", { category }],
		queryFn: async () => {
			if (category) {
				return client.fetch<ProjectWithCategories[]>(
					getProjectsByCategory(category),
				);
			}
			return client.fetch<ProjectWithCategories[]>(getAllProjects);
		},
	});

	// Memoize projects processing
	const sortedProjects = useMemo(() => {
		if (!data) return [];

		return [...data].sort((a, b) => {
			const dateA = new Date(a._createdAt || 0);
			const dateB = new Date(b._createdAt || 0);
			return dateB.getTime() - dateA.getTime();
		});
	}, [data]);

	// Robust scroll to thumbnail function
	const scrollToThumbnail = useCallback((projectId: string) => {
		if (!projectId || !containerRef.current) return;

		const activeThumb = thumbnailRefs.current.get(projectId);
		if (!activeThumb) {
			// Retry if element not found (might still be mounting)
			if (retryCountRef.current < maxRetries) {
				retryCountRef.current++;
				setTimeout(() => scrollToThumbnail(projectId), 100);
			}
			return;
		}

		// Reset retry count on successful find
		retryCountRef.current = 0;

		// Check if element has dimensions (is actually rendered)
		const rect = activeThumb.getBoundingClientRect();
		if (rect.width === 0 || rect.height === 0) {
			// Element not yet rendered, retry
			if (retryCountRef.current < maxRetries) {
				retryCountRef.current++;
				setTimeout(() => scrollToThumbnail(projectId), 100);
			}
			return;
		}

		isScrollingProgrammatically.current = true;

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
			// Fallback to scrollIntoView
			try {
				activeThumb.scrollIntoView({
					behavior: "smooth",
					block: "nearest",
					inline: "center",
				});
			} catch (fallbackError) {
				console.warn("[MOBILE_THUMBNAILS] Scroll failed:", fallbackError);
			}
		}

		// Reset scrolling flag after animation
		setTimeout(() => {
			isScrollingProgrammatically.current = false;
		}, 600); // Reduced timeout for better responsiveness
	}, []);

	// Debounced function to update visible project
	const debouncedSetVisibleProject = useCallback(
		(projectId: string) => {
			if (lastVisibleProjectRef.current === projectId) return;

			lastVisibleProjectRef.current = projectId;
			setVisibleProject(projectId);

			// Clear any existing timeout
			if (scrollTimeoutRef.current) {
				clearTimeout(scrollTimeoutRef.current);
			}

			// Scroll to thumbnail with a small delay to ensure state update
			scrollTimeoutRef.current = setTimeout(() => {
				scrollToThumbnail(projectId);
			}, 100); // Reduced delay for better responsiveness
		},
		[scrollToThumbnail],
	);

	// Handle project changes from URL
	useEffect(() => {
		if (project) {
			debouncedSetVisibleProject(project);
		}
	}, [project, debouncedSetVisibleProject]);

	// Initialize first project when data loads
	useEffect(() => {
		if (!visibleProject && sortedProjects.length > 0) {
			const firstProject = sortedProjects[0];
			const firstProjectId = firstProject.slug?.current || firstProject._id;
			if (firstProjectId) {
				debouncedSetVisibleProject(firstProjectId);
			}
		}
	}, [sortedProjects, visibleProject, debouncedSetVisibleProject]);

	// Handle project visibility events
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

			// Update visible project based on activity or visibility
			if (
				isActive ||
				(enteringFromTop && centrality > 0.5) ||
				visibleRatio > 0.6
			) {
				// Only debounce if we're not currently scrolling programmatically
				if (!isScrollingProgrammatically.current) {
					debouncedSetVisibleProject(projectId);
				} else {
					// If we're scrolling programmatically, just update the state without scrolling
					lastVisibleProjectRef.current = projectId;
					setVisibleProject(projectId);
				}
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
		};
	}, [debouncedSetVisibleProject]);

	// Handle container scroll
	useEffect(() => {
		const handleScroll = () => {
			// Check if we're at top of page and select first project
			if (window.scrollY < 100 && sortedProjects.length > 0) {
				const firstProject = sortedProjects[0];
				const firstProjectId = firstProject.slug?.current || firstProject._id;
				if (
					firstProjectId &&
					lastVisibleProjectRef.current !== firstProjectId
				) {
					if (!isScrollingProgrammatically.current) {
						debouncedSetVisibleProject(firstProjectId);
					} else {
						// If we're scrolling programmatically, just update the state
						lastVisibleProjectRef.current = firstProjectId;
						setVisibleProject(firstProjectId);
					}
				}
			}
		};

		// Listen to window scroll for top detection
		window.addEventListener("scroll", handleScroll, { passive: true });

		const container = containerRef.current;
		if (container) {
			container.addEventListener("scroll", handleScroll, { passive: true });
		}

		return () => {
			window.removeEventListener("scroll", handleScroll);
			if (container) {
				container.removeEventListener("scroll", handleScroll);
			}
		};
	}, [sortedProjects, debouncedSetVisibleProject]);

	// Cleanup on unmount or data change
	useEffect(() => {
		thumbnailRefs.current.clear();
		lastVisibleProjectRef.current = null;
		retryCountRef.current = 0;

		return () => {
			if (scrollTimeoutRef.current) {
				clearTimeout(scrollTimeoutRef.current);
			}
		};
	}, [sortedProjects]);

	// Memoize opacity calculation to prevent unnecessary recalculations
	const getProjectOpacity = useCallback(
		(projectId: string) => {
			if (!projectId) return 0;

			const isVisible = projectId === visibleProject;

			if (category) {
				// If we have a category, all visible projects are in that category
				// since the query already filtered them
				return isVisible ? 1 : 0.7;
			}

			return isVisible ? 1 : 0.5;
		},
		[visibleProject, category],
	);

	return (
		<div
			ref={containerRef}
			className="relative mt-2 flex h-auto w-screen items-start gap-1.5 self-stretch overflow-x-auto pr-3 md:hidden"
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
								duration: 0.2,
								ease: "easeOut",
							}}
							className="h-full w-full"
							onClick={() => {
								if (projectId) {
									debouncedSetVisibleProject(projectId);
								}
							}}
						>
							<Thumbnail className="h-full w-full" item={item} />
						</motion.div>
					);
				})
				.filter(Boolean)}
		</div>
	);
};
