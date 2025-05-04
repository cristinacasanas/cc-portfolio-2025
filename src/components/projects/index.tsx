import Plus from "@/components/ui/icons/plus";
import { Image } from "@/components/ui/image";
import { motion } from "framer-motion";
import React from "react";

// Tableau d'IDs uniques pour le carousel
const CAROUSEL_ITEMS = Array.from({ length: 8 }, (_, i) => ({
	id: `carousel-item-${i}`,
	src: "https://placehold.co/108x61",
	alt: `Carousel image ${i + 1}`,
}));

const ProjectCard = () => {
	const [isOpen, setIsOpen] = React.useState(false);
	return (
		<div className="inline-flex w-full flex-col items-start justify-start gap-1.5 self-stretch md:gap-2.5">
			<CoverImage />
			<Carousel />
			<ProjectInfo isOpen={isOpen} setIsOpen={setIsOpen} />
			<ProjectDescription isOpen={isOpen} />
		</div>
	);
};

const CoverImage = () => {
	return (
		<div className="inline-flex w-full flex-col items-start justify-start gap-1.5 self-stretch md:gap-2.5">
			<Image ratio="16/9" src="https://placehold.co/934x526" alt="Cover" />
		</div>
	);
};

const Carousel = () => {
	return (
		<div className="inline-flex w-full items-center justify-between gap-1.5 overflow-x-scroll md:gap-2.5">
			{CAROUSEL_ITEMS.map((item) => (
				<Image
					key={item.id}
					className="aspect-[16/9] w-full"
					src={item.src}
					alt={item.alt}
				/>
			))}
		</div>
	);
};

const ProjectInfo = ({
	isOpen,
	setIsOpen,
}: { isOpen: boolean; setIsOpen: (isOpen: boolean) => void }) => {
	return (
		<div className="inline-flex items-center justify-between self-stretch">
			<div className="hidden w-[122px] items-start justify-start gap-1.5 py-0.5 md:flex md:gap-2.5">
				<h3 className="justify-start font-mono text-sm leading-[21px]">
					Categorie
				</h3>
			</div>
			<div className="flex w-[122px] items-start justify-center gap-1.5 py-0.5 md:gap-2.5">
				<h3 className="flex w-full justify-start font-mono text-sm leading-[21px] md:justify-center">
					Title
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

const ProjectDescription = ({ isOpen }: { isOpen: boolean }) => {
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
				Exercitation quis velit est adipisicing. Aliqua consectetur ea ut quis
				aliqua eu laboris exercitation. Lorem sint sunt consequat dolore
				voluptate anim nulla magna proident do duis sunt Lorem. Fugiat velit
				tempor quis sit ea.
			</p>
		</motion.div>
	);
};

export { ProjectCard };
