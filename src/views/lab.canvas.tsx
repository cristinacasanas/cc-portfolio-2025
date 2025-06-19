// import clsx from "clsx"
import { getLab } from "@/lib/queries/lab";
import { client } from "@/lib/sanity";
import { detectDevice, getOptimizedConfig } from "@/utils/device";
import { useQuery } from "@tanstack/react-query";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Lab } from "studio/sanity.types";

// Types
interface Position {
	x: number;
	y: number;
}

interface CellPosition {
	row: number;
	col: number;
}

interface ImageSize {
	width: number;
	height: number;
}

interface GridConfig {
	CELL_SIZE: number;
	GRID_LIMIT: number;
	MOMENTUM_DECAY: number;
	CELL_GAP: number;
	ANIMATION_THROTTLE: number;
	MAX_IMAGE_WIDTH: number;
}

// Get device-specific configuration
const device = detectDevice();
const config = getOptimizedConfig(device.isOldDevice, device.isMobile);

// Configuration constants - optimized for mobile
const GRID_CONFIG: GridConfig = {
	CELL_SIZE: config.mobileCellSize,
	GRID_LIMIT: config.mobileGridLimit,
	MOMENTUM_DECAY: device.isMobile ? 0.95 : 0.92, // Slower decay on mobile for smoother feel
	CELL_GAP: device.isMobile ? 20 : 30,
	ANIMATION_THROTTLE: config.animationThrottle,
	MAX_IMAGE_WIDTH: device.isMobile ? 200 : 300,
};

// Utility functions with proper typing
function createThrottle<T extends (...args: never[]) => void>(
	func: T,
	limit: number,
): (...args: Parameters<T>) => void {
	let inThrottle = false;
	return (...args: Parameters<T>) => {
		if (!inThrottle) {
			func(...args);
			inThrottle = true;
			setTimeout(() => {
				inThrottle = false;
			}, limit);
		}
	};
}

function createDebounce<T extends (...args: never[]) => void>(
	func: T,
	delay: number,
): (...args: Parameters<T>) => void {
	let timeoutId: ReturnType<typeof setTimeout>;
	return (...args: Parameters<T>) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => func(...args), delay);
	};
}

// Optimized Image Cell Component for mobile
const ImageCell = memo<{
	row: number;
	col: number;
	imageUrl: string;
	cellSize: number;
	cellGap: number;
	position: Position;
	zoom: number;
	imageSize?: ImageSize;
	isMobile: boolean;
}>(
	({
		row,
		col,
		imageUrl,
		cellSize,
		cellGap,
		position,
		zoom,
		imageSize,
		isMobile,
	}) => {
		const totalCellSize = cellSize + cellGap;
		const left = col * totalCellSize;
		const top = row * totalCellSize;

		if (!imageSize) {
			return (
				<div
					className="absolute"
					style={{
						left: `${position.x + left}px`,
						top: `${position.y + top}px`,
						width: `${cellSize}px`,
						height: `${cellSize}px`,
					}}
				/>
			);
		}

		let displayWidth = imageSize.width;
		let displayHeight = imageSize.height;

		// Scale down if too wide
		if (displayWidth > GRID_CONFIG.MAX_IMAGE_WIDTH) {
			const ratio = GRID_CONFIG.MAX_IMAGE_WIDTH / displayWidth;
			displayWidth = GRID_CONFIG.MAX_IMAGE_WIDTH;
			displayHeight = imageSize.height * ratio;
		}

		// Scale down if too tall
		const maxHeight = cellSize * 0.9;
		if (displayHeight > maxHeight) {
			const ratio = maxHeight / displayHeight;
			displayHeight = maxHeight;
			displayWidth = displayWidth * ratio;
		}

		// Apply zoom
		displayWidth *= zoom;
		displayHeight *= zoom;

		// Mobile-specific optimizations
		const imageProps = isMobile
			? {
					loading: "lazy" as const,
					decoding: "async" as const,
					// Lower quality images on mobile to reduce memory usage
					sizes: "(max-width: 768px) 200px, 300px",
				}
			: {
					loading: "lazy" as const,
					decoding: "async" as const,
				};

		return (
			<div
				className="absolute"
				style={{
					left: `${position.x + left + (cellSize - displayWidth) / 2}px`,
					top: `${position.y + top + (cellSize - displayHeight) / 2}px`,
					width: `${displayWidth}px`,
					height: `${displayHeight}px`,
					// Disable CSS transforms on mobile for better performance
					willChange: config.useWillChange ? "transform" : "auto",
				}}
			>
				<img
					src={imageUrl}
					alt={`Lab item ${row}-${col}`}
					className="h-full w-full object-contain"
					draggable={false}
					{...imageProps}
				/>
			</div>
		);
	},
);

