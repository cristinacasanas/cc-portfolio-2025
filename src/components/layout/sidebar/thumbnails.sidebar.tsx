import { Thumbnail } from "@/components/ui/thumbnail";
import {
	getAllProjectsSimple,
	getProjectsByCategorySimple,
} from "@/lib/queries";
import { client } from "@/lib/sanity";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
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

	// Fonction pour scroller vers une position
	const scrollToPosition = useCallback(
		(container: HTMLElement, position: number, isHorizontal = false) => {
			const property = isHorizontal ? "scrollLeft" : "scrollTop";

			try {
				container.scrollTo({
					[isHorizontal ? "left" : "top"]: position,
					behavior: "smooth",
				});
			} catch (error) {
				// Fallback si scrollTo ne fonctionne pas
				container[property] = position;
			}
		},
		[],
	);

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
		if (!visibleProject || !sidebarRef.current || !data?.length) return;

		const now = Date.now();
		if (now - lastScrollTime.current < 150) return;

		// Attendre que les animations Framer Motion soient terminées
		const scrollToThumbnail = () => {
			const activeThumb = thumbnailRefs.current.get(visibleProject);
			if (!activeThumb || !sidebarRef.current) return;

			// Vérifier que l'élément est bien dans le DOM et a des dimensions
			const rect = activeThumb.getBoundingClientRect();
			if (rect.width === 0 || rect.height === 0) {
				// Réessayer après un délai
				setTimeout(scrollToThumbnail, 100);
				return;
			}

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

					scrollToPosition(sidebarRef.current, scrollTop);
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

					scrollToPosition(sidebarRef.current, scrollLeft, true);
					lastScrollTime.current = now;
				}
			}
		};

		// Délai pour attendre la fin des animations Framer Motion (300ms + marge)
		setTimeout(scrollToThumbnail, 400);
	}, [visibleProject, data, scrollToPosition]);

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
