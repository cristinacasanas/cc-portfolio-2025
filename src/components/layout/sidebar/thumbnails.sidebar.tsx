import { Thumbnail } from "@/components/ui/thumbnail";
import { client } from "@/lib/sanity";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Categories, Projects } from "studio/sanity.types";
import { Sidebar } from "../sidebar";

// Specific thumbnail queries to ensure all required fields are fetched
const thumbnailsProjectsQuery = `*[_type == "projects"] | order(orderRank) {
	_id,
	title,
	slug,
	thumbnail,
	gallery[0],
	"expandedCategories": categories[]-> {
		_id,
		title,
		slug
	}
}`;

const thumbnailsProjectsByCategoryQuery = (categorySlug: string) => `
	*[_type == "projects" && references(*[_type == "categories" && (slug.current == "${categorySlug}" || _id == "${categorySlug}")]._id)] | order(orderRank) {
		_id,
		title,
		slug,
		thumbnail,
		gallery[0],
		"expandedCategories": categories[]-> {
			_id,
			title,
			slug
		}
	}
`;

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
	const isScrollingRef = useRef(false);

	// Apply smooth scroll behavior when component mounts
	useEffect(() => {
		if (sidebarRef.current) {
			sidebarRef.current.style.scrollBehavior = "smooth";
		}
		return () => {
			if (sidebarRef.current) {
				sidebarRef.current.style.scrollBehavior = "auto";
			}
		};
	}, []);

	const { data } = useQuery({
		queryKey: ["thumbnails", { category }],
		queryFn: async () => {
			if (category) {
				return client.fetch<ProjectWithCategories[]>(
					thumbnailsProjectsByCategoryQuery(category),
				);
			}

			return client.fetch<ProjectWithCategories[]>(thumbnailsProjectsQuery);
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
		gcTime: 1000 * 60 * 30, // 30 minutes
	});

	// Simple function to scroll to a thumbnail
	const scrollToThumbnail = (projectId: string) => {
		if (!sidebarRef.current) return;
		const thumbnail = thumbnailRefs.current.get(projectId);
		if (!thumbnail) return;

		if (isScrollingRef.current) return;
		isScrollingRef.current = true;

		try {
			// Use direct DOM manipulation for most reliable scrolling
			const container = sidebarRef.current;
			const thumbnailTop = thumbnail.offsetTop;
			const containerHeight = container.clientHeight;
			const thumbnailHeight = thumbnail.clientHeight;

			// Center the thumbnail in the sidebar
			const scrollPosition =
				thumbnailTop - (containerHeight - thumbnailHeight) / 2;

			// Use scrollTo with smooth behavior
			container.scrollTo({
				top: scrollPosition,
				behavior: "smooth",
			});
		} catch (e) {
			console.error("Scroll error:", e);
		}

		// Reset scrolling flag after animation completes
		setTimeout(() => {
			isScrollingRef.current = false;
		}, 500); // Allow enough time for scroll animation
	};

	// Update based on URL parameter
	useEffect(() => {
		if (project) {
			setVisibleProject(project);
			setTimeout(() => scrollToThumbnail(project), 50);
		}
	}, [project]);

	// Set initial project
	useEffect(() => {
		if (!visibleProject && data && data.length > 0) {
			const firstProject = data[0];
			const firstProjectId = firstProject.slug?.current || firstProject._id;
			if (firstProjectId) {
				setVisibleProject(firstProjectId);
			}
		}
	}, [data, visibleProject]);

	// Listen for project visibility events from main content
	useEffect(() => {
		const handleProjectInView = (event: Event) => {
			const e = event as ProjectInViewEvent;
			if (!e.detail) return;

			const { projectId, isActive, intersectionRatio } = e.detail;

			if (isActive && intersectionRatio > 0.5 && !isScrollingRef.current) {
				setVisibleProject(projectId);
				scrollToThumbnail(projectId);
			}
		};

		// Add event listener
		window.addEventListener(
			"projectInView",
			handleProjectInView as EventListener,
		);

		return () => {
			window.removeEventListener(
				"projectInView",
				handleProjectInView as EventListener,
			);
		};
	}, []);

	// Effect to scroll when visibleProject changes
	useEffect(() => {
		if (visibleProject) {
			scrollToThumbnail(visibleProject);
		}
	}, [visibleProject]);

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
						<Thumbnail
							item={{
								...item,
								// Use gallery[0] as fallback if thumbnail is not available
								thumbnail:
									item.thumbnail ||
									(Array.isArray(item.gallery) ? item.gallery[0] : undefined),
							}}
							className="bg-white"
						/>
					</motion.div>
				);
			})}
		</Sidebar>
	);
};
