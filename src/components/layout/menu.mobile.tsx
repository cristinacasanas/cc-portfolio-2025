import { aboutStore } from "@/stores/about.store";
import { menuMobileStore } from "@/stores/menu-mobile.store";
import { overlayStore } from "@/stores/overlay.store";
import { Link } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../ui/language-switcher";

type MenuItemProps = {
	to?: string;
	search?: Record<string, string>;
	onClick?: () => void;
	children: React.ReactNode;
	className?: string;
};

const MenuItem = ({
	to,
	search,
	onClick,
	children,
	className = "font-serif text-base text-color-black-solid leading-[21px] font-extralight",
}: MenuItemProps) => {
	const { close: closeMenu } = useStore(menuMobileStore);

	const handleClick = () => {
		closeMenu();
		onClick?.();
	};

	return (
		<div className="inline-flex items-center justify-center gap-2.5 px-1 py-0.5">
			<div className={clsx("justify-start", className)}>
				{to ? (
					<Link to={to} search={search} onClick={closeMenu}>
						{children}
					</Link>
				) : (
					<button
						className="cursor-pointer"
						type="button"
						onClick={handleClick}
					>
						{children}
					</button>
				)}
			</div>
		</div>
	);
};

export const MenuMobile = () => {
	const { isOpen, close: closeMenu } = useStore(menuMobileStore);
	const { toggle: toggleAbout } = useStore(aboutStore);
	const { toggle: toggleOverlay } = useStore(overlayStore);
	const { t, i18n } = useTranslation();

	const [isVisible, setIsVisible] = useState(false);
	const currentLang = i18n.language.startsWith("en") ? "en" : "fr";

	useEffect(() => {
		if (isOpen) setIsVisible(true);
	}, [isOpen]);

	const handleAnimationComplete = () => {
		if (!isOpen) setIsVisible(false);
	};

	const handleAboutClick = () => {
		closeMenu();
		toggleAbout();
		toggleOverlay();
	};

	const menuAnimationProps = {
		initial: { opacity: 0, filter: "blur(8px)" },
		animate: {
			opacity: isOpen ? 1 : 0,
			filter: isOpen ? "blur(0px)" : "blur(10px)",
		},
		exit: {
			opacity: 0,
			filter: "blur(10px)",
		},
		transition: {
			duration: 0.3,
			ease: "easeInOut",
		},
	};

	return (
		<AnimatePresence>
			{(isOpen || isVisible) && (
				<motion.div
					{...menuAnimationProps}
					onAnimationComplete={handleAnimationComplete}
					className="absolute top-[var(--header-height)] left-0 z-20 inline-flex h-auto w-full flex-col items-start justify-between gap-6 self-stretch bg-background-primary/80 px-4 pt-8 pb-6 backdrop-blur-sm md:hidden"
				>
					<div className="flex flex-col items-start justify-start gap-8">
						<MenuItem
							to="/"
							search={{ lang: currentLang }}
							className="font-normal font-serif text-base text-color-black-solid leading-[21px]"
						>
							{t("projects")}
						</MenuItem>

						<MenuItem
							onClick={handleAboutClick}
							className="font-extralight font-serif text-base text-color-black-solid leading-[21px]"
						>
							{t("about")}
						</MenuItem>

						<MenuItem
							to="/lab"
							search={{ view: "list" }}
							className="font-extralight font-serif text-base leading-[21px]"
						>
							{t("lab")}
						</MenuItem>
					</div>

					<div className="inline-flex w-full justify-end gap-4">
						<div className="flex items-center justify-center gap-2.5 px-1 py-0.5">
							<div className="justify-start font-mono text-[10px] uppercase leading-[21px]">
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
