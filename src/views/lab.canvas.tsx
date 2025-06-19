// import clsx from "clsx"
import { getLab } from "@/lib/queries/lab";
import { client } from "@/lib/sanity";
import { useQuery } from "@tanstack/react-query";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Lab } from "studio/sanity.types";

// Throttle helper function with proper typing
const throttle = <T extends (...args: unknown[]) => void>(
	func: T,
	limit: number,
): T => {
	let inThrottle = false;
	return ((...args: Parameters<T>) => {
		if (!inThrottle) {
			func.apply(null, args);
			inThrottle = true;
			setTimeout(() => {
				inThrottle = false;
			}, limit);
		}
	}) as T;
};

// Debounce helper function with proper typing
const debounce = <T extends (...args: unknown[]) => void>(
	func: T,
	delay: number,
): T => {
	let timeoutId: ReturnType<typeof setTimeout>;
	return ((...args: Parameters<T>) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => func.apply(null, args), delay);
	}) as T;
};

// Memoized Image Cell Component
const ImageCell = memo<{
	row: number;
	col: number;
	imageUrl: string;
	cellSize: number;
	cellGap: number;
	position: { x: number; y: number };
	zoom: number;
	imageSize?: { width: number; height: number };
}>(({ row, col, imageUrl, cellSize, cellGap, position, zoom, imageSize }) => {
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

	const MAX_IMAGE_WIDTH = 300;
	let displayWidth = imageSize.width;
	let displayHeight = imageSize.height;

	if (displayWidth > MAX_IMAGE_WIDTH) {
		const ratio = MAX_IMAGE_WIDTH / displayWidth;
		displayWidth = MAX_IMAGE_WIDTH;
		displayHeight = imageSize.height * ratio;
	}

	const maxHeight = cellSize * 0.9;
	if (displayHeight > maxHeight) {
		const ratio = maxHeight / displayHeight;
		displayHeight = maxHeight;
		displayWidth = displayWidth * ratio;
	}

	displayWidth *= zoom;
	displayHeight *= zoom;

	return (
		<div
			className="absolute"
			style={{
				left: `${position.x + left + (cellSize - displayWidth) / 2}px`,
				top: `${position.y + top + (cellSize - displayHeight) / 2}px`,
				width: `${displayWidth}px`,
				height: `${displayHeight}px`,
			}}
		>
			<img
				src={imageUrl}
				alt={`Lab item ${row}-${col}`}
				className="h-full w-full object-contain"
				loading="lazy"
				decoding="async"
			/>
		</div>
	);
});

