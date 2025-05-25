import { LabFooter } from "@/components/layout/lab-footer";
import { LabFooterOverlay } from "@/components/layout/lab-footer.overlay";
import { getLab } from "@/lib/queries/lab";
import { client } from "@/lib/sanity";
import { TransitionView } from "@/views/transition.view";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Suspense, lazy, useEffect, useState } from "react";
import type { Lab } from "studio/sanity.types";

const LabView = lazy(() => import("@/views/lab.view"));

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

	useEffect(() => {
		// Vérifier si on doit montrer la transition
		const shouldShowTransition = () => {
			// Vérifier l'historique de navigation
			const hasVisitedLabInSession = sessionStorage.getItem("lab-visited");

			if (!hasVisitedLabInSession) {
				// Première visite dans cette session
				sessionStorage.setItem("lab-visited", "true");
				return true;
			}

			// Vérifier le referrer comme fallback
			const referrer = document.referrer;
			if (referrer && !referrer.includes("/lab")) {
				return true;
			}

			return false;
		};

		const shouldShow = shouldShowTransition();

		if (!shouldShow) {
			setShowTransition(false);
			return;
		}

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

		const timer = setTimeout(() => {
			setShowTransition(false);
		}, 4000);

		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		return () => {
			sessionStorage.removeItem("lab-visited");
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
						<div className="fixed bottom-0 left-0 h-28 w-screen bg-background-primary/10 backdrop-blur-[2px]" />
					</motion.div>
				)}
			</AnimatePresence>
			<LabFooter isTransition={showTransition} />
			<LabFooterOverlay />
		</div>
	);
}
