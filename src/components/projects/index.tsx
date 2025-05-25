import Plus from "@/components/ui/icons/plus";
import { Image } from "@/components/ui/image";
import { urlFor } from "@/lib/sanity";
import {
	clear as clearScrollService,
	registerProject,
} from "@/lib/scroll.service";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef } from "react";
import type { Category, Project } from "studio/sanity.types";

type ProjectWithCategories = Project & {
	expandedCategories?: Category[];
};

// Référence globale pour suivre tous les projets et leurs positions
export const projectsRegistry = {
	projects: new Map<string, { element: HTMLDivElement; position: number }>(),
	lastProjectId: null as string | null,

	// Méthode pour enregistrer un projet
	registerProject(id: string, element: HTMLDivElement, position: number) {
		this.projects.set(id, { element, position });
		// Enregistrer également dans le ScrollService
		registerProject(id, element);
		// Mettre à jour le dernier projet (celui avec la position la plus élevée)
		if (
			this.lastProjectId === null ||
			position > (this.projects.get(this.lastProjectId)?.position || 0)
		) {
			this.lastProjectId = id;
		}
	},

	// Méthode pour vérifier si un projet est le dernier
	isLastProject(id: string): boolean {
		return id === this.lastProjectId;
	},

	// Méthode pour nettoyer le registre
	clear() {
		this.projects.clear();
		this.lastProjectId = null;
		clearScrollService();
	},
};