export const InfiniteImageGrid = () => {
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

	const allImages = useMemo(() => {
		if (!data) return [];
		return data.flatMap(
			(lab) =>
				lab.images
					?.map((img) => (img as { asset?: { url?: string } }).asset?.url)
					.filter((url): url is string => Boolean(url)) || [],
		);
	}, [data]);

	const gridRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [visibleCells, setVisibleCells] = useState<
		Array<{ row: number; col: number }>
	>([]);
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const [imagesSizes, setImagesSizes] = useState<
		Record<string, { width: number; height: number }>
	>({});
	const [lastTouchDistance, setLastTouchDistance] = useState<number>(0);

	const momentumRef = useRef({ x: 0, y: 0 });
	const lastFrameTime = useRef(performance.now());
	const animationFrameId = useRef<number | null>(null);
	const imageLoadingCache = useRef<Set<string>>(new Set());

	// Optimized configuration
	const CELL_SIZE = 350;
	const GRID_LIMIT = 200; // Reduced from 500
	const MOMENTUM_DECAY = 0.92; // Slightly faster decay
	const CELL_GAP = 30;
	const ANIMATION_THROTTLE = 16; // ~60fps

	const actualCellSize = useMemo(() => CELL_SIZE * zoom, [zoom]);
	const actualCellGap = useMemo(() => CELL_GAP * zoom, [zoom]);

	const getImageUrl = useCallback(
		(row: number, col: number): string => {
			if (!allImages.length) return "";
			const index = Math.abs((row * 10 + col) % allImages.length);
			return allImages[index];
		},
		[allImages],
	);

	// Optimized image preloading with cache
	const preloadImageSize = useCallback(
		(url: string, cellKey: string) => {
			if (imagesSizes[cellKey] || imageLoadingCache.current.has(cellKey)) {
				return;
			}

			imageLoadingCache.current.add(cellKey);

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
			};
			img.onerror = () => {
				imageLoadingCache.current.delete(cellKey);
			};
			img.src = url;
		},
		[imagesSizes],
	);

	const getTouchDistanceNative = useCallback((touches: TouchList) => {
		if (touches.length < 2) return 0;
		const dx = touches[0].clientX - touches[1].clientX;
		const dy = touches[0].clientY - touches[1].clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}, []);

	const getTouchCenterNative = useCallback((touches: TouchList) => {
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

	// Throttled visible cells calculation
	const updateVisibleCells = useCallback(
		throttle(() => {
			if (!gridRef.current) return;

			const rect = gridRef.current.getBoundingClientRect();
			const viewportWidth = rect.width;
			const viewportHeight = rect.height;

			const totalCellSize = actualCellSize + actualCellGap;

			// Reduced buffer for better performance
			const buffer = 2; // Reduced from 3
			const startCol = Math.floor(-position.x / totalCellSize) - buffer;
			const startRow = Math.floor(-position.y / totalCellSize) - buffer;
			const endCol =
				startCol + Math.ceil(viewportWidth / totalCellSize) + buffer * 2;
			const endRow =
				startRow + Math.ceil(viewportHeight / totalCellSize) + buffer * 2;

			const cells: Array<{ row: number; col: number }> = [];
			for (let row = startRow; row <= endRow; row++) {
				for (let col = startCol; col <= endCol; col++) {
					if (
						row >= -GRID_LIMIT &&
						row <= GRID_LIMIT &&
						col >= -GRID_LIMIT &&
						col <= GRID_LIMIT
					) {
						cells.push({ row, col });
					}
				}
			}

			setVisibleCells(cells);
		}, 16), // 60fps throttle
		[position, actualCellSize, actualCellGap],
	);

	// Optimized momentum animation
	const applyMomentum = useCallback(() => {
		const threshold = 0.5; // Increased threshold
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
			(now - lastFrameTime.current) / ANIMATION_THROTTLE,
			2,
		);
		lastFrameTime.current = now;

		setPosition((prev) => ({
			x: prev.x + momentumRef.current.x * deltaTime,
			y: prev.y + momentumRef.current.y * deltaTime,
		}));

		momentumRef.current = {
			x: momentumRef.current.x * MOMENTUM_DECAY ** deltaTime,
			y: momentumRef.current.y * MOMENTUM_DECAY ** deltaTime,
		};

		animationFrameId.current = requestAnimationFrame(applyMomentum);
	}, []);

	// Optimized event handlers
	useEffect(() => {
		const gridElement = gridRef.current;
		if (!gridElement) return;

		const handleWheelDirect = throttle((e: WheelEvent) => {
			e.preventDefault();

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

			momentumRef.current = {
				x: momentumRef.current.x - deltaX * 0.01 * (1 / zoom),
				y: momentumRef.current.y - deltaY * 0.01 * (1 / zoom),
			};

			if (!animationFrameId.current) {
				lastFrameTime.current = performance.now();
				animationFrameId.current = requestAnimationFrame(applyMomentum);
			}
		}, 8); // Increased throttling

		const handleTouchStartDirect = (e: TouchEvent) => {
			e.preventDefault();

			if (animationFrameId.current) {
				cancelAnimationFrame(animationFrameId.current);
				animationFrameId.current = null;
			}

			const touches = e.touches;

			if (touches.length === 1) {
				setIsDragging(true);
				setDragStart({ x: touches[0].clientX, y: touches[0].clientY });
			} else if (touches.length === 2) {
				setIsDragging(false);
				const distance = getTouchDistanceNative(touches);
				setLastTouchDistance(distance);
			}

			momentumRef.current = { x: 0, y: 0 };
		};

		const handleTouchMoveDirect = throttle((e: TouchEvent) => {
			e.preventDefault();

			const touches = e.touches;

			if (touches.length === 1 && isDragging) {
				const dx = touches[0].clientX - dragStart.x;
				const dy = touches[0].clientY - dragStart.y;

				const now = performance.now();
				const deltaTime = now - lastFrameTime.current;

				if (deltaTime > 0) {
					momentumRef.current = {
						x: (dx / deltaTime) * 6, // Reduced momentum factor
						y: (dy / deltaTime) * 6,
					};
					lastFrameTime.current = now;
				}

				setPosition((prev) => ({
					x: prev.x + dx,
					y: prev.y + dy,
				}));

				setDragStart({ x: touches[0].clientX, y: touches[0].clientY });
			} else if (touches.length === 2) {
				const distance = getTouchDistanceNative(touches);
				const center = getTouchCenterNative(touches);

				if (lastTouchDistance > 0) {
					const scale = distance / lastTouchDistance;
					const newZoom = Math.max(0.5, Math.min(3, zoom * scale));

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
		}, 16);

		const handleTouchEndDirect = (e: TouchEvent) => {
			e.preventDefault();
			setIsDragging(false);
			setLastTouchDistance(0);

			if (
				(Math.abs(momentumRef.current.x) > 0.5 ||
					Math.abs(momentumRef.current.y) > 0.5) &&
				!animationFrameId.current
			) {
				lastFrameTime.current = performance.now();
				animationFrameId.current = requestAnimationFrame(applyMomentum);
			}
		};

		gridElement.addEventListener("wheel", handleWheelDirect, {
			passive: false,
			capture: true,
		});
		gridElement.addEventListener("touchstart", handleTouchStartDirect, {
			passive: false,
			capture: true,
		});
		gridElement.addEventListener("touchmove", handleTouchMoveDirect, {
			passive: false,
			capture: true,
		});
		gridElement.addEventListener("touchend", handleTouchEndDirect, {
			passive: false,
			capture: true,
		});

		return () => {
			gridElement.removeEventListener("wheel", handleWheelDirect);
			gridElement.removeEventListener("touchstart", handleTouchStartDirect);
			gridElement.removeEventListener("touchmove", handleTouchMoveDirect);
			gridElement.removeEventListener("touchend", handleTouchEndDirect);
		};
	}, [
		isDragging,
		dragStart,
		getTouchDistanceNative,
		getTouchCenterNative,
		lastTouchDistance,
		zoom,
		applyMomentum,
	]);

	// Debounced visible cells update
	const debouncedUpdateVisibleCells = useMemo(
		() => debounce(updateVisibleCells, 10),
		[updateVisibleCells],
	);

	useEffect(() => {
		debouncedUpdateVisibleCells();

		const handleResize = debounce(() => {
			updateVisibleCells();
		}, 100);

		window.addEventListener("resize", handleResize);
		return () => {
			window.removeEventListener("resize", handleResize);
			if (animationFrameId.current) {
				cancelAnimationFrame(animationFrameId.current);
			}
		};
	}, [updateVisibleCells, debouncedUpdateVisibleCells]);

	const handleKeyDown = useCallback(
		throttle((e: KeyboardEvent) => {
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
		}, 50),
		[zoom],
	);

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);

	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		if (animationFrameId.current) {
			cancelAnimationFrame(animationFrameId.current);
			animationFrameId.current = null;
		}

		setIsDragging(true);
		setDragStart({ x: e.clientX, y: e.clientY });
		momentumRef.current = { x: 0, y: 0 };
	}, []);

	const handleMouseMove = useCallback(
		throttle((e: React.MouseEvent) => {
			if (!isDragging) return;

			const dx = e.clientX - dragStart.x;
			const dy = e.clientY - dragStart.y;

			const now = performance.now();
			const deltaTime = now - lastFrameTime.current;

			if (deltaTime > 0) {
				momentumRef.current = {
					x: (dx / deltaTime) * 6,
					y: (dy / deltaTime) * 6,
				};
				lastFrameTime.current = now;
			}

			setPosition((prev) => ({
				x: prev.x + dx,
				y: prev.y + dy,
			}));

			setDragStart({ x: e.clientX, y: e.clientY });
		}, 16),
		[isDragging, dragStart],
	);

	const handleMouseUp = useCallback(() => {
		setIsDragging(false);

		if (
			(Math.abs(momentumRef.current.x) > 0.5 ||
				Math.abs(momentumRef.current.y) > 0.5) &&
			!animationFrameId.current
		) {
			lastFrameTime.current = performance.now();
			animationFrameId.current = requestAnimationFrame(applyMomentum);
		}
	}, [applyMomentum]);

	// Memoized cells rendering with batch preloading
	const renderedCells = useMemo(() => {
		// Batch preload images using for...of
		for (const { row, col } of visibleCells) {
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
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
				style={{
					touchAction: "none",
					userSelect: "none",
					WebkitUserSelect: "none",
					WebkitTouchCallout: "none",
					WebkitTapHighlightColor: "transparent",
					willChange: "transform",
				}}
			>
				<div className="absolute inset-0" style={{ willChange: "transform" }}>
					{renderedCells}
				</div>
			</div>
		</div>
	);
};
