// import clsx from "clsx"
import { getLab } from "@/lib/queries/lab";
import { client } from "@/lib/sanity";
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

// Configuration constants
const GRID_CONFIG: GridConfig = {
	CELL_SIZE: 350,
	GRID_LIMIT: 200,
	MOMENTUM_DECAY: 0.92,
	CELL_GAP: 30,
	ANIMATION_THROTTLE: 16,
	MAX_IMAGE_WIDTH: 300,
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

// Memoized Image Cell Component
const ImageCell = memo<{
	row: number;
	col: number;
	imageUrl: string;
	cellSize: number;
	cellGap: number;
	position: Position;
	zoom: number;
	imageSize?: ImageSize;
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

// Custom hooks for better separation of concerns
function useImagePreloading() {
	const [imagesSizes, setImagesSizes] = useState<Record<string, ImageSize>>({});
	const imageLoadingCache = useRef<Set<string>>(new Set());

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

	return { imagesSizes, preloadImageSize };
}

function useMomentum() {
	const momentumRef = useRef<Position>({ x: 0, y: 0 });
	const lastFrameTime = useRef(performance.now());
	const animationFrameId = useRef<number | null>(null);

	const applyMomentum = useCallback(
		(setPosition: React.Dispatch<React.SetStateAction<Position>>) => {
			const threshold = 0.5;
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
		[],
	);

	const startMomentum = useCallback(
		(setPosition: React.Dispatch<React.SetStateAction<Position>>) => {
			if (
				(Math.abs(momentumRef.current.x) > 0.5 ||
					Math.abs(momentumRef.current.y) > 0.5) &&
				!animationFrameId.current
			) {
				lastFrameTime.current = performance.now();
				animationFrameId.current = requestAnimationFrame(() =>
					applyMomentum(setPosition),
				);
			}
		},
		[applyMomentum],
	);

	const stopMomentum = useCallback(() => {
		if (animationFrameId.current) {
			cancelAnimationFrame(animationFrameId.current);
			animationFrameId.current = null;
		}
		momentumRef.current = { x: 0, y: 0 };
	}, []);

	const updateMomentum = useCallback(
		(deltaX: number, deltaY: number, factor = 6) => {
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
		[],
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

	// State
	const gridRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [visibleCells, setVisibleCells] = useState<CellPosition[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
	const [lastTouchDistance, setLastTouchDistance] = useState<number>(0);

	// Custom hooks
	const { imagesSizes, preloadImageSize } = useImagePreloading();
	const { startMomentum, stopMomentum, updateMomentum, addMomentum } =
		useMomentum();
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

	// Visible cells calculation
	const updateVisibleCells = useCallback(() => {
		if (!gridRef.current) return;

		const rect = gridRef.current.getBoundingClientRect();
		const viewportWidth = rect.width;
		const viewportHeight = rect.height;

		const totalCellSize = actualCellSize + actualCellGap;
		const buffer = 2;

		const startCol = Math.floor(-position.x / totalCellSize) - buffer;
		const startRow = Math.floor(-position.y / totalCellSize) - buffer;
		const endCol =
			startCol + Math.ceil(viewportWidth / totalCellSize) + buffer * 2;
		const endRow =
			startRow + Math.ceil(viewportHeight / totalCellSize) + buffer * 2;

		const cells: CellPosition[] = [];
		for (let row = startRow; row <= endRow; row++) {
			for (let col = startCol; col <= endCol; col++) {
				if (
					row >= -GRID_CONFIG.GRID_LIMIT &&
					row <= GRID_CONFIG.GRID_LIMIT &&
					col >= -GRID_CONFIG.GRID_LIMIT &&
					col <= GRID_CONFIG.GRID_LIMIT
				) {
					cells.push({ row, col });
				}
			}
		}

		setVisibleCells(cells);
	}, [position, actualCellSize, actualCellGap]);

	// Event handlers
	const handleWheelEvent = useCallback(
		(e: WheelEvent) => {
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

			addMomentum(-deltaX * (1 / zoom), -deltaY * (1 / zoom));
			startMomentum(setPosition);
		},
		[zoom, addMomentum, startMomentum],
	);

	const handleTouchStart = useCallback(
		(e: TouchEvent) => {
			e.preventDefault();
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
		[stopMomentum, getTouchDistance],
	);

	const handleTouchMove = useCallback(
		(e: TouchEvent) => {
			e.preventDefault();

			const touches = e.touches;

			if (touches.length === 1 && isDragging) {
				const dx = touches[0].clientX - dragStart.x;
				const dy = touches[0].clientY - dragStart.y;

				updateMomentum(dx, dy);

				setPosition((prev) => ({
					x: prev.x + dx,
					y: prev.y + dy,
				}));

				setDragStart({ x: touches[0].clientX, y: touches[0].clientY });
			} else if (touches.length === 2) {
				const distance = getTouchDistance(touches);
				const center = getTouchCenter(touches);

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
		},
		[
			isDragging,
			dragStart,
			getTouchDistance,
			getTouchCenter,
			lastTouchDistance,
			zoom,
			updateMomentum,
		],
	);

	const handleTouchEnd = useCallback(
		(e: TouchEvent) => {
			e.preventDefault();
			setIsDragging(false);
			setLastTouchDistance(0);
			startMomentum(setPosition);
		},
		[startMomentum],
	);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			stopMomentum();
			setIsDragging(true);
			setDragStart({ x: e.clientX, y: e.clientY });
		},
		[stopMomentum],
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (!isDragging) return;

			const dx = e.clientX - dragStart.x;
			const dy = e.clientY - dragStart.y;

			updateMomentum(dx, dy);

			setPosition((prev) => ({
				x: prev.x + dx,
				y: prev.y + dy,
			}));

			setDragStart({ x: e.clientX, y: e.clientY });
		},
		[isDragging, dragStart, updateMomentum],
	);

	const handleMouseUp = useCallback(() => {
		setIsDragging(false);
		startMomentum(setPosition);
	}, [startMomentum]);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
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
		[zoom],
	);

	// Event listeners setup
	useEffect(() => {
		const gridElement = gridRef.current;
		if (!gridElement) return;

		const throttledWheel = createThrottle(handleWheelEvent, 8);
		const throttledTouchMove = createThrottle(handleTouchMove, 16);
		const throttledKeyDown = createThrottle(handleKeyDown, 50);

		gridElement.addEventListener("wheel", throttledWheel, {
			passive: false,
			capture: true,
		});
		gridElement.addEventListener("touchstart", handleTouchStart, {
			passive: false,
			capture: true,
		});
		gridElement.addEventListener("touchmove", throttledTouchMove, {
			passive: false,
			capture: true,
		});
		gridElement.addEventListener("touchend", handleTouchEnd, {
			passive: false,
			capture: true,
		});

		window.addEventListener("keydown", throttledKeyDown);

		return () => {
			gridElement.removeEventListener("wheel", throttledWheel);
			gridElement.removeEventListener("touchstart", handleTouchStart);
			gridElement.removeEventListener("touchmove", throttledTouchMove);
			gridElement.removeEventListener("touchend", handleTouchEnd);
			window.removeEventListener("keydown", throttledKeyDown);
		};
	}, [
		handleWheelEvent,
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd,
		handleKeyDown,
	]);

	// Update visible cells with debouncing
	const debouncedUpdateVisibleCells = useMemo(
		() => createDebounce(updateVisibleCells, 10),
		[updateVisibleCells],
	);

	useEffect(() => {
		debouncedUpdateVisibleCells();

		const handleResize = createDebounce(updateVisibleCells, 100);
		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, [updateVisibleCells, debouncedUpdateVisibleCells]);

	// Rendered cells with batch preloading
	const renderedCells = useMemo(() => {
		// Batch preload images
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
				onMouseMove={createThrottle(handleMouseMove, 16)}
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