const ProjectCard = ({ project }: { project: ProjectWithCategories }) => {
	const [isOpen, setIsOpen] = React.useState(false);
	const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
	const ref = useRef<HTMLDivElement>(null);
	const projectId = project.slug?.current || project._id;

	// Enregistrer la position du projet lors du montage
	useEffect(() => {
		if (!ref.current) return;

		// Calculer la position verticale du projet dans le document
		const position = ref.current.getBoundingClientRect().top + window.scrollY;
		projectsRegistry.registerProject(projectId, ref.current, position);

		console.log(
			"[PROJECT_DEBUG] Projet enregistré:",
			projectId,
			"position:",
			position,
			"est dernier:",
			projectsRegistry.isLastProject(projectId),
		);

		return () => {
			// Si tous les projets sont démontés, nettoyer le registre
			if (document.querySelectorAll("[data-project-id]").length === 1) {
				projectsRegistry.clear();
			}
		};
	}, [projectId]);

	useEffect(() => {
		if (!ref.current) return;

		console.log(
			"[PROJECT_DEBUG] Initialisation de l'observer pour:",
			projectId,
		);

		// Utiliser des seuils différents selon le type d'appareil
		const isMobile = window.innerWidth < 768;
		const observerOptions = {
			// Utiliser moins de seuils pour une détection plus stable
			threshold: isMobile
				? [0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
				: [0, 0.25, 0.5, 0.75, 1.0],
			// Réduire la marge pour détecter les projets plus tôt
			rootMargin: isMobile ? "-2% 0px" : "-15% 0px",
		};

		console.log("[PROJECT_DEBUG] Options de l'observer:", observerOptions);

		// Fonction pour calculer le pourcentage du projet visible dans la fenêtre
		const calculateVisibleRatio = (rect: DOMRectReadOnly): number => {
			const visibleTop = Math.max(0, rect.top);
			const visibleBottom = Math.min(window.innerHeight, rect.bottom);
			const visibleHeight = Math.max(0, visibleBottom - visibleTop);
			return visibleHeight / rect.height;
		};

		// Fonction pour calculer à quel point le projet est centré dans la vue
		const calculateCentrality = (rect: DOMRectReadOnly): number => {
			const projectCenter = rect.top + rect.height / 2;
			const viewportCenter = window.innerHeight / 2;
			const distanceFromCenter = Math.abs(projectCenter - viewportCenter);
			const maxDistance = window.innerHeight / 2;

			// Plus la valeur est proche de 1, plus le projet est centré
			return 1 - Math.min(1, distanceFromCenter / maxDistance);
		};

		// Fonction pour déterminer si le projet est entrant par le haut
		const isEnteringFromTop = (rect: DOMRectReadOnly): boolean => {
			// Le projet est considéré comme "entrant par le haut" si son bord supérieur
			// est proche du haut de la fenêtre (entre 0 et 20% de la hauteur de la fenêtre)
			const topEdgePosition = rect.top;
			return topEdgePosition >= 0 && topEdgePosition < window.innerHeight * 0.2;
		};

		// Fonction pour vérifier si on est au bas de la page
		const isNearBottomOfPage = (): boolean => {
			const scrollPosition = window.scrollY + window.innerHeight;
			const documentHeight = document.documentElement.scrollHeight;
			// Considérer qu'on est près du bas si on est à moins de 5% de la fin
			return documentHeight - scrollPosition < documentHeight * 0.05;
		};

		const observer = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				const boundingRect = entry.boundingClientRect;

				// Calculer les métriques de visibilité
				const visibleRatio = calculateVisibleRatio(boundingRect);
				const centrality = calculateCentrality(boundingRect);
				const isInTopHalf =
					boundingRect.top + boundingRect.height / 2 < window.innerHeight / 2;
				const enteringFromTop = isEnteringFromTop(boundingRect);
				const isLastProject = projectsRegistry.isLastProject(projectId);
				const isAtBottom = isNearBottomOfPage();

				// Calculer un score global qui favorise:
				// 1. Les projets qui entrent par le haut de l'écran
				// 2. Les projets bien visibles
				// 3. Les projets centrés dans la vue
				let visibilityScore = visibleRatio * 0.4 + centrality * 0.6;

				// Bonus important pour les projets qui entrent par le haut
				if (enteringFromTop) {
					visibilityScore += 0.3;
				}

				// Bonus spécial pour le dernier projet quand on est en bas de page
				if (isLastProject && isAtBottom && visibleRatio > 0.3) {
					visibilityScore += 0.5;
					console.log(
						"[PROJECT_DEBUG] Dernier projet détecté en bas de page:",
						projectId,
					);
				}

				console.log("[PROJECT_DEBUG] Intersection détectée:", {
					projectId,
					isIntersecting: entry.isIntersecting,
					intersectionRatio: entry.intersectionRatio.toFixed(2),
					visibleRatio: visibleRatio.toFixed(2),
					centrality: centrality.toFixed(2),
					enteringFromTop,
					isLastProject,
					isAtBottom,
					visibilityScore: visibilityScore.toFixed(2),
					isInTopHalf,
					position: {
						top: boundingRect.top,
						bottom: boundingRect.bottom,
					},
				});

				// Déterminer si ce projet doit être considéré comme "visible"
				// On utilise un seuil plus élevé pour éviter les faux positifs
				// MAIS on donne une priorité aux projets qui entrent par le haut
				// OU au dernier projet quand on est en bas de page
				const isSignificantlyVisible = isMobile
					? visibilityScore > 0.4 ||
						enteringFromTop ||
						(centrality > 0.8 && visibleRatio > 0.2) ||
						(isLastProject && isAtBottom && visibleRatio > 0.3)
					: entry.intersectionRatio > 0.3;

				if (entry.isIntersecting && isSignificantlyVisible) {
					// Dispatch custom event when project is in view
					const event = new CustomEvent("projectInView", {
						detail: {
							projectId,
							isInTopHalf,
							intersectionRatio: visibilityScore,
							centrality,
							visibleRatio,
							enteringFromTop,
							// Un projet est actif s'il est bien centré OU s'il entre par le haut
							// OU s'il est le dernier projet et qu'on est en bas de page
							isActive:
								(centrality > 0.7 && visibleRatio > 0.3) ||
								enteringFromTop ||
								(isLastProject && isAtBottom && visibleRatio > 0.3),
						},
					});

					console.log(
						"[PROJECT_DEBUG] Émission de l'événement projectInView:",
						projectId,
						"score:",
						visibilityScore.toFixed(2),
						"enteringFromTop:",
						enteringFromTop,
						"isLastProject:",
						isLastProject,
						"isAtBottom:",
						isAtBottom,
						"isActive:",
						(centrality > 0.7 && visibleRatio > 0.3) ||
							enteringFromTop ||
							(isLastProject && isAtBottom && visibleRatio > 0.3),
					);

					window.dispatchEvent(event);
				} else if (entry.intersectionRatio === 0) {
					// Émettre un événement quand le projet n'est plus visible du tout
					const event = new CustomEvent("projectInView", {
						detail: {
							projectId,
							isInTopHalf: false,
							intersectionRatio: 0,
							centrality: 0,
							visibleRatio: 0,
							enteringFromTop: false,
							isActive: false,
						},
					});

					console.log("[PROJECT_DEBUG] Projet hors de vue:", projectId);

					window.dispatchEvent(event);
				}
			}
		}, observerOptions);

		observer.observe(ref.current);

		return () => {
			if (ref.current) {
				console.log("[PROJECT_DEBUG] Nettoyage de l'observer pour:", projectId);
				observer.unobserve(ref.current);
			}
		};
	}, [projectId]);

	return (
		<div
			ref={ref}
			data-project-id={projectId}
			className="inline-flex w-full flex-col items-start justify-start gap-1.5 self-stretch md:gap-2.5"
		>
			<CoverImage
				cover={project.gallery}
				title={project.title}
				index={currentImageIndex}
			/>
			<Carousel
				images={project.gallery}
				currentIndex={currentImageIndex}
				setCurrentIndex={setCurrentImageIndex}
			/>
			<ProjectInfo isOpen={isOpen} setIsOpen={setIsOpen} project={project} />
			<ProjectDescription
				isOpen={isOpen}
				description={project.description?.fr || ""}
			/>
		</div>
	);
};

