import { getAllCategories } from "@/lib/queries";
import { client } from "@/lib/sanity";
import { filterMenuStore } from "@/stores/filter-menu.store";
import { overlayStore } from "@/stores/overlay.store";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import type { Categories } from "studio/sanity.types";
import Plus from "./ui/icons/plus";

export const FilterMenu = () => {
	const { isOpen } = useStore(filterMenuStore);

	return (
		<FilterWrapper>
			<FilterContent isOpen={isOpen} />
			<FilterTrigger isOpen={isOpen} />
		</FilterWrapper>
	);
};

const FilterWrapper = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="-translate-x-1/2 fixed right-0 bottom-0 left-1/2 z-20 inline-flex h-[85px] w-full items-end justify-center gap-2.5 bg-gradient-to-b from-white/0 via-white/5 to-white/10 py-5 backdrop-blur-sm md:hidden">
			<div className="inline-flex w-[290px] flex-col items-center justify-end gap-4">
				{children}
			</div>
		</div>
	);
};

const FilterContent = ({ isOpen }: { isOpen: boolean }) => {
	const { category } = useSearch({ from: "/" });
	const navigate = useNavigate();
	const { close: closeOverlay } = useStore(overlayStore);
	const { close: closeFilterMenu } = useStore(filterMenuStore);

	const { data: categories } = useQuery({
		queryKey: ["categories"],
		queryFn: () => client.fetch<Categories[]>(getAllCategories),
	});

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

	const handleCategoryClick = (categorySlug?: string) => {
		closeOverlay();
		closeFilterMenu();

		if (categorySlug) {
			navigate({
				to: "/",
				search: { category: categorySlug },
			});
		} else {
			navigate({
				to: "/",
				search: {},
			});
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: "auto" }}
					exit={{ opacity: 0, height: 0 }}
					transition={{ duration: 0.3 }}
					className="inline-flex items-center justify-start gap-0.5 self-stretch bg-background-primary/80 px-4 py-0.5 backdrop-blur-sm"
				>
					<motion.div
						className="inline-flex w-[139px] flex-col items-start justify-center gap-4 py-4.5"
						variants={containerVariants}
						initial="hidden"
						animate="show"
						exit="exit"
					>
						<motion.div
							className="flex flex-col items-start justify-center gap-3"
							variants={itemVariants}
						>
							<button
								type="button"
								data-categories="all"
								data-status="Active"
								className="inline-flex cursor-pointer items-center justify-center gap-2.5 border-0 bg-transparent p-0"
								onClick={() => handleCategoryClick()}
							>
								<div
									className={clsx(
										"font-mono uppercase leading-none",
										!category ? "text-text-primary" : "text-text-secondary",
									)}
								>
									All
								</div>
							</button>
						</motion.div>

						{categories?.map((categoryItem) => (
							<motion.div
								key={categoryItem._id}
								className="flex flex-col items-start justify-center gap-3"
								variants={itemVariants}
							>
								<button
									type="button"
									className="inline-flex cursor-pointer items-center justify-center gap-2.5 border-0 bg-transparent p-0"
									onClick={() =>
										handleCategoryClick(
											categoryItem.slug?.current || categoryItem._id,
										)
									}
								>
									<div
										className={clsx(
											"font-mono text-sm uppercase leading-none",
											category ===
												(categoryItem.slug?.current || categoryItem._id)
												? "text-text-primary"
												: "text-text-secondary",
										)}
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

const FilterTrigger = ({ isOpen }: { isOpen: boolean }) => {
	const { toggle: toggleOverlay } = useStore(overlayStore);
	const { toggle: toggleFilterMenu } = useStore(filterMenuStore);
	const { category } = useSearch({ from: "/" });

	const { data: categories } = useQuery({
		queryKey: ["categories"],
		queryFn: () => client.fetch<Categories[]>(getAllCategories),
	});

	const selectedCategory = React.useMemo(() => {
		if (!category) return "All";

		const foundCategory = categories?.find(
			(c) => c.slug?.current === category || c._id === category,
		);

		return foundCategory
			? foundCategory.title?.fr || foundCategory.title?.en
			: "All";
	}, [category, categories]);

	return (
		<div
			className="inline-flex h-16 w-[290px] cursor-pointer items-center justify-between rounded-br rounded-bl bg-background-primary/80 px-4 py-1"
			onClick={() => {
				toggleOverlay();
				toggleFilterMenu();
			}}
			onKeyDown={(e) => {
				if (e.key === "Enter") {
					toggleOverlay();
					toggleFilterMenu();
				}
			}}
		>
			<div className="inline-flex h-16 flex-col items-start justify-between gap-2 py-1 pb-2.5">
				<h3 className="justify-start font-normal font-serif text-xs leading-loose tracking-tight">
					Catégories
				</h3>
				<div className="inline-flex items-center justify-center gap-2.5">
					<h4 className="justify-start font-mono uppercase leading-none">
						{selectedCategory}
					</h4>
				</div>
			</div>
			<button
				type="button"
				className="flex cursor-pointer items-center justify-start gap-4 self-stretch"
			>
				<Plus className="size-9" isOpen={isOpen} />
			</button>
		</div>
	);
};
