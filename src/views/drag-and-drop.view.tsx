import { getLab } from "@/lib/queries/lab";
import { client } from "@/lib/sanity";

import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Lab } from "studio/sanity.types";

export function DragAndDropView() {
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [posterPositions, setPosterPositions] = useState<
		Array<{ x: number; y: number }>
	>([]);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
	const dragStartPos = useRef({ x: 0, y: 0 });
	const containerRef = useRef<HTMLDivElement>(null);
	const [stackIndexes, setStackIndexes] = useState<Array<number>>([]);
	const highestZIndexRef = useRef(15);
	const [windowDimensions, setWindowDimensions] = useState({
		width: window.innerWidth,
		height: window.innerHeight,
	});
	const [showEasterEgg, setShowEasterEgg] = useState(false);

	const { data } = useQuery({
		queryKey: ["lab-drag-drop"],
		queryFn: async () => {
			const data = await client.fetch<Lab[]>(getLab);
			return data;
		},
		staleTime: 20 * 60 * 1000, // 20 minutes
		gcTime: 4 * 60 * 60 * 1000, // 4 heures
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

	// Flatten all images from all lab entries
	const allImages = useMemo(() => {
		if (!data) return [];
		return data.flatMap(
			(lab) =>
				lab.images
					?.map((img) => (img as { asset?: { url?: string } }).asset?.url)
					.filter((url): url is string => Boolean(url)) || [],
		);
	}, [data]);

	const calculateSpiralPositions = useCallback(() => {
		const { width, height } = windowDimensions;

		// Calculate available space (accounting for header and footer)
		const headerHeight = 42; // var(--header-height)
		const footerHeight = 112; // h-28 from LabFooterOverlay (28 * 4 = 112px)
		const padding = 50; // Extra padding for safety

		const availableHeight = height - headerHeight - footerHeight - padding * 2;
		const centerX = width / 2;
		const centerY = headerHeight + padding + availableHeight / 2;

		// Detect screen size
		const isMobile = width < 640;
		const isTablet = width < 1024;

		// Adjust spiral parameters for available space
		const maxRadius = Math.min(
			(width - 200) / 2, // Leave margin on sides
			availableHeight / 2, // Don't exceed available height
		);

		// Spiral parameters based on screen size and available space
		const radiusIncrement = isMobile
			? Math.min(25, maxRadius / 8)
			: isTablet
				? Math.min(35, maxRadius / 6)
				: Math.min(45, maxRadius / 5);
		const angleIncrement = isMobile ? 0.8 : isTablet ? 0.7 : 0.6;
		const startRadius = isMobile ? 10 : isTablet ? 20 : 30;

		return allImages.slice(0, 15).map((_, index) => {
			// Calculate spiral position
			const angle = index * angleIncrement;
			const radius = Math.min(startRadius + index * radiusIncrement, maxRadius);

			// Convert polar coordinates to cartesian
			const x = centerX + radius * Math.cos(angle);
			const y = centerY + radius * Math.sin(angle);

			return { x, y };
		});
	}, [allImages, windowDimensions]);

	useEffect(() => {
		if (!allImages.length) return;

		const positions = calculateSpiralPositions();
		setPosterPositions(positions);

		// Set initial stacking order with incrementing z-index values
		const initialStackIndexes = allImages
			.slice(0, 15)
			.map((_, index) => index + 1);
		highestZIndexRef.current = initialStackIndexes.length;
		setStackIndexes(initialStackIndexes);
	}, [allImages, calculateSpiralPositions]);

	// Handle window resize
	useEffect(() => {
		const handleResize = () => {
			setWindowDimensions({
				width: window.innerWidth,
				height: window.innerHeight,
			});
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const getEventCoordinates = useCallback((e: MouseEvent | TouchEvent) => {
		if ("touches" in e) {
			return {
				clientX: e.touches[0]?.clientX || 0,
				clientY: e.touches[0]?.clientY || 0,
			};
		}
		return {
			clientX: e.clientX,
			clientY: e.clientY,
		};
	}, []);

	const handlePosterStart = useCallback(
		(e: React.MouseEvent | React.TouchEvent, index: number) => {
			e.preventDefault();
			e.stopPropagation();

			const coords =
				"touches" in e
					? {
							clientX: e.touches[0]?.clientX || 0,
							clientY: e.touches[0]?.clientY || 0,
						}
					: { clientX: e.clientX, clientY: e.clientY };

			setDraggedIndex(index);

			const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
			const centerX = rect.left + rect.width / 2;
			const centerY = rect.top + rect.height / 2;

			setDragOffset({
				x: coords.clientX - centerX,
				y: coords.clientY - centerY,
			});

			dragStartPos.current = {
				x: coords.clientX,
				y: coords.clientY,
			};

			// Increment highest z-index and assign it to the clicked poster
			highestZIndexRef.current += 1;
			const newStackIndexes = [...stackIndexes];
			newStackIndexes[index] = highestZIndexRef.current;
			setStackIndexes(newStackIndexes);
		},
		[stackIndexes],
	);

	const handlePosterMouseDown = useCallback(
		(e: React.MouseEvent, index: number) => {
			handlePosterStart(e, index);
		},
		[handlePosterStart],
	);

	const handlePosterTouchStart = useCallback(
		(e: React.TouchEvent, index: number) => {
			handlePosterStart(e, index);
		},
		[handlePosterStart],
	);

	// Handler for dragging
	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (draggedIndex === null) return;

			const coords = getEventCoordinates(e);

			// Use direct pixel positions instead of relative percentages
			setPosterPositions((prev) => {
				const newPositions = [...prev];
				if (newPositions[draggedIndex]) {
					newPositions[draggedIndex] = {
						x: coords.clientX - dragOffset.x,
						y: coords.clientY - dragOffset.y,
					};
				}
				return newPositions;
			});
		},
		[draggedIndex, dragOffset, getEventCoordinates],
	);

	const handleTouchMove = useCallback(
		(e: TouchEvent) => {
			if (draggedIndex === null) return;
			e.preventDefault(); // Prevent scrolling

			const coords = getEventCoordinates(e);

			// Use direct pixel positions instead of relative percentages
			setPosterPositions((prev) => {
				const newPositions = [...prev];
				if (newPositions[draggedIndex]) {
					newPositions[draggedIndex] = {
						x: coords.clientX - dragOffset.x,
						y: coords.clientY - dragOffset.y,
					};
				}
				return newPositions;
			});
		},
		[draggedIndex, dragOffset, getEventCoordinates],
	);

	// Handler for ending drag
	const handleEnd = useCallback(() => {
		setDraggedIndex(null);
	}, []);

	// Add global mouse and touch event listeners
	useEffect(() => {
		if (draggedIndex !== null) {
			window.addEventListener("mousemove", handleMouseMove);
			window.addEventListener("mouseup", handleEnd);
			window.addEventListener("touchmove", handleTouchMove, { passive: false });
			window.addEventListener("touchend", handleEnd);
		}

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleEnd);
			window.removeEventListener("touchmove", handleTouchMove);
			window.removeEventListener("touchend", handleEnd);
		};
	}, [draggedIndex, handleMouseMove, handleTouchMove, handleEnd]);

	// Check if all images are stacked (easter egg detection)
	const checkForEasterEgg = useCallback(() => {
		if (posterPositions.length < 2) return;

		// Define stacking threshold based on screen size and image dimensions
		const isMobile = windowDimensions.width < 640;
		const isTablet = windowDimensions.width < 1024;

		// More generous thresholds based on actual image sizes
		// Mobile: w-28 (112px) -> threshold 150px
		// Tablet: w-48 (192px) -> threshold 250px
		// Desktop: w-64 (256px) -> threshold 350px
		// Large: w-80 (320px) -> threshold 450px
		let stackingThreshold: number;
		if (isMobile) {
			stackingThreshold = 150;
		} else if (isTablet) {
			stackingThreshold = 250;
		} else if (windowDimensions.width < 1280) {
			stackingThreshold = 350; // Desktop md:w-64
		} else {
			stackingThreshold = 450; // Large lg:w-80
		}

		// Check if all images are within the threshold distance from each other
		const isStacked = posterPositions.every((pos1, index1) => {
			return posterPositions.every((pos2, index2) => {
				if (index1 === index2) return true;
				const distance = Math.sqrt(
					(pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2,
				);
				return distance <= stackingThreshold;
			});
		});

		// Debug log for testing
		if (process.env.NODE_ENV === "development") {
			console.log("Easter egg check:", {
				threshold: stackingThreshold,
				isStacked,
				screenWidth: windowDimensions.width,
				positionsCount: posterPositions.length,
			});
		}

		setShowEasterEgg(isStacked);
	}, [posterPositions, windowDimensions.width]);

	// Check for easter egg whenever positions change
	useEffect(() => {
		// Only check when not currently dragging to avoid flickering
		if (draggedIndex === null) {
			checkForEasterEgg();
		}
	}, [posterPositions, draggedIndex, checkForEasterEgg]);

	return (
		<div className="fixed inset-0 overflow-hidden">
			{showEasterEgg && (
				<motion.div
					initial={{ opacity: 0, scale: 0.5 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.5 }}
					transition={{ duration: 0.8, ease: "easeOut" }}
					className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
				>
					<div
						className="select-none text-[80vw] md:text-[70vw] leading-none"
						style={{ fontFamily: "var(--font-departure)" }}
					>
						=)
					</div>
				</motion.div>
			)}

			<div ref={containerRef} className="absolute inset-0 overflow-hidden">
				{allImages.slice(0, 15).map((item, index) => {
					const position = posterPositions[index] || { x: 0, y: 0 };
					const isDragged = draggedIndex === index;
					const zIndex = stackIndexes[index] || 0;

					return (
						<motion.div
							key={`${item.split("/").pop()}-${index}`}
							// apparition progressive les unes après les autres
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{
								duration: 0.5,
								delay: 0.08 * index,
								ease: "easeInOut",
							}}
							className={clsx(
								"absolute",
								isDragged ? "transition-none" : "transition-all duration-200",
								"cursor-move touch-none select-none",
								"w-28 sm:w-48 md:w-64 lg:w-80",
							)}
							style={{
								top: position.y,
								left: position.x,
								transform: "translate(-50%, -50%)",
								zIndex: zIndex + 10, // Ensure images are above easter egg
							}}
							onMouseDown={(e) => handlePosterMouseDown(e, index)}
							onTouchStart={(e) => handlePosterTouchStart(e, index)}
						>
							<img
								src={item}
								alt={`Poster ${index}`}
								className="h-auto w-full select-none"
								draggable={false}
								loading="lazy"
								onError={(e) => {
									// Fallback in case of error
									const target = e.target as HTMLImageElement;
									target.src =
										"/placeholder.svg?height=500&width=350&text=Poster";
								}}
							/>
						</motion.div>
					);
				})}
			</div>
		</div>
	);
}