// Custom hooks for better separation of concerns
function useImagePreloading(isMobile: boolean) {
	const [imagesSizes, setImagesSizes] = useState<Record<string, ImageSize>>({});
	const imageLoadingCache = useRef<Set<string>>(new Set());
	const maxConcurrentLoads = isMobile ? 3 : 6; // Limit concurrent image loads on mobile
	const currentLoads = useRef(0);

	const preloadImageSize = useCallback(
		(url: string, cellKey: string) => {
			if (imagesSizes[cellKey] || imageLoadingCache.current.has(cellKey)) {
				return;
			}

			// Limit concurrent loads on mobile
			if (currentLoads.current >= maxConcurrentLoads) {
				return;
			}

			imageLoadingCache.current.add(cellKey);
			currentLoads.current++;

			const img = new Image();
			img.onload = () => {
				setImagesSizes((prev) => ({
					...prev,
					[cellKey]: {
						width: img.naturalWidth,
						height: img.naturalHeight,
					},
				}));
				imageLoadingCache.current.delete(cellKey);
				currentLoads.current--;
			};
			img.onerror = () => {
				imageLoadingCache.current.delete(cellKey);
				currentLoads.current--;
			};

			// Mobile-specific: use smaller image if available
			if (isMobile && url.includes("sanity")) {
				// Add Sanity image transformation for mobile
				const mobileUrl = url.includes("?")
					? `${url}&w=400&q=75`
					: `${url}?w=400&q=75`;
				img.src = mobileUrl;
			} else {
				img.src = url;
			}
		},
		[imagesSizes, maxConcurrentLoads, isMobile],
	);

	return { imagesSizes, preloadImageSize };
}

function useMomentum(isMobile: boolean) {
	const momentumRef = useRef<Position>({ x: 0, y: 0 });
	const lastFrameTime = useRef(performance.now());
	const animationFrameId = useRef<number | null>(null);

	const applyMomentum = useCallback(
		(setPosition: React.Dispatch<React.SetStateAction<Position>>) => {
			const threshold = isMobile ? 1 : 0.5; // Higher threshold on mobile
			if (
				Math.abs(momentumRef.current.x) < threshold &&
				Math.abs(momentumRef.current.y) < threshold
			) {
				if (animationFrameId.current) {
					cancelAnimationFrame(animationFrameId.current);
					animationFrameId.current = null;
				}
				return;
			}

			const now = performance.now();
			const deltaTime = Math.min(
				(now - lastFrameTime.current) / GRID_CONFIG.ANIMATION_THROTTLE,
				2,
			);
			lastFrameTime.current = now;

			setPosition((prev) => ({
				x: prev.x + momentumRef.current.x * deltaTime,
				y: prev.y + momentumRef.current.y * deltaTime,
			}));

			momentumRef.current = {
				x: momentumRef.current.x * GRID_CONFIG.MOMENTUM_DECAY ** deltaTime,
				y: momentumRef.current.y * GRID_CONFIG.MOMENTUM_DECAY ** deltaTime,
			};

			animationFrameId.current = requestAnimationFrame(() =>
				applyMomentum(setPosition),
			);
		},
		[isMobile],
	);

	const startMomentum = useCallback(
		(setPosition: React.Dispatch<React.SetStateAction<Position>>) => {
			if (
				(Math.abs(momentumRef.current.x) > (isMobile ? 1 : 0.5) ||
					Math.abs(momentumRef.current.y) > (isMobile ? 1 : 0.5)) &&
				!animationFrameId.current
			) {
				lastFrameTime.current = performance.now();
				animationFrameId.current = requestAnimationFrame(() =>
					applyMomentum(setPosition),
				);
			}
		},
		[applyMomentum, isMobile],
	);

	const stopMomentum = useCallback(() => {
		if (animationFrameId.current) {
			cancelAnimationFrame(animationFrameId.current);
			animationFrameId.current = null;
		}
		momentumRef.current = { x: 0, y: 0 };
	}, []);

	const updateMomentum = useCallback(
		(deltaX: number, deltaY: number, factor = isMobile ? 4 : 6) => {
			const now = performance.now();
			const deltaTime = now - lastFrameTime.current;

			if (deltaTime > 0) {
				momentumRef.current = {
					x: (deltaX / deltaTime) * factor,
					y: (deltaY / deltaTime) * factor,
				};
				lastFrameTime.current = now;
			}
		},
		[isMobile],
	);

	const addMomentum = useCallback(
		(deltaX: number, deltaY: number, factor = 0.01) => {
			momentumRef.current = {
				x: momentumRef.current.x + deltaX * factor,
				y: momentumRef.current.y + deltaY * factor,
			};
		},
		[],
	);

	return {
		momentumRef,
		startMomentum,
		stopMomentum,
		updateMomentum,
		addMomentum,
		animationFrameId,
	};
}

