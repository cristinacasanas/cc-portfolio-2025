import { aboutStore } from "@/stores/about.store";
import { Link } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { AnimatePresence, motion } from "framer-motion";

export const AboutModal = () => {
	const { isOpen } = useStore(aboutStore, (state) => state);
	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ x: -100, opacity: 0 }}
					animate={{ x: 0, opacity: 1 }}
					exit={{ x: -100, opacity: 0 }}
					transition={{ duration: 0.3 }}
					data-device="Desktop"
					className="absolute top-[var(--header-height)] left-0 z-50 inline-flex h-[982px] h-[calc(100dvh-var(--header-height))] w-[455px] flex-col items-start justify-between border-black border-r bg-background-primary/80 pt-14 pr-2 pb-6 pl-4 backdrop-blur-sm"
				>
					<div className="inline-flex flex-1 items-start justify-between self-stretch">
						<div className="inline-flex flex-col items-start justify-between self-stretch">
							<div className="flex flex-col items-start justify-start gap-20">
								<div className="flex w-80 flex-col items-start justify-start gap-2">
									<h2 className="justify-start font-normal font-serif leading-none">
										À propos
									</h2>
									<div className="flex flex-col items-start justify-start gap-6 self-stretch pl-4">
										<p className="font-mono text-[10px] text-text-secondary uppercase leading-[15px]">
											Directrice Artistique / Graphiste basée à Paris avec une
											forte expérience en graphisme, UI/UX, web design et
											storytelling visuel. Maîtrise des outils tels que Figma et
											Adobe Creative Suite, et connaissances en HTML, CSS et
											JavaScript. Collaborative, soucieuse du détail et dédiée à
											fournir des solutions créatives.{" "}
										</p>
										<p className="font-mono text-[10px] text-text-secondary uppercase leading-[15px]">
											↓ MA en Direction Artistique UI/UX à LISAA Graphisme
											Paris, (2024). ↓ Diplôme de Bachelor en Graphic Design et
											Communication Visuelle à BAU, College of Art and Design de
											Barcelone, (2018-2022).
										</p>
									</div>
								</div>
								<div className="flex flex-col items-start justify-start gap-2">
									<h2 className="font-normal font-serif leading-none">
										Presse - Exposition
									</h2>
									<div className="flex flex-col gap-2 pl-4">
										<div className="justify-start">
											<span className="font-mono text-[10px] text-text-secondary uppercase leading-none">
												↗{" "}
											</span>
											<Link
												className="font-mono text-[10px] text-text-secondary uppercase leading-none underline"
												to="/"
											>
												Las etiquetas de vino más inspiradoras
											</Link>
										</div>
									</div>
								</div>
							</div>
							<div className="flex h-20 flex-col justify-between">
								<Link className="font-serif text-[10px] leading-none" to="/">
									↗ Instagram
								</Link>
								<Link className="font-serif text-[10px] leading-none" to="/">
									↗ Cosmos
								</Link>
								<Link className="font-serif text-[10px] leading-none" to="/">
									↗ Mail
								</Link>
							</div>
						</div>
						<img
							className="h-[125px] w-[100px] p-0.5"
							src="https://placehold.co/100x125"
							alt="Portrait de Cristina"
						/>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};
