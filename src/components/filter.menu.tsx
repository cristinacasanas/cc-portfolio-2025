import { getAllCategories } from "@/lib/queries";
import { client } from "@/lib/sanity";
import { overlayStore } from "@/stores/overlay.store";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import type { Category } from "studio/sanity.types";
import Plus from "./ui/icons/plus";

export const FilterMenu = () => {
	const [isOpen, setIsOpen] = React.useState(false);

	return (
		<FilterWrapper>
			<FilterContent isOpen={isOpen} />
			<FilterTrigger isOpen={isOpen} setIsOpen={setIsOpen} />
		</FilterWrapper>
	);
};

const FilterWrapper = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="-translate-x-1/2 fixed right-0 bottom-0 left-1/2 z-20 inline-flex h-[85px] w-full items-end justify-center gap-2.5 bg-gradient-to-b from-white/0 via-white/5 to-white/10 py-5 backdrop-blur-[2px] md:hidden">
			<div className="inline-flex w-[290px] flex-col items-center justify-end gap-4">
				{children}
			</div>
		</div>
	);
};

const FilterContent = ({ isOpen }: { isOpen: boolean }) => {
	const navigate = useNavigate();
	const { category, project } = useSearch({ from: "/" });

	const { data: categories } = useQuery({
		queryKey: ["categories"],
		queryFn: () => client.fetch<Category[]>(getAllCategories),
	});

	const handleCategoryClick = (categorySlug: string) => {
		if (categorySlug === "all") {
			if (project) {
				navigate({
					to: "/",
					search: { project },
					replace: true,
				});
			} else {
				navigate({
					to: "/",
					search: {},
					replace: true,
				});
			}
		} else {
			const search: Record<string, string> = { category: categorySlug };

			if (project) {
				search.project = project;
			}

			navigate({
				to: "/",
				search,
				replace: true,
			});
		}
	};

	const containerVariants = {
		hidden: { opacity: 0 },
		show: {
			opacity: 1,
			transition: {
				staggerChildren: 0.05,
				delayChildren: 0.1,
			},
		},
		exit: {
			opacity: 0,
			transition: {
				staggerChildren: 0.03,
				staggerDirection: -1,
			},
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, x: -10, filter: "blur(10px)" },
		show: { opacity: 1, x: 0, filter: "blur(0px)" },
		exit: { opacity: 0, x: -10, filter: "blur(10px)" },
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: "264px" }}
					exit={{ opacity: 0, height: 0 }}
					transition={{ duration: 0.3 }}
					className="inline-flex items-center justify-start gap-0.5 self-stretch rounded-sm bg-background-primary/80 px-4 py-0.5 backdrop-blur-sm"
				>
					<motion.div
						className="inline-flex w-[139px] flex-col items-start justify-center gap-3"
						variants={containerVariants}
						initial="hidden"
						animate="show"
						exit="exit"
					>
						<motion.div
							className="flex flex-col items-start justify-center gap-1.5"
							variants={itemVariants}
						>
							<button
								type="button"
								onClick={() => handleCategoryClick("all")}
								className="inline-flex items-center justify-center gap-2.5"
							>
								<div
									className={`font-mono uppercase leading-none ${!category ? "text-text-primary" : "text-text-secondary text-xs"}`}
								>
									Tous
								</div>
							</button>
						</motion.div>

						{categories?.map((categoryItem) => (
							<motion.div
								key={categoryItem._id}
								className="flex flex-col items-start justify-center gap-1.5"
								variants={itemVariants}
							>
								<button
									type="button"
									onClick={() =>
										handleCategoryClick(
											categoryItem.slug?.current || categoryItem._id,
										)
									}
									className="inline-flex items-center justify-center gap-2.5"
								>
									<div
										className={`font-mono uppercase leading-none ${
											category ===
											(categoryItem.slug?.current || categoryItem._id)
												? "text-text-primary"
												: "text-text-secondary text-xs"
										}`}
									>
										{categoryItem.title?.fr || categoryItem.title?.en || ""}
									</div>
								</button>
							</motion.div>
						))}
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

const FilterTrigger = ({
	isOpen,
	setIsOpen,
}: { isOpen: boolean; setIsOpen: (isOpen: boolean) => void }) => {
	const { toggle } = useStore(overlayStore, (state) => state);
	const { category } = useSearch({ from: "/" });
	const { data: categories } = useQuery({
		queryKey: ["categories"],
		queryFn: () => client.fetch<Category[]>(getAllCategories),
	});

	// Find the currently selected category
	const selectedCategory = React.useMemo(() => {
		if (!category) return "All";

		const found = categories?.find(
			(c) => (c.slug?.current || c._id) === category,
		);

		return found ? found.title?.fr || found.title?.en : "All";
	}, [category, categories]);

	return (
		<button
			type="button"
			className="inline-flex h-16 w-[290px] cursor-pointer items-center justify-between rounded-br rounded-bl bg-background-primary/80 px-4 py-1"
			onClick={() => {
				toggle();
				setIsOpen(!isOpen);
			}}
			onKeyDown={(e) => {
				if (e.key === "Enter") {
					toggle();
					setIsOpen(!isOpen);
				}
			}}
			aria-label="Toggle category filter menu"
		>
			<div className="inline-flex h-16 flex-col items-start justify-between pt-3 pb-2.5">
				<h3 className="justify-start font-normal font-serif text-xs leading-loose tracking-tight">
					Catégories
				</h3>
				<div className="inline-flex items-center justify-center gap-2.5">
					<h4 className="justify-start font-mono uppercase leading-none">
						{selectedCategory}
					</h4>
				</div>
			</div>
			<span className="flex cursor-pointer items-center justify-start gap-4 self-stretch">
				<Plus className="size-9" isOpen={isOpen} />
			</span>
		</button>
	);
};