function useTouchGestures() {
	const getTouchDistance = useCallback((touches: TouchList): number => {
		if (touches.length < 2) return 0;
		const dx = touches[0].clientX - touches[1].clientX;
		const dy = touches[0].clientY - touches[1].clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}, []);

	const getTouchCenter = useCallback((touches: TouchList): Position => {
		if (touches.length === 1) {
			return { x: touches[0].clientX, y: touches[0].clientY };
		}
		if (touches.length === 2) {
			return {
				x: (touches[0].clientX + touches[1].clientX) / 2,
				y: (touches[0].clientY + touches[1].clientY) / 2,
			};
		}
		return { x: 0, y: 0 };
	}, []);

	return { getTouchDistance, getTouchCenter };
}

export const InfiniteImageGrid = () => {
	// Device detection at component level
	const deviceInfo = useMemo(() => detectDevice(), []);
	const optimizedConfig = useMemo(
		() => getOptimizedConfig(deviceInfo.isOldDevice, deviceInfo.isMobile),
		[deviceInfo.isOldDevice, deviceInfo.isMobile],
	);

	const { data } = useQuery({
		queryKey: ["lab-canvas"],
		queryFn: async () => {
			const data = await client.fetch<Lab[]>(getLab);
			return data;
		},
		staleTime: 20 * 60 * 1000,
		gcTime: 4 * 60 * 60 * 1000,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

	// Limit images on mobile for better performance
	const allImages = useMemo(() => {
		if (!data) return [];
		const images = data.flatMap(
			(lab) =>
				lab.images
					?.map((img) => (img as { asset?: { url?: string } }).asset?.url)
					.filter((url): url is string => Boolean(url)) || [],
		);

		// Limit images on mobile
		return deviceInfo.isMobile ? images.slice(0, 50) : images;
	}, [data, deviceInfo.isMobile]);

	// State
	const gridRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(deviceInfo.isMobile ? 0.8 : 1); // Start zoomed out on mobile
	const [visibleCells, setVisibleCells] = useState<CellPosition[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
	const [lastTouchDistance, setLastTouchDistance] = useState<number>(0);

	// Custom hooks with mobile awareness
	const { imagesSizes, preloadImageSize } = useImagePreloading(
		deviceInfo.isMobile,
	);
	const { startMomentum, stopMomentum, updateMomentum, addMomentum } =
		useMomentum(deviceInfo.isMobile);
	const { getTouchDistance, getTouchCenter } = useTouchGestures();

	// Computed values
	const actualCellSize = useMemo(() => GRID_CONFIG.CELL_SIZE * zoom, [zoom]);
	const actualCellGap = useMemo(() => GRID_CONFIG.CELL_GAP * zoom, [zoom]);

	const getImageUrl = useCallback(
		(row: number, col: number): string => {
			if (!allImages.length) return "";
			const index = Math.abs((row * 10 + col) % allImages.length);
			return allImages[index];
		},
		[allImages],
	);

	// Visible cells calculation - optimized for mobile
	const updateVisibleCells = useCallback(() => {
		if (!gridRef.current) return;

		const rect = gridRef.current.getBoundingClientRect();
		const viewportWidth = rect.width;
		const viewportHeight = rect.height;

		const totalCellSize = actualCellSize + actualCellGap;
		const buffer = optimizedConfig.mobileBuffer;

		const startCol = Math.floor(-position.x / totalCellSize) - buffer;
		const startRow = Math.floor(-position.y / totalCellSize) - buffer;
		const endCol =
			startCol + Math.ceil(viewportWidth / totalCellSize) + buffer * 2;
		const endRow =
			startRow + Math.ceil(viewportHeight / totalCellSize) + buffer * 2;

		const cells: CellPosition[] = [];
		let cellCount = 0;

		for (let row = startRow; row <= endRow; row++) {
			for (let col = startCol; col <= endCol; col++) {
				if (
					row >= -GRID_CONFIG.GRID_LIMIT &&
					row <= GRID_CONFIG.GRID_LIMIT &&
					col >= -GRID_CONFIG.GRID_LIMIT &&
					col <= GRID_CONFIG.GRID_LIMIT
				) {
					cells.push({ row, col });
					cellCount++;

					// Limit cells on mobile
					if (
						deviceInfo.isMobile &&
						cellCount >= optimizedConfig.maxVisibleCells
					) {
						break;
					}
				}
			}
			if (deviceInfo.isMobile && cellCount >= optimizedConfig.maxVisibleCells) {
				break;
			}
		}

		setVisibleCells(cells);
	}, [
		position,
		actualCellSize,
		actualCellGap,
		optimizedConfig.mobileBuffer,
		optimizedConfig.maxVisibleCells,
		deviceInfo.isMobile,
	]);

	// Event handlers - optimized for mobile
	const handleWheelEvent = useCallback(
		(e: WheelEvent) => {
			e.preventDefault();

			// Disable zoom on mobile (pinch-to-zoom will handle it)
			if (deviceInfo.isMobile) {
				return;
			}

			if (e.ctrlKey) {
				const zoomDelta = -e.deltaY * 0.001;
				setZoom((prev) => Math.max(0.5, Math.min(3, prev + zoomDelta)));
				return;
			}

			const deltaX = e.shiftKey ? e.deltaY : e.deltaX;
			const deltaY = e.shiftKey ? 0 : e.deltaY;

			setPosition((prev) => ({
				x: prev.x - deltaX * (1 / zoom) * 0.5,
				y: prev.y - deltaY * (1 / zoom) * 0.5,
			}));

			addMomentum(-deltaX * (1 / zoom), -deltaY * (1 / zoom));
			startMomentum(setPosition);
		},
		[zoom, addMomentum, startMomentum, deviceInfo.isMobile],
	);

	const handleTouchStart = useCallback(
		(e: TouchEvent) => {
			// Use passive events on mobile as much as possible
			if (!optimizedConfig.usePassiveTouch) {
				e.preventDefault();
			}
			stopMomentum();

			const touches = e.touches;

			if (touches.length === 1) {
				setIsDragging(true);
				setDragStart({ x: touches[0].clientX, y: touches[0].clientY });
			} else if (touches.length === 2) {
				setIsDragging(false);
				const distance = getTouchDistance(touches);
				setLastTouchDistance(distance);
			}
		},
		[stopMomentum, getTouchDistance, optimizedConfig.usePassiveTouch],
	);

	const handleTouchMove = useCallback(
		(e: TouchEvent) => {
			const touches = e.touches;

			if (touches.length === 1 && isDragging) {
				// Only prevent default when necessary on mobile
				if (!optimizedConfig.usePassiveTouch) {
					e.preventDefault();
				}

				const dx = touches[0].clientX - dragStart.x;
				const dy = touches[0].clientY - dragStart.y;

				// More aggressive throttling on mobile
				if (deviceInfo.isMobile && Math.abs(dx) < 3 && Math.abs(dy) < 3) {
					return;
				}

				updateMomentum(dx, dy);

				setPosition((prev) => ({
					x: prev.x + dx,
					y: prev.y + dy,
				}));

				setDragStart({ x: touches[0].clientX, y: touches[0].clientY });
			} else if (touches.length === 2) {
				e.preventDefault(); // Always prevent for pinch zoom

				const distance = getTouchDistance(touches);
				const center = getTouchCenter(touches);

				if (lastTouchDistance > 0) {
					const scale = distance / lastTouchDistance;
					const newZoom = Math.max(
						deviceInfo.isMobile ? 0.5 : 0.5,
						Math.min(deviceInfo.isMobile ? 2 : 3, zoom * scale),
					);

					const zoomDelta = newZoom - zoom;
					const deltaX =
						(center.x - window.innerWidth / 2) * (zoomDelta / zoom);
					const deltaY =
						(center.y - window.innerHeight / 2) * (zoomDelta / zoom);

					setPosition((prev) => ({
						x: prev.x - deltaX,
						y: prev.y - deltaY,
					}));

					setZoom(newZoom);
				}

				setLastTouchDistance(distance);
			}
		},
		[
			isDragging,
			dragStart,
			getTouchDistance,
			getTouchCenter,
			lastTouchDistance,
			zoom,
			updateMomentum,
			deviceInfo.isMobile,
			optimizedConfig.usePassiveTouch,
		],
	);

	const handleTouchEnd = useCallback(
		(e: TouchEvent) => {
			if (!optimizedConfig.usePassiveTouch) {
				e.preventDefault();
			}
			setIsDragging(false);
			setLastTouchDistance(0);
			startMomentum(setPosition);
		},
		[startMomentum, optimizedConfig.usePassiveTouch],
	);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			// Disable mouse events on mobile
			if (deviceInfo.isMobile) return;

			stopMomentum();
			setIsDragging(true);
			setDragStart({ x: e.clientX, y: e.clientY });
		},
		[stopMomentum, deviceInfo.isMobile],
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (!isDragging || deviceInfo.isMobile) return;

			const dx = e.clientX - dragStart.x;
			const dy = e.clientY - dragStart.y;

			updateMomentum(dx, dy);

			setPosition((prev) => ({
				x: prev.x + dx,
				y: prev.y + dy,
			}));

			setDragStart({ x: e.clientX, y: e.clientY });
		},
		[isDragging, dragStart, updateMomentum, deviceInfo.isMobile],
	);

	const handleMouseUp = useCallback(() => {
		if (deviceInfo.isMobile) return;
		setIsDragging(false);
		startMomentum(setPosition);
	}, [startMomentum, deviceInfo.isMobile]);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			// Disable keyboard navigation on mobile
			if (deviceInfo.isMobile) return;

			const moveAmount = 100 * (1 / zoom);

			switch (e.key) {
				case "ArrowUp":
					setPosition((prev) => ({ ...prev, y: prev.y + moveAmount }));
					break;
				case "ArrowDown":
					setPosition((prev) => ({ ...prev, y: prev.y - moveAmount }));
					break;
				case "ArrowLeft":
					setPosition((prev) => ({ ...prev, x: prev.x + moveAmount }));
					break;
				case "ArrowRight":
					setPosition((prev) => ({ ...prev, x: prev.x - moveAmount }));
					break;
				case "+":
					setZoom((prev) => Math.min(prev + 0.1, 3));
					break;
				case "-":
					setZoom((prev) => Math.max(prev - 0.1, 0.5));
					break;
			}
		},
		[zoom, deviceInfo.isMobile],
	);

	// Event listeners setup
	useEffect(() => {
		const gridElement = gridRef.current;
		if (!gridElement) return;

		const throttledWheel = createThrottle(
			handleWheelEvent,
			optimizedConfig.wheelThrottle,
		);
		const throttledTouchMove = createThrottle(
			handleTouchMove,
			optimizedConfig.touchThrottle,
		);
		const throttledKeyDown = createThrottle(handleKeyDown, 50);

		// Only add wheel events on desktop
		if (!deviceInfo.isMobile) {
			gridElement.addEventListener("wheel", throttledWheel, {
				passive: false,
				capture: true,
			});
		}

		gridElement.addEventListener("touchstart", handleTouchStart, {
			passive: optimizedConfig.usePassiveTouch,
			capture: true,
		});

		gridElement.addEventListener("touchmove", throttledTouchMove, {
			passive: false, // Keep non-passive for pan/zoom
			capture: true,
		});

		gridElement.addEventListener("touchend", handleTouchEnd, {
			passive: true,
			capture: true,
		});

		// Only add keyboard events on desktop
		if (!deviceInfo.isMobile) {
			window.addEventListener("keydown", throttledKeyDown);
		}

		return () => {
			if (!deviceInfo.isMobile) {
				gridElement.removeEventListener("wheel", throttledWheel);
				window.removeEventListener("keydown", throttledKeyDown);
			}
			gridElement.removeEventListener("touchstart", handleTouchStart);
			gridElement.removeEventListener("touchmove", throttledTouchMove);
			gridElement.removeEventListener("touchend", handleTouchEnd);
		};
	}, [
		handleWheelEvent,
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd,
		handleKeyDown,
		optimizedConfig.wheelThrottle,
		optimizedConfig.touchThrottle,
		deviceInfo.isMobile,
	]);

	// Update visible cells with more aggressive debouncing on mobile
	const debouncedUpdateVisibleCells = useMemo(
		() => createDebounce(updateVisibleCells, deviceInfo.isMobile ? 50 : 10),
		[updateVisibleCells, deviceInfo.isMobile],
	);

	useEffect(() => {
		debouncedUpdateVisibleCells();

		const handleResize = createDebounce(
			updateVisibleCells,
			deviceInfo.isMobile ? 200 : 100,
		);
		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, [updateVisibleCells, debouncedUpdateVisibleCells, deviceInfo.isMobile]);

	// Rendered cells with mobile optimizations
	const renderedCells = useMemo(() => {
		// Limit batch preloading on mobile
		const cellsToPreload = deviceInfo.isMobile
			? visibleCells.slice(0, optimizedConfig.maxVisibleCells / 2)
			: visibleCells;

		// Batch preload images with mobile limits
		for (const { row, col } of cellsToPreload) {
			const cellKey = `${row}-${col}`;
			const imageUrl = getImageUrl(row, col);
			preloadImageSize(imageUrl, cellKey);
		}

		return visibleCells.map(({ row, col }) => {
			const cellKey = `${row}-${col}`;
			const imageUrl = getImageUrl(row, col);
			const imageSize = imagesSizes[cellKey];

			return (
				<ImageCell
					key={cellKey}
					row={row}
					col={col}
					imageUrl={imageUrl}
					cellSize={actualCellSize}
					cellGap={actualCellGap}
					position={position}
					zoom={zoom}
					imageSize={imageSize}
					isMobile={deviceInfo.isMobile}
				/>
			);
		});
	}, [
		visibleCells,
		position,
		actualCellSize,
		actualCellGap,
		zoom,
		imagesSizes,
		getImageUrl,
		preloadImageSize,
		deviceInfo.isMobile,
		optimizedConfig.maxVisibleCells,
	]);

	// Initialize position
	useEffect(() => {
		if (gridRef.current) {
			const rect = gridRef.current.getBoundingClientRect();
			setPosition({
				x: rect.width / 2,
				y: rect.height / 2,
			});
		}
	}, []);

	return (
		<div className="fixed inset-0 overflow-hidden pt-12">
			<div
				className="absolute inset-0 overflow-hidden"
				ref={gridRef}
				onMouseDown={handleMouseDown}
				onMouseMove={createThrottle(handleMouseMove, 16)}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
				style={{
					touchAction: "none",
					userSelect: "none",
					WebkitUserSelect: "none",
					WebkitTouchCallout: "none",
					WebkitTapHighlightColor: "transparent",
					// Mobile-optimized CSS
					willChange: optimizedConfig.useWillChange ? "transform" : "auto",
					backfaceVisibility: "hidden",
					perspective: "1000px",
				}}
			>
				<div
					className="absolute inset-0"
					style={{
						willChange: optimizedConfig.useWillChange ? "transform" : "auto",
						backfaceVisibility: "hidden",
					}}
				>
					{renderedCells}
				</div>
			</div>
		</div>
	);
};