const CoverImage = ({
	cover,
	title,
	index,
}: {
	cover: Project["gallery"];
	title?: string;
	index: number;
}) => {
	return (
		<div className="relative inline-flex w-full flex-col items-start justify-start gap-1.5 self-stretch overflow-hidden md:gap-2.5">
			<AnimatePresence mode="wait">
				<motion.div
					key={index}
					initial={{ opacity: 0.2, filter: "blur(3px)" }}
					animate={{ opacity: 1, filter: "blur(0px)" }}
					transition={{ duration: 0.3, ease: "easeInOut" }}
					className="w-full"
				>
					<Image
						className="max-h-[526px] w-full"
						ratio="16/9"
						src={
							cover?.[index]?.asset?._ref ? urlFor(cover?.[index]).url() : ""
						}
						alt={title || "Project cover image"}
						draggable={false}
					/>
				</motion.div>
			</AnimatePresence>
		</div>
	);
};

const Carousel = ({
	images,
	currentIndex,
	setCurrentIndex,
}: {
	images: Project["gallery"];
	currentIndex: number;
	setCurrentIndex: (index: number) => void;
}) => {
	return (
		<div className="inline-flex w-full items-center gap-1.5 overflow-x-scroll md:gap-2.5">
			{images?.map((image, index) => (
				<Image
					className={clsx(
						"max-h-[61px] max-w-[108px] cursor-pointer",
						currentIndex !== index && "opacity-50",
					)}
					onClick={() => setCurrentIndex(index)}
					key={image._key}
					ratio="16/9"
					src={image.asset?._ref ? urlFor(image).url() : ""}
					alt={image.alt || ""}
					draggable={false}
				/>
			))}
		</div>
	);
};

const ProjectInfo = ({
	isOpen,
	setIsOpen,
	project,
}: {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	project: ProjectWithCategories;
}) => {
	return (
		<div className="inline-flex items-center justify-between self-stretch">
			<div className="hidden w-[122px] items-start justify-start gap-1.5 py-0.5 md:flex md:gap-2.5">
				<h3 className="justify-start font-mono text-sm leading-[21px]">
					{project.expandedCategories
						?.map((category) => category.title?.fr || category.title?.en || "")
						.filter(Boolean)
						.join(", ")}
				</h3>
			</div>
			<div className="flex w-[122px] items-start justify-center gap-1.5 py-0.5 md:gap-2.5">
				<h3 className="flex w-full justify-start font-mono text-sm leading-[21px] md:justify-center md:text-center">
					{project.title}
				</h3>
			</div>
			<div className="flex w-[122px] items-center justify-center gap-1.5 py-0.5 md:gap-2.5">
				<button
					type="button"
					className="flex cursor-pointer items-center justify-start gap-2.5 border-none bg-transparent p-0"
					onClick={() => setIsOpen(!isOpen)}
					aria-expanded={isOpen}
				>
					<h3 className="justify-start font-mono text-sm leading-[21px]">
						Description
					</h3>

					<Plus className="size-4" isOpen={isOpen} />
				</button>
			</div>
		</div>
	);
};

const ProjectDescription = ({
	isOpen,
	description,
}: { isOpen: boolean; description: string }) => {
	return (
		<motion.div
			initial={false}
			animate={{
				height: isOpen ? "auto" : 0,
				opacity: isOpen ? 1 : 0,
				filter: isOpen ? "blur(0px)" : "blur(3px)",
			}}
			transition={{
				duration: 0.3,
				ease: "easeInOut",
			}}
			className="overflow-hidden"
		>
			<p className="py-2 text-center font-mono text-xs leading-[18px] md:text-sm md:leading-[21px]">
				{description}
			</p>
		</motion.div>
	);
};

export { ProjectCard };
