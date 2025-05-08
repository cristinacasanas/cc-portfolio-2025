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

	const { data } = useQuery({
		queryKey: ["mobileThumbnails", { category }],
		queryFn: async () => {
			if (category) {
				return client.fetch<Project[]>(getProjectsByCategorySimple(category));
			}

			return client.fetch<Project[]>(getAllProjectsSimple);
		},
	});

	useEffect(() => {
		if (project) {
			setVisibleProject(project);
		} else if (data && data.length > 0 && !initializedRef.current) {
			const firstProjectId = data[0].slug?.current || data[0]._id;
			setVisibleProject(firstProjectId);
			initializedRef.current = true;
		}

		const handleVisibleProject = (e: ProjectInViewEvent) => {
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
	}, [project, data]);

	// This effect handles scrolling the active thumbnail into view
	useEffect(() => {
		if (!visibleProject || !containerRef.current) return;

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
		if (data && data.length === 0) {
			initializedRef.current = false;
		}
	}, [data]);

	const getProjectOpacity = (projectId: string) => {
		if (!visibleProject && data && data.length > 0) {
			const firstProjectId = data[0].slug?.current || data[0]._id;
			return projectId === firstProjectId ? 1 : 0.5;
		}
		return projectId === visibleProject ? 1 : 0.5;
	};

	return (
		<div
			ref={containerRef}
			className="sticky mt-2 inline-flex w-screen items-start gap-1.5 self-stretch overflow-x-auto pr-3 md:hidden"
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
							opacity: getProjectOpacity(projectId),
						}}
						transition={{ duration: 0.3 }}
						className="transition-opacity duration-300"
					>
						<Thumbnail
							className={clsx(
								"min-h-[50px] w-full",
								category && "max-w-[45px]",
							)}
							item={item}
						/>
					</motion.div>
				);
			})}
		</div>
	);
};
