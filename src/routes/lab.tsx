import { LabFooter } from "@/components/layout/lab-footer";
import { LabFooterOverlay } from "@/components/layout/lab-footer.overlay";
import { getLab } from "@/lib/queries/lab";
import { client } from "@/lib/sanity";
import { TransitionView } from "@/views/transition.view";
import {
	createFileRoute,
	useLocation,
	useSearch,
} from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Suspense, lazy, useEffect, useState } from "react";
import type { Lab } from "studio/sanity.types";

const LabView = lazy(() => import("@/views/lab.view"));

// Key for session storage to track first visit
const FIRST_LAB_VISIT_KEY = "first-lab-visit";

export const Route = createFileRoute("/lab")({
	component: LabRouteComponent,
	validateSearch: (search: Record<string, unknown>) => {
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
	useSearch({ from: "/lab" });
	const [showTransition, setShowTransition] = useState(true);
	const location = useLocation();

	useEffect(() => {
		console.log("Lab component mounted");

		// Check if this is the first time we've loaded the lab page in this session
		// If we've never set the flag, this is our first visit
		const isFirstVisit = !sessionStorage.getItem(FIRST_LAB_VISIT_KEY);
		console.log("Is first lab visit:", isFirstVisit);

		if (!isFirstVisit) {
			console.log("Skipping transition - not first visit");
			setShowTransition(false);
			return;
		}

		// Mark that we've visited the lab page
		sessionStorage.setItem(FIRST_LAB_VISIT_KEY, "true");
		console.log("Setting first visit flag");

		// Show the transition for the first visit
		console.log("Showing transition for first visit");

		// Preload images
		const preloadImages = async () => {
			try {
				const data = await client.fetch<Lab[]>(getLab);
				const allImages = data.flatMap(
					(lab) =>
						lab.images
							?.map((img) => (img as { asset?: { url?: string } }).asset?.url)
							.filter((url): url is string => Boolean(url)) || [],
				);

				const imagePromises = allImages.slice(0, 20).map((url: string) => {
					return new Promise((resolve, reject) => {
						const img = new Image();
						img.onload = resolve;
						img.onerror = reject;
						img.src = url;
					});
				});

				await Promise.allSettled(imagePromises);
			} catch (error) {
				console.log("Image preloading failed:", error);
			}
		};

		preloadImages();

		// Hide transition after 4 seconds
		const timer = setTimeout(() => {
			setShowTransition(false);
		}, 4000);

		return () => {
			clearTimeout(timer);
			// Note: we intentionally DON'T clear the session storage
			// so the flag persists during the browser session
		};
	}, []);

	// When the component unmounts (navigating away from lab)
	useEffect(() => {
		return () => {
			// Clear the flag when navigating away from lab,
			// so next time we come back, we'll see the animation again
			sessionStorage.removeItem(FIRST_LAB_VISIT_KEY);
			console.log("Cleared first visit flag");
		};
	}, []);

	return (
		<div>
			<AnimatePresence mode="wait">
				{showTransition ? (
					<motion.div
						key="transition"
						initial={{ opacity: 0, filter: "blur(1.5px)" }}
						animate={{ opacity: 1, filter: "blur(0px)" }}
						exit={{ opacity: 0, filter: "blur(1.5px)" }}
						transition={{
							duration: 0.8,
							ease: "easeOut",
						}}
						className="flex h-full w-full items-center justify-center pt-[var(--header-height)]"
					>
						<TransitionView />
					</motion.div>
				) : (
					<motion.div
						key="lab-view"
						className="h-[calc(100dvh-var(--header-height))] pt-[var(--header-height)]"
						initial={{ opacity: 0, filter: "blur(1.5px)", height: "0dvh" }}
						animate={{ opacity: 1, filter: "blur(0px)", height: "100dvh" }}
						transition={{
							duration: 0.8,
							ease: "easeOut",
						}}
					>
						<Suspense>
							<LabView />
						</Suspense>
					</motion.div>
				)}
			</AnimatePresence>
			<LabFooter isTransition={showTransition} />
			<LabFooterOverlay />
		</div>
	);
}
