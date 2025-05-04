import { Link } from "@tanstack/react-router";
import { Sidebar } from "../sidebar";

export const CategoriesSidebar = () => {
	return (
		<Sidebar position="left">
			<div className="flex flex-1 flex-col items-start justify-between pt-14">
				<div className="flex flex-col items-start justify-start gap-20">
					<div className="flex flex-col items-start justify-start gap-4">
						<h3 className="justify-start font-serif leading-none">
							Catégories
						</h3>
						<div className="flex flex-col items-start justify-start gap-4 pl-4 font-mono text-[10px] text-text-secondary">
							<Link to="/" className="justify-start uppercase leading-none">
								UI /UX
							</Link>
							<Link to="/" className="justify-start uppercase leading-none">
								Creative coding
							</Link>
							<Link to="/" className="justify-start uppercase leading-none">
								branding
							</Link>
							<Link to="/" className="justify-start uppercase leading-none">
								packaging
							</Link>
							<Link to="/" className="justify-start uppercase leading-none">
								Édition
							</Link>
						</div>
					</div>
				</div>
				<div className="flex flex-col items-start justify-start gap-4 font-serif">
					<Link
						to="/"
						className="justify-start font-normal text-color-black-solid text-xs leading-none"
					>
						↗ Instagram
					</Link>
					<Link
						to="/"
						className="justify-start font-normal text-color-black-solid text-xs leading-none"
					>
						↗ Cosmos
					</Link>
					<Link
						to="/"
						className="justify-start font-normal text-color-black-solid text-xs leading-none"
					>
						↗ Mail
					</Link>
				</div>
			</div>
		</Sidebar>
	);
};
