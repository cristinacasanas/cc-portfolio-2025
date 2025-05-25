import { Thumbnail } from "@/components/ui/thumbnail";
import {
	getAllProjectsSimple,
	getProjectsByCategorySimple,
} from "@/lib/queries";
import { client } from "@/lib/sanity";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Projects } from "studio/sanity.types";
import { Sidebar } from "../sidebar";

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
	const lastScrollTime = useRef<number>(0);

	const { data } = useQuery({
		queryKey: ["thumbnails", { category }],
		queryFn: async () => {
			if (category) {
				return client.fetch<Projects[]>(getProjectsByCategorySimple(category));
			}

			return client.fetch<Projects[]>(getAllProjectsSimple);
		},
	});

	useEffect(() => {
		if (project) {
			setVisibleProject(project);
		}

		const handleVisibleProject = (e: ProjectInViewEvent) => {
			if (e.detail.intersectionRatio > 0 || e.detail.isActive) {
				setVisibleProject(e.detail.projectId);
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
	}, [project]);

	useEffect(() => {
		if (!visibleProject || !sidebarRef.current) return;

		const now = Date.now();
		if (now - lastScrollTime.current < 150) return;

		const activeThumb = thumbnailRefs.current.get(visibleProject);
		if (activeThumb) {
			if (window.innerWidth >= 768) {
				const sidebarRect = sidebarRef.current.getBoundingClientRect();
				const thumbRect = activeThumb.getBoundingClientRect();

				const isThumbVisible =
					thumbRect.top >= sidebarRect.top - 10 &&
					thumbRect.bottom <= sidebarRect.bottom + 10;

				if (!isThumbVisible) {
					const scrollTop =
						thumbRect.top +
						sidebarRef.current.scrollTop -
						sidebarRect.top -
						sidebarRect.height / 2 +
						thumbRect.height / 2;

					sidebarRef.current.scrollTo({
						top: scrollTop,
						behavior: "smooth",
					});
					lastScrollTime.current = now;
				}
			} else {
				const sidebarRect = sidebarRef.current.getBoundingClientRect();
				const thumbRect = activeThumb.getBoundingClientRect();

				const isThumbVisible =
					thumbRect.left >= sidebarRect.left - 10 &&
					thumbRect.right <= sidebarRect.right + 10;

				if (!isThumbVisible) {
					const scrollLeft =
						thumbRect.left +
						sidebarRef.current.scrollLeft -
						sidebarRect.left -
						sidebarRect.width / 2 +
						thumbRect.width / 2;

					sidebarRef.current.scrollTo({
						left: scrollLeft,
						behavior: "smooth",
					});
					lastScrollTime.current = now;
				}
			}
		}
	}, [visibleProject]);

	useEffect(() => {
		thumbnailRefs.current.clear();
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
						transition={{ duration: 0.3 }}
						className="transition-opacity duration-300"
					>
						<Thumbnail item={item} />
					</motion.div>
				);
			})}
		</Sidebar>
	);
};
