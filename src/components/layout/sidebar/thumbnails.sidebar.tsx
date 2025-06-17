import { Thumbnail } from "@/components/ui/thumbnail";
import { getAllProjects, getProjectsByCategory } from "@/lib/queries";
import { client } from "@/lib/sanity";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Categories, Projects } from "studio/sanity.types";
import { Sidebar } from "../sidebar";

type ProjectWithCategories = Projects & {
	expandedCategories?: Categories[];
};

interface ProjectInViewEvent extends CustomEvent {
	detail: {
		projectId: string;
		isActive: boolean;
		intersectionRatio: number;
	};
}

export const ThumbnailsSidebar = () => {
	const { category, project } = useSearch({ from: "/" });
	const [visibleProject, setVisibleProject] = useState<string | null>(null);
	const sidebarRef = useRef<HTMLDivElement>(null);
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

	// Robust scroll to thumbnail function
	const scrollToThumbnail = useCallback((projectId: string) => {
		if (!projectId || !sidebarRef.current) return;

		const activeThumb = thumbnailRefs.current.get(projectId);
		if (!activeThumb) {
			if (retryCountRef.current < maxRetries) {
				retryCountRef.current++;
				setTimeout(() => scrollToThumbnail(projectId), 100);
			}
			return;
		}

		retryCountRef.current = 0;

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

		// Get the container and verify its scroll capability
		const container = sidebarRef.current;
		if (!container) {
			isScrollingProgrammatically.current = false;
			return;
		}

		// Calculate the target position
		const containerRect = container.getBoundingClientRect();
		const targetPosition =
			(activeThumb as HTMLElement).offsetTop -
			containerRect.height / 2 +
			rect.height / 2;

		// Start position
		const startPosition = container.scrollTop;
		const distance = targetPosition - startPosition;

		// Smooth scroll using animation frame
		const duration = 300; // ms
		const startTime = performance.now();

		function animateScroll(currentTime: number) {
			const elapsedTime = currentTime - startTime;

			if (elapsedTime < duration) {
				// Ease-out function
				const progress = 1 - Math.pow(1 - elapsedTime / duration, 3);
				container.scrollTop = startPosition + distance * progress;
				requestAnimationFrame(animateScroll);
			} else {
				// Ensure we land exactly on target
				container.scrollTop = targetPosition;
				isScrollingProgrammatically.current = false;
			}
		}

		requestAnimationFrame(animateScroll);
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
		if (!visibleProject && data && data.length > 0) {
			const firstProject = data[0];
			const firstProjectId = firstProject.slug?.current || firstProject._id;
			if (firstProjectId) {
				debouncedSetVisibleProject(firstProjectId);
			}
		}
	}, [data, visibleProject, debouncedSetVisibleProject]);

	// Handle project visibility events
	useEffect(() => {
		const handleVisibleProject = (e: ProjectInViewEvent) => {
			const { projectId, isActive, intersectionRatio } = e.detail;

			// Update visible project if it's active or highly visible
			if (isActive || intersectionRatio > 0.6) {
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

		// Handle page scroll to select first project when at top
		const handleScroll = () => {
			// Check if we're at top of page and select first project
			if (window.scrollY < 100 && data && data.length > 0) {
				const firstProject = data[0];
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

		window.addEventListener(
			"projectInView",
			handleVisibleProject as EventListener,
		);
		window.addEventListener("scroll", handleScroll, { passive: true });

		return () => {
			window.removeEventListener(
				"projectInView",
				handleVisibleProject as EventListener,
			);
			window.removeEventListener("scroll", handleScroll);
		};
	}, [debouncedSetVisibleProject, data]);

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
	}, [data]);

	return (
		<Sidebar
			ref={sidebarRef}
			className="max-h-screen w-full flex-row gap-1.5 md:flex-col md:gap-2.5 md:overflow-y-auto"
			position="right"
		>
			{data?.map((item) => {
				const projectId = item.slug?.current || item._id;
				return (
					<motion.div
						key={item._id}
						ref={(el) => {
							if (el) thumbnailRefs.current.set(projectId, el);
						}}
						animate={{
							opacity: visibleProject === projectId ? 1 : 0.5,
						}}
						transition={{
							duration: 0.3,
							ease: "easeOut",
							type: "tween",
						}}
						className="h-full w-full will-change-opacity"
					>
						<Thumbnail item={item} className="bg-white" />
					</motion.div>
				);
			})}
		</Sidebar>
	);
};
