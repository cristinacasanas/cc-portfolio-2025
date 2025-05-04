import { overlayStore } from "@/stores/overlay.store";
import { useStore } from "@tanstack/react-store";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
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
							<div
								data-categories="all"
								data-status="Active"
								className="inline-flex items-center justify-center gap-2.5"
							>
								<div className="font-mono uppercase leading-none">All</div>
							</div>
						</motion.div>
						<motion.div
							className="flex flex-col items-start justify-center gap-1.5"
							variants={itemVariants}
						>
							<div className="inline-flex items-center justify-center gap-2.5">
								<div className="font-mono text-text-secondary text-xs uppercase leading-none">
									UI/UX
								</div>
							</div>
						</motion.div>
						<motion.div
							className="flex flex-col items-start justify-center gap-1.5"
							variants={itemVariants}
						>
							<div className="inline-flex items-center justify-center gap-2.5">
								<div className="font-mono text-text-secondary text-xs uppercase leading-none">
									creative coding
								</div>
							</div>
						</motion.div>
						<motion.div
							className="flex flex-col items-start justify-center gap-1.5"
							variants={itemVariants}
						>
							<div className="inline-flex items-center justify-center gap-2.5">
								<div className="font-mono text-text-secondary text-xs uppercase leading-none">
									branding
								</div>
							</div>
						</motion.div>
						<motion.div
							className="flex flex-col items-start justify-center gap-1.5"
							variants={itemVariants}
						>
							<div className="inline-flex items-center justify-center gap-2.5">
								<div className="font-mono text-text-secondary text-xs uppercase leading-none">
									Édition
								</div>
							</div>
						</motion.div>
						<motion.div
							className="flex flex-col items-start justify-center gap-1.5"
							variants={itemVariants}
						>
							<div className="inline-flex items-center justify-center gap-2.5">
								<div className="font-mono text-text-secondary text-xs uppercase leading-none">
									packaging
								</div>
							</div>
						</motion.div>
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

	return (
		<div
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
		>
			<div className="inline-flex h-16 flex-col items-start justify-between pt-3 pb-2.5">
				<h3 className="justify-start font-normal font-serif text-xs leading-loose tracking-tight">
					Catégories
				</h3>
				<div className="inline-flex items-center justify-center gap-2.5">
					<h4 className="justify-start font-mono uppercase leading-none">
						All
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
