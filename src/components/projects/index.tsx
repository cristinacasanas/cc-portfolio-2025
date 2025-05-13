import Plus from "@/components/ui/icons/plus";
import { Image } from "@/components/ui/image";
import { urlFor } from "@/lib/sanity";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef } from "react";
import type { Category, Project } from "studio/sanity.types";

type ProjectWithCategories = Project & {
	expandedCategories?: Category[];
};

const ProjectCard = ({ project }: { project: ProjectWithCategories }) => {
	const [isOpen, setIsOpen] = React.useState(false);
	const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!ref.current) return;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						// Dispatch custom event when project is in view
						const event = new CustomEvent("projectInView", {
							detail: { projectId: project.slug?.current || project._id },
						});
						window.dispatchEvent(event);
					}
				}
			},
			{
				threshold: 0.3, // Project is considered in view when 30% visible
				rootMargin: "-20% 0px", // Add some margin to ensure better detection
			},
		);

		observer.observe(ref.current);

		return () => {
			if (ref.current) {
				observer.unobserve(ref.current);
			}
		};
	}, [project._id, project.slug?.current]);

	return (
		<div
			ref={ref}
			data-project-id={project.slug?.current || project._id}
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
