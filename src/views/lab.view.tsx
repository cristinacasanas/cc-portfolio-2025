"use client";

import type React from "react";

import { LabNav } from "@/components/layout/lab.nav";
// import clsx from "clsx"
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { collection } from "../mock/collection";
import { DragAndDropView } from "./drag-and-drop.view";
import { ListView } from "./list.view";

interface LabViewProps {
	initialView?: string;
}

export default function LabView({ initialView = "canvas" }: LabViewProps) {
	// Use the initialView prop directly
	const view = initialView;

	// Return different view based on the initialView parameter
	return view === "grid" ? (
		<InfiniteImageGrid />
	) : view === "list" ? (
		<ListView />
	) : (
		<DragAndDropView />
	);
}

function InfiniteImageGrid() {
	const gridRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [visibleCells, setVisibleCells] = useState<
		Array<{ row: number; col: number }>
	>([]);
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const [momentum, setMomentum] = useState({ x: 0, y: 0 });
	const [isLoading, setIsLoading] = useState(false);
	const [imagesSizes, setImagesSizes] = useState<
		Record<string, { width: number; height: number }>
	>({});

	const momentumRef = useRef({ x: 0, y: 0 });
	const lastFrameTime = useRef(performance.now());
	const animationFrameId = useRef<number | null>(null);

	// Configuration optimisée
	const CELL_SIZE = 350; // Taille de base des cellules
	const GRID_LIMIT = 500; // Limite de la grille dans chaque direction
	const MOMENTUM_DECAY = 0.95;
	const MAX_IMAGE_WIDTH = 300; // Largeur maximale pour les images elles-mêmes
	const CELL_GAP = 30; // Espace entre les cellules

	// Calculer la taille réelle des cellules en fonction du zoom
	const actualCellSize = useMemo(() => CELL_SIZE * zoom, [zoom]);
	const actualCellGap = useMemo(() => CELL_GAP * zoom, [zoom]);

	// Fonction pour obtenir l'URL de l'image en fonction de la position
	const getImageUrl = useCallback((row: number, col: number): string => {
		const index = Math.abs((row * 10 + col) % collection.length);
		return collection[index].image;
	}, []);

	// Précharger les tailles d'images
	const preloadImageSize = useCallback(
		(url: string, cellKey: string) => {
			// Vérifier si on a déjà les dimensions
			if (imagesSizes[cellKey]) return;

			const img = new Image();
			img.onload = () => {
				setImagesSizes((prev) => ({
					...prev,
					[cellKey]: {
						width: img.naturalWidth,
						height: img.naturalHeight,
					},
				}));
				setIsLoading(false);
			};
			img.src = url;
		},
		[imagesSizes],
	);

	// Calculer les cellules visibles en fonction de la position et de la taille de la fenêtre
	const updateVisibleCells = useCallback(() => {
		if (!gridRef.current) return;

		const rect = gridRef.current.getBoundingClientRect();
		const viewportWidth = rect.width;
		const viewportHeight = rect.height;

		// Taille totale de chaque cellule avec l'espace
		const totalCellSize = actualCellSize + actualCellGap;

		// Calculer les indices des cellules visibles
		const startCol = Math.floor(-position.x / totalCellSize) - 3;
		const startRow = Math.floor(-position.y / totalCellSize) - 3;
		const endCol = startCol + Math.ceil(viewportWidth / totalCellSize) + 6;
		const endRow = startRow + Math.ceil(viewportHeight / totalCellSize) + 6;

		// Générer la liste des cellules visibles
		const cells: Array<{ row: number; col: number }> = [];
		for (let row = startRow; row <= endRow; row++) {
			for (let col = startCol; col <= endCol; col++) {
				// Limiter la grille pour éviter un nombre infini de cellules
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
	}, [position, actualCellSize, actualCellGap]);

	// Optimisation: Effet d'animation avec inertie
	const applyMomentum = useCallback(() => {
		if (
			Math.abs(momentumRef.current.x) < 0.1 &&
			Math.abs(momentumRef.current.y) < 0.1
		) {
			if (animationFrameId.current) {
				cancelAnimationFrame(animationFrameId.current);
				animationFrameId.current = null;
			}
			return;
		}

		const now = performance.now();
		const deltaTime = (now - lastFrameTime.current) / 16; // Normaliser à ~60fps
		lastFrameTime.current = now;

		// Appliquer le momentum avec décroissance
		setPosition((prev) => ({
			x: prev.x + momentumRef.current.x * deltaTime,
			y: prev.y + momentumRef.current.y * deltaTime,
		}));

		// Réduire le momentum progressivement
		momentumRef.current = {
			x: momentumRef.current.x * MOMENTUM_DECAY ** deltaTime,
			y: momentumRef.current.y * MOMENTUM_DECAY ** deltaTime,
		};

		setMomentum(momentumRef.current);

		animationFrameId.current = requestAnimationFrame(applyMomentum);
	}, []);

	// Mettre à jour les cellules visibles lorsque la position ou le zoom change
	useEffect(() => {
		updateVisibleCells();

		const handleResize = () => {
			updateVisibleCells();
		};

		window.addEventListener("resize", handleResize);
		return () => {
			window.removeEventListener("resize", handleResize);
			if (animationFrameId.current) {
				cancelAnimationFrame(animationFrameId.current);
			}
		};
	}, [updateVisibleCells]);

	// Optimisation: Navigation au clavier avec useCallback
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

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);

	// Optimisation: Gestion du glisser-déposer avec useCallback
	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		// Arrêter l'animation de momentum
		if (animationFrameId.current) {
			cancelAnimationFrame(animationFrameId.current);
			animationFrameId.current = null;
		}

		setIsDragging(true);
		setDragStart({ x: e.clientX, y: e.clientY });

		// Réinitialiser le momentum
		momentumRef.current = { x: 0, y: 0 };
		setMomentum({ x: 0, y: 0 });
	}, []);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (!isDragging) return;

			const dx = e.clientX - dragStart.x;
			const dy = e.clientY - dragStart.y;

			// Calculer le momentum basé sur le mouvement
			const now = performance.now();
			const deltaTime = now - lastFrameTime.current;

			if (deltaTime > 0) {
				momentumRef.current = {
					x: (dx / deltaTime) * 8,
					y: (dy / deltaTime) * 8,
				};
				setMomentum(momentumRef.current);
				lastFrameTime.current = now;
			}

			setPosition((prev) => ({
				x: prev.x + dx,
				y: prev.y + dy,
			}));

			setDragStart({ x: e.clientX, y: e.clientY });
		},
		[isDragging, dragStart],
	);

	const handleMouseUp = useCallback(() => {
		setIsDragging(false);

		// Démarrer l'animation de momentum
		if (
			(Math.abs(momentum.x) > 0.1 || Math.abs(momentum.y) > 0.1) &&
			!animationFrameId.current
		) {
			lastFrameTime.current = performance.now();
			animationFrameId.current = requestAnimationFrame(applyMomentum);
		}
	}, [momentum, applyMomentum]);

	// Optimisation: Gestion de la molette avec useCallback
	const handleWheel = useCallback(
		(e: React.WheelEvent) => {
			e.preventDefault();

			// Zoom avec Ctrl+Molette
			if (e.ctrlKey) {
				const zoomDelta = -e.deltaY * 0.001;
				setZoom((prev) => Math.max(0.5, Math.min(3, prev + zoomDelta)));
				return;
			}

			// Correction du défilement horizontal
			const deltaX = e.shiftKey ? e.deltaY : e.deltaX;
			const deltaY = e.shiftKey ? 0 : e.deltaY;

			// Mettre à jour la position en fonction du mouvement de la molette
			setPosition((prev) => ({
				x: prev.x - deltaX * (1 / zoom) * 0.5,
				y: prev.y - deltaY * (1 / zoom) * 0.5,
			}));

			// Ajouter un peu de momentum pour un défilement plus fluide
			momentumRef.current = {
				x: momentumRef.current.x - deltaX * 0.02 * (1 / zoom),
				y: momentumRef.current.y - deltaY * 0.02 * (1 / zoom),
			};
			setMomentum(momentumRef.current);

			// Démarrer l'animation de momentum si elle n'est pas déjà en cours
			if (!animationFrameId.current) {
				lastFrameTime.current = performance.now();
				animationFrameId.current = requestAnimationFrame(applyMomentum);
			}
		},
		[zoom, applyMomentum],
	);

	// Optimisation: Rendu des cellules avec useMemo
	const renderedCells = useMemo(() => {
		return visibleCells.map(({ row, col }) => {
			// Taille totale de chaque cellule avec l'espace
			const totalCellSize = actualCellSize + actualCellGap;

			// Calculer la position pour cette cellule
			const left = col * totalCellSize;
			const top = row * totalCellSize;

			// Clé unique pour cette cellule
			const cellKey = `${row}-${col}`;

			// Obtenir l'URL de l'image
			const imageUrl = getImageUrl(row, col);

			// Précharger l'image pour obtenir ses dimensions
			preloadImageSize(imageUrl, cellKey);

			// Récupérer les dimensions de l'image si disponibles, sinon utiliser valeurs par défaut
			const imageSize = imagesSizes[cellKey];

			// Si l'image n'est pas encore chargée, on affiche un placeholder
			if (!imageSize) {
				return (
					<div
						key={cellKey}
						className="absolute flex items-center justify-center"
						style={{
							left: `${position.x + left}px`,
							top: `${position.y + top}px`,
							width: `${actualCellSize}px`,
							height: `${actualCellSize}px`,
						}}
					>
						<div className="text-gray-300 text-sm">Chargement...</div>
					</div>
				);
			}

			// Calculer les dimensions d'affichage en respectant le ratio d'aspect
			let displayWidth = imageSize.width;
			let displayHeight = imageSize.height;

			// Limiter la taille maximale tout en préservant le ratio
			if (displayWidth > MAX_IMAGE_WIDTH) {
				const ratio = MAX_IMAGE_WIDTH / displayWidth;
				displayWidth = MAX_IMAGE_WIDTH;
				displayHeight = imageSize.height * ratio;
			}

			// S'assurer que la hauteur ne dépasse pas non plus la taille de la cellule
			const maxHeight = actualCellSize * 0.9;
			if (displayHeight > maxHeight) {
				const ratio = maxHeight / displayHeight;
				displayHeight = maxHeight;
				displayWidth = displayWidth * ratio;
			}

			// Appliquer le zoom
			displayWidth = displayWidth * zoom;
			displayHeight = displayHeight * zoom;

			return (
				<div
					key={cellKey}
					className="absolute"
					style={{
						left: `${position.x + left + (actualCellSize - displayWidth) / 2}px`,
						top: `${position.y + top + (actualCellSize - displayHeight) / 2}px`,
						width: `${displayWidth}px`,
						height: `${displayHeight}px`,
					}}
				>
					<img
						src={imageUrl}
						alt="okay"
						className="h-full w-full object-contain"
						loading="lazy"
						onError={(e) => {
							// Fallback en cas d'erreur de chargement
							const target = e.target as HTMLImageElement;
							target.src = `/placeholder.svg?height=${displayHeight}&width=${displayWidth}&text=${row},${col}`;
						}}
					/>
				</div>
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

	// Centrer la grille au premier rendu
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
		<div className="fixed inset-0 overflow-hidden bg-gray-50 pt-12">
			<div
				className="absolute inset-0 overflow-hidden"
				ref={gridRef}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
				onWheel={handleWheel}
			>
				{isLoading && (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
						Chargement...
					</div>
				)}
				<div className="absolute inset-0">{renderedCells}</div>
			</div>
			<div className="pointer-events-none fixed right-0 bottom-8 left-0 z-10 flex justify-center">
				<div className="pointer-events-auto">
					<LabNav />
				</div>
			</div>
		</div>
	);
}
