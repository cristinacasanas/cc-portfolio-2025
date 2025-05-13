import { aboutStore } from "@/stores/about.store";
import { menuMobileStore } from "@/stores/menu-mobile.store";
import { overlayStore } from "@/stores/overlay.store";
import { Link } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../ui/language-switcher";

export const MenuMobile = () => {
	const { isOpen, toggle: toggleMenu } = useStore(menuMobileStore);
	const { t, i18n } = useTranslation();
	const { toggle: toggleAbout } = useStore(aboutStore, (state) => state);
	const { toggle: toggleOverlay } = useStore(overlayStore, (state) => state);

	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setIsVisible(true);
		}
	}, [isOpen]);

	const handleAnimationComplete = () => {
		if (!isOpen) {
			setIsVisible(false);
		}
	};

	const currentLang = i18n.language.startsWith("en") ? "en" : "fr";

	return (
		<AnimatePresence>
			{(isOpen || isVisible) && (
				<motion.div
					initial={{ opacity: 0, filter: "blur(8px)" }}
					animate={{
						opacity: isOpen ? 1 : 0,
						filter: isOpen ? "blur(0px)" : "blur(10px)",
					}}
					exit={{
						opacity: 0,
						filter: "blur(10px)",
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
							<div className="justify-start font-['PP_Editorial_New'] font-normal text-base text-color-black-solid leading-[21px]">
								<Link to="/" search={{ lang: currentLang }}>
									{t("projects")}
								</Link>
							</div>
						</div>
						<div className="inline-flex items-center justify-center gap-2.5 px-1 py-0.5">
							<div className="justify-start font-extralight font-serif text-base text-color-black-solid leading-[21px]">
								<button
									className="cursor-pointer"
									type="button"
									onClick={() => {
										toggleMenu();
										toggleAbout();
										toggleOverlay();
									}}
								>
									{t("about")}
								</button>
							</div>
						</div>
						<div className="inline-flex items-center justify-center gap-2.5 px-1 py-0.5">
							<div className="justify-start font-extralight font-serif text-base text-color-black-solid leading-[21px]">
								<Link to="/lab" search={{ view: "canvas" }}>
									{t("lab")}
								</Link>
							</div>
						</div>
					</div>
					<div className="inline-flex w-full justify-end gap-4">
						<div className="flex items-center justify-center gap-2.5 px-1 py-0.5">
							<div className="justify-start font-['PP_Neue_Montreal_Mono'] text-Secondary-Body text-[10px] uppercase leading-[21px]">
								{t("language")}
							</div>
						</div>
						<div className="flex items-center justify-center gap-2.5 px-1 py-0.5">
							<LanguageSwitcher />
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};
