import { overlayStore } from "@/stores/overlay.store";
import { useStore } from "@tanstack/react-store";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";

export const Overlay = () => {
	const { isOpen } = useStore(overlayStore, (state) => state);

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.3 }}
					className={clsx(
						"absolute inset-0 top-0 left-0 z-10 h-screen w-screen bg-background-primary/80 backdrop-blur-sm",
					)}
				/>
			)}
		</AnimatePresence>
	);
};
