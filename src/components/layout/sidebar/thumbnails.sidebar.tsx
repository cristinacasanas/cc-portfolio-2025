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
	const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastVisibleProjectRef = useRef<string | null>(null);
	const lastScrollYRef = useRef<number>(0);

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

	// Fonction pour scroller vers la thumbnail active
	const scrollToThumbnail = useCallback(() => {
		if (!visibleProject || !sidebarRef.current || !data?.length) return;

		const activeThumb = thumbnailRefs.current.get(visibleProject);
		if (!activeThumb || !sidebarRef.current) return;

		// Vérifier que l'élément est bien dans le DOM et a des dimensions
		const rect = activeThumb.getBoundingClientRect();
		if (rect.width === 0 || rect.height === 0) {
			// Réessayer après un délai plus court
			if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
			scrollTimeoutRef.current = setTimeout(scrollToThumbnail, 50);
			return;
		}

		const now = Date.now();
		if (now - lastScrollTime.current < 100) return;

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
	}, [visibleProject, data, scrollToPosition]);

	// Fonction debounced pour mettre à jour le projet visible
	const debouncedSetVisibleProject = useCallback((projectId: string) => {
		if (lastVisibleProjectRef.current === projectId) return;

		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
		}

		// Délai plus court pour les scrolls rapides
		const currentScrollY = window.scrollY;
		const scrollDelta = Math.abs(currentScrollY - lastScrollYRef.current);
		const delay = scrollDelta > 500 ? 50 : 150;
		lastScrollYRef.current = currentScrollY;

		debounceTimeoutRef.current = setTimeout(() => {
			lastVisibleProjectRef.current = projectId;
			setVisibleProject(projectId);
		}, delay);
	}, []);

	useEffect(() => {
		if (project) {
			setVisibleProject(project);
			lastVisibleProjectRef.current = project;
		}

		let isScrolling = false;
		let scrollTimeout: NodeJS.Timeout;

		const handleVisibleProject = (e: ProjectInViewEvent) => {
			const { projectId, isActive, intersectionRatio } = e.detail;

			// Ignorer les événements pendant un scroll rapide
			if (isScrolling) return;

			// Mettre à jour le projet visible si il est actif ou a une bonne visibilité
			if (isActive || intersectionRatio > 0.6) {
				debouncedSetVisibleProject(projectId);
			}
		};

		// Fonction pour vérifier si on est en haut de page et sélectionner le premier projet
		const handleScroll = () => {
			isScrolling = true;

			if (scrollTimeout) {
				clearTimeout(scrollTimeout);
			}

			scrollTimeout = setTimeout(() => {
				isScrolling = false;

				// Vérifier si on est en haut de page
				if (window.scrollY < 50 && data && data.length > 0) {
					const firstProject = data[0];
					const firstProjectId = firstProject.slug?.current || firstProject._id;
					if (
						firstProjectId &&
						lastVisibleProjectRef.current !== firstProjectId
					) {
						debouncedSetVisibleProject(firstProjectId);
					}
				}
			}, 100);
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
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
			}
			if (scrollTimeout) {
				clearTimeout(scrollTimeout);
			}
		};
	}, [project, debouncedSetVisibleProject, data]);

	// Utiliser requestAnimationFrame pour un timing plus fiable
	useEffect(() => {
		if (!visibleProject || !data?.length) return;

		// Nettoyer le timeout précédent
		if (scrollTimeoutRef.current) {
			clearTimeout(scrollTimeoutRef.current);
		}

		// Fonction de scroll simplifiée
		const doScroll = () => {
			const activeThumb = thumbnailRefs.current.get(visibleProject);
			if (!activeThumb || !sidebarRef.current) {
				return;
			}

			try {
				activeThumb.scrollIntoView({
					behavior: "smooth",
					block: "center",
					inline: "center",
				});
			} catch (error) {
				console.warn("[THUMBNAILS] Scroll failed:", error);
			}
		};

		// Délai court pour laisser le temps au DOM de se mettre à jour
		scrollTimeoutRef.current = setTimeout(doScroll, 100);

		return () => {
			if (scrollTimeoutRef.current) {
				clearTimeout(scrollTimeoutRef.current);
			}
		};
	}, [visibleProject, data]);

	useEffect(() => {
		thumbnailRefs.current.clear();

		return () => {
			if (scrollTimeoutRef.current) {
				clearTimeout(scrollTimeoutRef.current);
			}
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
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
							duration: 0.4,
							ease: "easeOut",
							type: "tween",
						}}
						className="will-change-opacity"
					>
						<Thumbnail item={item} />
					</motion.div>
				);
			})}
		</Sidebar>
	);
};
