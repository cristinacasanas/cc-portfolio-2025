import { menuMobileStore } from "@/stores/menu-mobile.store";
import { Link } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export const MenuMobile = () => {
	const { isOpen } = useStore(menuMobileStore);
	// État local pour gérer la visibilité du composant pendant l'animation
	const [isVisible, setIsVisible] = useState(false);

	// Synchroniser isVisible avec isOpen
	useEffect(() => {
		if (isOpen) {
			setIsVisible(true);
		}
	}, [isOpen]);

	// Gérer l'animation de fermeture complète
	const handleAnimationComplete = () => {
		if (!isOpen) {
			setIsVisible(false);
		}
	};

	return (
		<AnimatePresence>
			{(isOpen || isVisible) && (
				<motion.div
					initial={{ opacity: 0, filter: "blur(8px)" }}
					animate={{
						opacity: isOpen ? 1 : 0,
						filter: isOpen ? "blur(0px)" : "blur(8px)",
					}}
					exit={{
						opacity: 0,
						filter: "blur(8px)",
					}}
					transition={{
						duration: 0.3,
						ease: "easeInOut",
					}}
					onAnimationComplete={handleAnimationComplete}
					className="absolute top-[var(--header-height)] left-0 z-20 inline-flex h-[294px] w-full flex-col items-start justify-between self-stretch bg-background-primary/80 px-4 py-6 backdrop-blur-sm md:hidden"
				>
					<div className="flex flex-col items-start justify-start gap-10">
						<div className="inline-flex items-center justify-center gap-2.5 px-1 py-0.5">
							<div className="justify-start font-['PP_Editorial_New'] font-normal text-color-black-solid text-base leading-[21px]">
								<Link to="/">Projects</Link>
							</div>
						</div>
						<div className="inline-flex items-center justify-center gap-2.5 px-1 py-0.5">
							<div className="justify-start font-['PP_Editorial_New'] font-extralight text-color-black-solid text-base leading-[21px]">
								<a href="/about" className="hover:underline">
									À Propos
								</a>
							</div>
						</div>
						<div className="inline-flex items-center justify-center gap-2.5 px-1 py-0.5">
							<div className="justify-start font-['PP_Editorial_New'] font-extralight text-color-black-solid text-base leading-[21px]">
								<Link to="/lab" search={{ view: "canvas" }}>
									LAB
								</Link>
							</div>
						</div>
					</div>
					<div className="inline-flex w-full items-start justify-end gap-4">
						<div className="flex items-center justify-center gap-2.5 px-1 py-0.5">
							<div className="justify-start font-['PP_Neue_Montreal_Mono'] text-Secondary-Body text-[10px] uppercase leading-[21px]">
								Langue
							</div>
						</div>
						<div className="flex items-center justify-center gap-2.5 px-1 py-0.5">
							<div className="justify-start font-['PP_Neue_Montreal_Mono'] text-[10px] text-color-black-solid uppercase leading-[21px]">
								[FR]
							</div>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};
