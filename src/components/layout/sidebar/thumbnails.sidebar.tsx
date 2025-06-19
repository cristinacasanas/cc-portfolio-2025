import { Thumbnail } from "@/components/ui/thumbnail";
import { useThumbnailSync } from "@/hooks/use-thumbnail-sync";
import { client } from "@/lib/sanity";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { Categories, Projects } from "studio/sanity.types";
import { Sidebar } from "../sidebar";

// Queries optimisées pour les thumbnails de la sidebar
const thumbnailsProjectsQuery = `*[_type == "projects"] | order(orderRank) {
	_id,
	title,
	slug,
	thumbnail,
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

export const ThumbnailsSidebar = () => {
	const { category, project } = useSearch({ from: "/" });
	const sidebarRef = useRef<HTMLDivElement>(null);
	const thumbnailRefs = useRef<Map<string, HTMLDivElement>>(new Map());
	const isScrollingRef = useRef(false);

	// Use the thumbnail sync hook
	const { activeProject } = useThumbnailSync({
		debounceMs: 100,
	});

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
		queryKey: ["sidebar-thumbnails", { category }],
		queryFn: async () => {
			if (category) {
				return client.fetch<ProjectWithCategories[]>(
					thumbnailsProjectsByCategoryQuery(category),
				);
			}

			return client.fetch<ProjectWithCategories[]>(thumbnailsProjectsQuery);
		},
		staleTime: 15 * 60 * 1000, // 15 minutes - cache plus long
		gcTime: 2 * 60 * 60 * 1000, // 2 heures
		refetchOnWindowFocus: false,
		refetchOnMount: false,
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
			setTimeout(() => scrollToThumbnail(project), 50);
		}
	}, [project]);

	// Effect to scroll when activeProject changes
	useEffect(() => {
		if (activeProject) {
			scrollToThumbnail(activeProject);
		}
	}, [activeProject]);

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
							opacity: activeProject === projectId ? 1 : 0.5,
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
