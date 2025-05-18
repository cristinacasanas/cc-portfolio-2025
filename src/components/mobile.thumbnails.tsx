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

// Stocker l'état global pour persister entre les re-rendus

// Fonction de debounce pour limiter les mises à jour fréquentes

export const MobileThumbnails = () => {
	const { category, project } = useSearch({ from: "/" });
	const [visibleProject, setVisibleProject] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const thumbnailRefs = useRef<Map<string, HTMLDivElement>>(new Map());
	const scrollingRef = useRef(false);
	const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const activeProjectsRef = useRef<Set<string>>(new Set());
	const enteringProjectsRef = useRef<Set<string>>(new Set());

	// Effet pour le défilement automatique vers la vignette active
	useEffect(() => {
		if (visibleProject && containerRef.current && !scrollingRef.current) {
			const activeThumb = thumbnailRefs.current.get(visibleProject);
			if (activeThumb) {
				console.log("[MOBILE] Défilement vers:", visibleProject);
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
		}
	}, [visibleProject]);

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

	// Sort projects to display category projects first
	const sortedProjects = allProjects
		? [...allProjects].sort((a, b) => {
				if (!category || !categoryProjectIds.size) return 0;

				const aInCategory = categoryProjectIds.has(a.slug?.current || a._id);
				const bInCategory = categoryProjectIds.has(b.slug?.current || b._id);

				if (aInCategory && !bInCategory) return -1;
				if (!aInCategory && bInCategory) return 1;
				return 0;
			})
		: [];

	// Initialisation avec le projet spécifié dans l'URL ou le premier projet
	useEffect(() => {
		if (project) {
			console.log("[MOBILE] Projet défini via URL:", project);
			setVisibleProject(project);
			return;
		}

		if (allProjectsSuccess && sortedProjects.length > 0) {
			let firstProjectId: string;

			if (
				category &&
				categorySuccess &&
				categoryProjects &&
				categoryProjects.length > 0
			) {
				firstProjectId =
					categoryProjects[0].slug?.current || categoryProjects[0]._id;
			} else {
				firstProjectId =
					sortedProjects[0].slug?.current || sortedProjects[0]._id;
			}

			if (!visibleProject) {
				console.log(
					"[MOBILE] Initialisation avec le premier projet:",
					firstProjectId,
				);
				setVisibleProject(firstProjectId);
			}
		}
	}, [
		project,
		category,
		allProjects,
		allProjectsSuccess,
		categoryProjects,
		categorySuccess,
		sortedProjects,
		visibleProject,
	]);

	// Gestion des événements projectInView
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

			// Si le projet n'est plus visible du tout, le retirer des listes
			if (centrality === 0 && visibleRatio === 0) {
				if (activeProjectsRef.current.has(projectId)) {
					activeProjectsRef.current.delete(projectId);
					console.log("[MOBILE] Projet retiré des actifs:", projectId);
				}
				if (enteringProjectsRef.current.has(projectId)) {
					enteringProjectsRef.current.delete(projectId);
				}
				return;
			}

			// Si le projet entre par le haut, l'ajouter à la liste des projets entrants
			if (enteringFromTop) {
				enteringProjectsRef.current.add(projectId);
				console.log("[MOBILE] Projet entrant par le haut:", projectId);
			} else {
				enteringProjectsRef.current.delete(projectId);
			}

			// Si le projet est marqué comme actif, l'ajouter à la liste des actifs
			if (isActive) {
				activeProjectsRef.current.add(projectId);
				console.log("[MOBILE] Projet marqué comme actif:", projectId);
			} else {
				activeProjectsRef.current.delete(projectId);
			}

			// Ne pas changer de projet pendant le défilement
			if (scrollingRef.current) {
				return;
			}

			// Priorité 1: Projet entrant par le haut
			if (enteringFromTop && projectId !== visibleProject) {
				console.log(
					"[MOBILE] Changement pour projet entrant par le haut:",
					projectId,
				);
				setVisibleProject(projectId);
				return;
			}

			// Priorité 2: Projet actif
			if (isActive && projectId !== visibleProject) {
				console.log(
					"[MOBILE] Changement de projet visible:",
					projectId,
					"centrality:",
					centrality.toFixed(2),
				);
				setVisibleProject(projectId);
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
			activeProjectsRef.current.clear();
			enteringProjectsRef.current.clear();
		};
	}, [visibleProject]);

	// Détecter le scroll pour éviter les changements pendant le défilement
	useEffect(() => {
		const handleScroll = () => {
			scrollingRef.current = true;

			// Réinitialiser le timer à chaque événement de défilement
			if (scrollTimerRef.current) {
				clearTimeout(scrollTimerRef.current);
			}

			// Définir un délai après lequel on considère que le défilement est terminé
			scrollTimerRef.current = setTimeout(() => {
				scrollingRef.current = false;
				console.log(
					"[MOBILE] Fin du défilement, projets actifs:",
					Array.from(activeProjectsRef.current),
					"projets entrants:",
					Array.from(enteringProjectsRef.current),
				);

				// Priorité aux projets qui entrent par le haut
				if (enteringProjectsRef.current.size > 0) {
					const enteringProject = Array.from(enteringProjectsRef.current)[0];
					if (enteringProject !== visibleProject) {
						console.log(
							"[MOBILE] Sélection après défilement (entrant):",
							enteringProject,
						);
						setVisibleProject(enteringProject);
						return;
					}
				}

				// Sinon, sélectionner un projet actif
				if (activeProjectsRef.current.size > 0) {
					const activeProject = Array.from(activeProjectsRef.current)[0];
					if (activeProject !== visibleProject) {
						console.log(
							"[MOBILE] Sélection après défilement (actif):",
							activeProject,
						);
						setVisibleProject(activeProject);
					}
				}
			}, 150);
		};

		document.addEventListener("scroll", handleScroll, { passive: true });
		if (containerRef.current) {
			containerRef.current.addEventListener("scroll", handleScroll, {
				passive: true,
			});
		}

		return () => {
			document.removeEventListener("scroll", handleScroll);
			if (containerRef.current) {
				containerRef.current.removeEventListener("scroll", handleScroll);
			}
			if (scrollTimerRef.current) {
				clearTimeout(scrollTimerRef.current);
			}
		};
	}, [visibleProject]);

	// Nettoyage des références lors du changement de projets
	useEffect(() => {
		thumbnailRefs.current.clear();
		activeProjectsRef.current.clear();
		enteringProjectsRef.current.clear();
	}, [sortedProjects]);

	const getProjectOpacity = (projectId: string) => {
		let isVisible = projectId === visibleProject;

		if (!visibleProject && sortedProjects.length > 0) {
			if (category && categoryProjects && categoryProjects.length > 0) {
				const firstCategoryProjectId =
					categoryProjects[0].slug?.current || categoryProjects[0]._id;
				isVisible = projectId === firstCategoryProjectId;
			} else {
				const firstProjectId =
					sortedProjects[0].slug?.current || sortedProjects[0]._id;
				isVisible = projectId === firstProjectId;
			}
		}

		// Pendant le défilement, réduire le contraste pour une transition plus douce
		if (scrollingRef.current) {
			if (category) {
				const inCategory = categoryProjectIds.has(projectId);
				if (inCategory) {
					return isVisible ? 0.9 : 0.7;
				}
				return 0;
			}
			return isVisible ? 0.9 : 0.6;
		}

		// Valeurs normales quand on ne défile pas
		if (category) {
			const inCategory = categoryProjectIds.has(projectId);
			if (inCategory) {
				return isVisible ? 1 : 0.7;
			}
			return 0;
		}

		return isVisible ? 1 : 0.5;
	};

	return (
		<div
			ref={containerRef}
			className="sticky mt-2 inline-flex h-full min-h-[50px] w-screen items-start gap-1.5 self-stretch overflow-x-auto pr-3 md:hidden"
		>
			{sortedProjects.map((item) => {
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
						transition={{
							duration: scrollingRef.current ? 0.1 : 0.3,
							ease: "easeOut",
						}}
						className={clsx("max-w-1/8 transition-opacity duration-300")}
						onClick={() => {
							console.log("[MOBILE] Vignette cliquée:", projectId);
							setVisibleProject(projectId);
						}}
					>
						<Thumbnail className="h-full" item={item} />
					</motion.div>
				);
			})}
		</div>
	);
};
