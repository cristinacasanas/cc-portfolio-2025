import { Link } from "@tanstack/react-router";

export const Header = () => {
	return (
		<header className="fixed top-0 right-0 left-0 z-20 inline-flex h-[var(--header-height)] border-black border-border border-b bg-background/60 px-3 backdrop-blur-sm">
			<nav className="inline-flex w-full items-center justify-between">
				<div className="inline-flex items-center justify-center gap-2.5 px-1 py-0.5">
					<Link to="/" className="justify-start font-serif text-sm">
						CRISTINA CASAÑAS
					</Link>
				</div>

				<div
					data-mode="Light"
					data-status="Default"
					className="flex items-center justify-center gap-2.5 px-1 py-0.5"
				>
					<Link to="/about" className="justify-start font-serif text-sm">
						À Propos
					</Link>
				</div>
				<div
					data-mode="Light"
					data-status="Default"
					className="flex items-center justify-center gap-2.5 px-1 py-0.5"
				>
					<Link to="/lab" className="justify-start font-serif text-sm">
						LAB
					</Link>
				</div>
				<div
					data-langue="FR"
					data-mode="Light"
					className="flex w-[120px] items-center justify-between"
				>
					<div
						data-mode="Light"
						data-status="Default"
						className="flex items-center justify-center gap-2.5 px-1 py-0.5"
					>
						<div className="justify-start font-mono text-sm">Langue</div>
					</div>
					<div
						data-mode="Light"
						data-status="Default"
						className="flex items-center justify-center gap-2.5 px-1 py-0.5"
					>
						<div className="justify-start font-mono text-sm">[FR]</div>
					</div>
				</div>
			</nav>
		</header>
	);
};
