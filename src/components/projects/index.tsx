import Plus from "@/components/ui/icons/plus";
import { Image } from "@/components/ui/image";

const ProjectCard = () => {
	return (
		<div
			data-device="Desktop"
			data-status="Data"
			className="inline-flex w-full flex-col items-start justify-start gap-2.5 self-stretch"
		>
			<CoverImage />
			<Carousel />
			<ProjectInfo />
		</div>
	);
};

const CoverImage = () => {
	return (
		<div
			data-device="Desktop"
			data-status="Data"
			className="inline-flex w-full flex-col items-start justify-start gap-2.5 self-stretch"
		>
			<Image ratio="16/9" src="https://placehold.co/934x526" alt="Cover" />
		</div>
	);
};

const Carousel = () => {
	return (
		<div className="inline-flex w-full items-center justify-between gap-2.5">
			{Array.from({ length: 8 }).map((_, index) => (
				<Image
					key={Math.random()}
					className="aspect-[16/9] w-full"
					src="https://placehold.co/108x61"
					alt="Carousel"
				/>
			))}
		</div>
	);
};

const ProjectInfo = () => {
	return (
		<div className="inline-flex items-center justify-between self-stretch">
			<div className="flex w-[122px] items-start justify-start gap-2.5 py-0.5">
				<h3 className="justify-start font-mono text-sm leading-[21px]">
					Categorie
				</h3>
			</div>
			<div className="flex w-[122px] items-start justify-center gap-2.5 py-0.5">
				<h3 className="w-full flex justify-center font-mono text-sm leading-[21px]">
					Title
				</h3>
			</div>
			<div className="flex w-[122px] items-center justify-center gap-2.5 py-0.5">
				<div className="flex items-center justify-start gap-2.5">
					<h3 className="justify-start font-mono text-sm leading-[21px]">
						Description
					</h3>
					<Plus />
				</div>
			</div>
		</div>
	);
};

export { ProjectCard };
