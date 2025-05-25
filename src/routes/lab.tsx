import { LabNav } from "@/components/layout/lab.nav";
import { listStore } from "@/stores/list.store";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { motion } from "framer-motion";
import { Suspense, lazy, useEffect, useState } from "react";

// Use lazy loading for the LabView component
const LabView = lazy(() => import("@/views/lab.view"));

export const Route = createFileRoute("/lab")({
	component: LabRouteComponent,
	validateSearch: (search: Record<string, unknown>) => {
		// Extract and validate the view parameter
		const view = search?.view?.toString() || "canvas";
		return {
			view:
				view === "grid" || view === "canvas" || view === "list"
					? view
					: "canvas",
		};
	},
});

function LabRouteComponent() {
	// Get the view from search params
	const { view } = useSearch({ from: "/lab" });

	return (
		// This div will now be a child of the main <Container> from __root.tsx
		// Adjust styling as needed if it's meant to fill the container or have specific layout within it.
		<div className="h-full w-full pt-[var(--header-height)]">
			<Suspense>
				<LabView initialView={view} />
			</Suspense>
			<LabFooter />
			<div className="fixed bottom-0 left-0 h-28 w-screen bg-background-primary/10 backdrop-blur-[2px]" />
		</div>
	);
}

export const LabFooter = () => {
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

	const fontSize =
		view === "list"
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

	const lineHeight =
		view === "list"
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
		<div className="pointer-events-none fixed right-6 bottom-6 left-6 z-50 flex items-end justify-between">
			<motion.h1
				className="font-extralight font-mono uppercase"
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
