import { listStore } from "@/stores/list.store";
import { useSearch } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { motion } from "framer-motion";
import { useState } from "react";
import { useEffect } from "react";
import { LabNav } from "./lab.nav";

export const LabFooter = ({
	isTransition = false,
}: { isTransition?: boolean }) => {
	const { view } = useSearch({ from: "/lab" });
	const { currentGlobalSizeState } = useStore(listStore);
	const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth < 768);
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const fontSize = isTransition
		? isMobile
			? "44px"
			: "96px" // Taille originale pendant la transition
		: view === "list"
			? currentGlobalSizeState === 0
				? isMobile
					? "96px"
					: "262px" // expanded
				: currentGlobalSizeState === 1
					? isMobile
						? "80px"
						: "166px" // fullscreen
					: isMobile
						? "44px"
						: "96px" // list
			: isMobile
				? "44px"
				: "96px"; // initial desktop state

	const lineHeight = isTransition
		? isMobile
			? "33.50px"
			: "96px" // Ligne originale pendant la transition
		: view === "list"
			? currentGlobalSizeState === 0
				? isMobile
					? "59.78px"
					: "195.52px"
				: currentGlobalSizeState === 1
					? isMobile
						? "33.50px"
						: "123.97px"
					: isMobile
						? "33.50px"
						: "72.17px"
			: isMobile
				? "33.50px"
				: "96px"; // adjusted to match fontSize

	return (
		<div className="pointer-events-none fixed right-0 bottom-6 left-0 z-40 flex items-end justify-between md:right-6 md:left-6">
			<motion.h1
				className="pl-4 font-extralight font-mono uppercase md:pl-0"
				animate={{
					fontSize,
					lineHeight,
				}}
				transition={{
					duration: 0.3,
					ease: "easeInOut",
				}}
			>
				Lab
			</motion.h1>
			<div className="pointer-events-auto">
				<LabNav />
			</div>
		</div>
	);
};
