import { aboutStore } from "@/stores/about.store";
import { menuMobileStore } from "@/stores/menu-mobile.store";
import { overlayStore } from "@/stores/overlay.store";
import { Link } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { useTranslation } from "react-i18next";
import Close from "../ui/icons/close";
import Hamburger from "../ui/icons/hamburger";
import { LanguageSwitcher } from "../ui/language-switcher";

export const Header = () => {
	const { t, i18n } = useTranslation();
	const { isOpen, toggle } = useStore(aboutStore, (state) => state);
	const { isOpen: isOpenMenu, toggle: toggleMenu } = useStore(
		menuMobileStore,
		(state) => state,
	);
	const { toggle: toggleOverlay } = useStore(overlayStore, (state) => state);
	const currentLang = i18n.language.startsWith("en") ? "en" : "fr";

	return (
		<header className="fixed top-0 right-0 left-0 z-20 inline-flex h-[var(--header-height)] border-black border-border border-b bg-background/60 px-1.5 backdrop-blur-sm md:px-3">
			<nav className="inline-flex w-full items-center justify-between">
				<div className="inline-flex items-center justify-center gap-2.5">
					<Link
						to="/"
						search={{ lang: currentLang }}
						className="justify-start font-serif text-sm"
					>
						CRISTINA CASAÑAS
					</Link>
				</div>

				<div className="hidden w-16 items-center justify-center gap-2.5 px-1 py-0.5 md:flex">
					{!isOpen ? (
						<button
							type="button"
							onClick={() => {
								toggleOverlay();
								toggle();
							}}
							className="cursor-pointer justify-start font-serif text-sm"
						>
							{t("about")}
						</button>
					) : (
						<button
							type="button"
							onClick={() => {
								toggleOverlay();
								toggle();
							}}
							className="cursor-pointer justify-start font-serif text-sm"
						>
							{t("close")}
						</button>
					)}
				</div>
				<div className="hidden items-center justify-center gap-2.5 px-1 py-0.5 md:flex">
					<Link
						to="/lab"
						search={{ view: "canvas" }}
						className="justify-start font-serif text-sm"
					>
						{t("lab")}
					</Link>
				</div>
				<div className="hidden w-[120px] items-center justify-between md:flex">
					<div className="flex items-center justify-center gap-2.5 px-1 py-0.5">
						<div className="justify-start font-mono text-sm uppercase">
							{t("language")}
						</div>
					</div>
					<div className="hidden items-center justify-center gap-2.5 px-1 py-0.5 md:flex">
						<LanguageSwitcher />
					</div>
				</div>
				<div className="flex items-center justify-center gap-2.5 md:hidden">
					<button
						type="button"
						className="relative cursor-pointer"
						onClick={() => {
							if (isOpen) {
								toggleOverlay();
								toggle();
							} else if (!isOpenMenu) {
								toggleMenu();
							} else {
								toggleMenu();
							}
						}}
					>
						{isOpenMenu || isOpen ? (
							<Close
								stroke="black"
								onClick={(e) => {
									e.stopPropagation();
									toggleMenu();
									if (isOpen) {
										toggleOverlay();
										toggle();
										toggleMenu();
									}
								}}
							/>
						) : (
							<Hamburger stroke="black" />
						)}
					</button>
				</div>
			</nav>
		</header>
	);
};
