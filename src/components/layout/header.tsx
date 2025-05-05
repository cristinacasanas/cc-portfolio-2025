import { aboutStore } from "@/stores/about.store";
import { menuMobileStore } from "@/stores/menu-mobile.store";
import { overlayStore } from "@/stores/overlay.store";
import { Link } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import Close from "../ui/icons/close";
import Hamburger from "../ui/icons/hamburger";

export const Header = () => {
	const { isOpen, toggle } = useStore(aboutStore, (state) => state);
	const { isOpen: isOpenMenu, toggle: toggleMenu } = useStore(
		menuMobileStore,
		(state) => state,
	);
	const { toggle: toggleOverlay } = useStore(overlayStore, (state) => state);

	return (
		<header className="fixed top-0 right-0 left-0 z-20 inline-flex h-[var(--header-height)] border-black border-border border-b bg-background/60 px-1.5 backdrop-blur-sm md:px-3">
			<nav className="inline-flex w-full items-center justify-between">
				<div className="inline-flex items-center justify-center gap-2.5">
					<Link to="/" className="justify-start font-serif text-sm">
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
							À Propos
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
							X Fermer
						</button>
					)}
				</div>
				<div className="hidden items-center justify-center gap-2.5 px-1 py-0.5 md:flex">
					<Link
						to="/lab"
						search={{ view: "canvas" }}
						className="justify-start font-serif text-sm"
					>
						LAB
					</Link>
				</div>
				<div className="hidden w-[120px] items-center justify-between md:flex">
					<div className="flex items-center justify-center gap-2.5 px-1 py-0.5">
						<div className="justify-start font-mono text-sm">Langue</div>
					</div>
					<div className="hidden items-center justify-center gap-2.5 px-1 py-0.5 md:flex">
						<div className="justify-start font-mono text-sm">[FR]</div>
					</div>
				</div>
				<div className="flex items-center justify-center gap-2.5 md:hidden">
					<button
						type="button"
						className="relative cursor-pointer"
						onClick={() => {
							toggleMenu();
						}}
					>
						{isOpenMenu ? (
							<Close stroke="black" />
						) : (
							<Hamburger stroke="black" />
						)}
					</button>
				</div>
			</nav>
		</header>
	);
};
