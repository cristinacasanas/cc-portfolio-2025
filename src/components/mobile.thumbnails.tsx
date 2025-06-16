import { getAllProjects, getProjectsByCategory } from "@/lib/queries";
import { client } from "@/lib/sanity";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Categories, Projects } from "studio/sanity.types";
import { Thumbnail } from "./ui/thumbnail";

type ProjectWithCategories = Projects & {
	expandedCategories?: Categories[];
};

interface ProjectInViewEvent extends CustomEvent {
	detail: {
		projectId: string;
		isInTopHalf?: boolean;
		intersectionRatio?: number;
		centrality?: number;
		visibleRatio?: number;
		enteringFromTop?: boolean;
		isActive?: boolean;
	};
}

export const MobileThumbnails = () => {
	const { category, project } = useSearch({ from: "/" });
	const [visibleProject, setVisibleProject] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const thumbnailRefs = useRef<Map<string, HTMLDivElement>>(new Map());
	const isScrollingProgrammatically = useRef(false);
	const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastVisibleProjectRef = useRef<string | null>(null);
	const retryCountRef = useRef(0);
	const maxRetries = 5;
	const lastUpdateTimeRef = useRef(0);
	const updateCooldownMs = 400;
	const resizeObserverRef = useRef<ResizeObserver | null>(null);
	const stabilityThresholdRef = useRef(0);
	const stabilityThreshold = 0.3;
	const lastScrollTimeRef = useRef(0);
	const scrollEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const isUserScrollingRef = useRef(false);
	const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const scrollStabilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastScrollDirectionRef = useRef<"left" | "right" | null>(null);
	const lastScrollPositionRef = useRef(0);
	const scrollStableRef = useRef(true);
	const selectionLockRef = useRef(false);
	const isAtBoundaryRef = useRef<"start" | "near-start" | "end" | null>(null);

	const { data } = useQuery({
		queryKey: ["thumbnails", { category }],
		queryFn: async () => {
			if (category) {
				return client.fetch<ProjectWithCategories[]>(
					getProjectsByCategory(category),
				);
			}
			return client.fetch<ProjectWithCategories[]>(getAllProjects);
		},
	});

	// Memoize projects processing
	const sortedProjects = useMemo(() => {
		if (!data) return [];
		return [...data];
	}, [data]);

	// Get boundary project IDs with more detailed near-boundary info
	const boundaryIds = useMemo(() => {
		if (sortedProjects.length < 2) {
			return {
				first:
					sortedProjects[0]?.slug?.current || sortedProjects[0]?._id || null,
				second: null,
				last:
					sortedProjects[0]?.slug?.current || sortedProjects[0]?._id || null,
			};
		}

		const firstProject = sortedProjects[0];
		const secondProject = sortedProjects[1];
		const lastProject = sortedProjects[sortedProjects.length - 1];

		return {
			first: firstProject?.slug?.current || firstProject?._id || null,
			second: secondProject?.slug?.current || secondProject?._id || null,
			last: lastProject?.slug?.current || lastProject?._id || null,
		};
	}, [sortedProjects]);

	// Reset all scroll and selection state
	const resetScrollState = useCallback(() => {
		isScrollingProgrammatically.current = false;
		isUserScrollingRef.current = false;
		lastScrollDirectionRef.current = null;
		stabilityThresholdRef.current = 0;
		scrollStableRef.current = true;
		selectionLockRef.current = false;
		isAtBoundaryRef.current = null;

		// Clear all timeouts
		if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
		if (scrollEndTimeoutRef.current) clearTimeout(scrollEndTimeoutRef.current);
		if (userScrollTimeoutRef.current)
			clearTimeout(userScrollTimeoutRef.current);
		if (scrollStabilityTimeoutRef.current)
			clearTimeout(scrollStabilityTimeoutRef.current);
	}, []);

	// Check if we're at or near a boundary position with improved detection
	const checkBoundaryPosition = useCallback(() => {
		if (!containerRef.current || !boundaryIds.first) return;

		const container = containerRef.current;
		const firstThumb = thumbnailRefs.current.get(boundaryIds.first);
		const secondThumb = boundaryIds.second
			? thumbnailRefs.current.get(boundaryIds.second)
			: null;
		const lastThumb = boundaryIds.last
			? thumbnailRefs.current.get(boundaryIds.last)
			: null;

		if (!firstThumb) return;

		// Wider threshold for start detection
		if (container.scrollLeft < 30) {
			isAtBoundaryRef.current = "start";
			return;
		}

		// Near-start detection - within the first two items
		if (secondThumb && container.scrollLeft < secondThumb.offsetWidth * 1.5) {
			isAtBoundaryRef.current = "near-start";
			return;
		}

		// End boundary detection
		if (lastThumb && container.scrollWidth - container.clientWidth > 0) {
			const maxScroll = container.scrollWidth - container.clientWidth;
			if (Math.abs(container.scrollLeft - maxScroll) < 30) {
				isAtBoundaryRef.current = "end";
				return;
			}
		}

		isAtBoundaryRef.current = null;
	}, [boundaryIds]);

	// Determine if an item is a boundary item with enhanced logic
	const isBoundaryItem = useCallback(
		(projectId: string): "first" | "second" | "last" | null => {
			if (projectId === boundaryIds.first) return "first";
			if (projectId === boundaryIds.second) return "second";
			if (projectId === boundaryIds.last) return "last";
			return null;
		},
		[boundaryIds],
	);

	// Optimize first two items rendering
	useEffect(() => {
		// Force immediate rendering of first two items for better performance
		if (sortedProjects.length >= 2 && containerRef.current) {
			// Set initial scroll position to 0 to ensure first items are visible
			containerRef.current.scrollLeft = 0;

			// Force layout recalculation for first items
			if (boundaryIds.first) {
				const firstThumb = thumbnailRefs.current.get(boundaryIds.first);
				if (firstThumb) {
					// Trigger reflow
					void firstThumb.offsetHeight;
				}
			}

			if (boundaryIds.second) {
				const secondThumb = thumbnailRefs.current.get(boundaryIds.second);
				if (secondThumb) {
					// Trigger reflow
					void secondThumb.offsetHeight;
				}
			}
		}
	}, [sortedProjects, boundaryIds]);

	// Optimized scroll for all positions including improved start handling
	const scrollToThumbnail = useCallback(
		(projectId: string, immediate = false) => {
			if (!projectId || !containerRef.current) return;

			// Don't scroll during user interaction unless forced
			if (isUserScrollingRef.current && !immediate) return;

			// Don't scroll if scroll isn't stable, unless forced
			if (!scrollStableRef.current && !immediate) return;

			// Don't scroll if we're in selection lock mode
			if (selectionLockRef.current && !immediate) return;

			const container = containerRef.current;
			const activeThumb = thumbnailRefs.current.get(projectId);
			if (!activeThumb) {
				if (retryCountRef.current < maxRetries) {
					retryCountRef.current++;
					setTimeout(() => scrollToThumbnail(projectId, immediate), 50);
				}
				return;
			}

			// Reset retry count on successful find
			retryCountRef.current = 0;

			// Check dimensions
			const rect = activeThumb.getBoundingClientRect();
			if (rect.width === 0 || rect.height === 0) {
				if (retryCountRef.current < maxRetries) {
					retryCountRef.current++;
					setTimeout(() => scrollToThumbnail(projectId, immediate), 50);
				}
				return;
			}

			// Don't scroll if already in motion and not forced
			if (isScrollingProgrammatically.current && !immediate) {
				return;
			}

			isScrollingProgrammatically.current = true;

			try {
				const containerRect = container.getBoundingClientRect();
				const thumbRect = activeThumb.getBoundingClientRect();

				// Get boundary status
				const boundaryStatus = isBoundaryItem(projectId);

				// Special fast path for first two items to eliminate lag
				if (boundaryStatus === "first" || boundaryStatus === "second") {
					// For first and second items, use a more direct approach
					// This avoids complex animations that can cause lag
					requestAnimationFrame(() => {
						// Immediate scroll with no animation for first item
						if (boundaryStatus === "first") {
							container.scrollLeft = 0;
							isAtBoundaryRef.current = "start";
						}
						// Optimized position for second item
						else if (boundaryStatus === "second") {
							const firstThumb = thumbnailRefs.current.get(
								boundaryIds.first || "",
							);
							const firstWidth = firstThumb?.offsetWidth || 0;
							container.scrollLeft = Math.max(0, firstWidth * 0.5);
							isAtBoundaryRef.current = "near-start";
						}

						// Reset state quickly
						setTimeout(() => {
							isScrollingProgrammatically.current = false;
							selectionLockRef.current = false;
						}, 50);
					});

					return; // Skip the rest of the function for first two items
				}

				// Skip scrolling if already well-positioned (unless forced)
				const thumbCenter = thumbRect.left + thumbRect.width / 2;
				const containerCenter = containerRect.left + containerRect.width / 2;
				const distanceFromCenter = Math.abs(containerCenter - thumbCenter);

				if (distanceFromCenter < containerRect.width * 0.25 && !immediate) {
					isScrollingProgrammatically.current = false;
					return;
				}

				// Calculate scroll position based on item position
				let scrollLeft: number;

				if (boundaryStatus === "last") {
					// Last item - scroll to end
					scrollLeft = container.scrollWidth - container.clientWidth;
					isAtBoundaryRef.current = "end";
				} else {
					// Normal centering calculation for middle items
					isAtBoundaryRef.current = null;
					scrollLeft =
						thumbRect.left +
						container.scrollLeft -
						containerRect.left -
						containerRect.width / 2 +
						thumbRect.width / 2;
				}

				// Always use fast scroll for boundary items or during fast scrolling
				const useImmediateScroll =
					immediate || boundaryStatus === "last" || isUserScrollingRef.current;

				// Use requestAnimationFrame for smoother scrolling
				requestAnimationFrame(() => {
					// Perform main scroll
					container.scrollTo({
						left: Math.max(
							0,
							Math.min(
								scrollLeft,
								container.scrollWidth - container.clientWidth,
							),
						),
						behavior: useImmediateScroll ? "auto" : "smooth",
					});

					// For boundary items, follow up with a second scroll to ensure precision
					if (boundaryStatus === "last" && !immediate) {
						setTimeout(() => {
							if (!container) return;
							container.scrollTo({
								left: container.scrollWidth - container.clientWidth,
								behavior: "smooth",
							});
						}, 0);
					}
				});
			} catch (error) {
				isScrollingProgrammatically.current = false;
				return;
			}

			// Lock selection during scroll
			selectionLockRef.current = true;

			// Reset scrolling flag and selection lock after animation completes
			// Use shorter time for boundary items
			const boundaryStatus = isBoundaryItem(projectId);
			const isAnyBoundary = boundaryStatus !== null;

			// Use different timing based on item position and scroll type
			const resetTime = immediate ? 100 : isAnyBoundary ? 250 : 400;

			if (scrollEndTimeoutRef.current) {
				clearTimeout(scrollEndTimeoutRef.current);
			}

			scrollEndTimeoutRef.current = setTimeout(() => {
				isScrollingProgrammatically.current = false;
				selectionLockRef.current = false;

				// For boundary items, do a final position check
				if (isAnyBoundary) {
					checkBoundaryPosition();
				}
			}, resetTime);
		},
		[boundaryIds, checkBoundaryPosition, isBoundaryItem],
	);

	// Ultra-stable update function with enhanced boundary handling
	const updateVisibleProject = useCallback(
		(projectId: string, immediate = false, force = false) => {
			if (!projectId) return;
			if (lastVisibleProjectRef.current === projectId && !force) return;

			// Special handling for boundary items
			const boundaryStatus = isBoundaryItem(projectId);
			const isAnyBoundary = boundaryStatus !== null;

			// Extreme stability checks - bypass most checks for boundary items
			if (!force && !isAnyBoundary) {
				// Don't change during programmatic scrolling
				if (isScrollingProgrammatically.current) return;

				// Don't change during user scrolling
				if (isUserScrollingRef.current) return;

				// Don't change while scroll is settling
				if (!scrollStableRef.current) return;

				// Don't change during selection lock
				if (selectionLockRef.current) return;

				// Enforce strong cooldown
				const now = Date.now();
				if (now - lastUpdateTimeRef.current < updateCooldownMs) {
					return;
				}

				// Only allow changes if the new thumbnail position is significantly better
				const activeThumb = thumbnailRefs.current.get(projectId);
				if (!activeThumb || !containerRef.current) return;

				const containerRect = containerRef.current.getBoundingClientRect();
				const thumbRect = activeThumb.getBoundingClientRect();

				// Score current thumbnail position (0 = perfect, 1 = worst)
				const thumbCenter = thumbRect.left + thumbRect.width / 2;
				const containerCenter = containerRect.left + containerRect.width / 2;
				const currentScore =
					Math.abs(containerCenter - thumbCenter) / containerRect.width;

				// Strong hysteresis - only change if new position is significantly better
				if (currentScore > stabilityThresholdRef.current - stabilityThreshold) {
					return;
				}

				// Update threshold for next comparison
				stabilityThresholdRef.current = currentScore;
			} else {
				// On forced updates, reset stability metrics
				stabilityThresholdRef.current = 0;
			}

			// Update timestamps and state
			lastUpdateTimeRef.current = Date.now();
			lastVisibleProjectRef.current = projectId;
			setVisibleProject(projectId);

			// Clear any existing scroll timeout
			if (scrollTimeoutRef.current) {
				clearTimeout(scrollTimeoutRef.current);
			}

			// Always use immediate scrolling for first and second items
			const useImmediateScroll =
				immediate || boundaryStatus === "first" || boundaryStatus === "second";

			// Use different scroll timing for boundary items
			if (!isUserScrollingRef.current || useImmediateScroll) {
				if (useImmediateScroll) {
					scrollToThumbnail(projectId, true);
				} else {
					// Delayed scroll to ensure state is updated first
					scrollTimeoutRef.current = setTimeout(() => {
						scrollToThumbnail(projectId, false);
					}, 100);
				}
			}
		},
		[scrollToThumbnail, isBoundaryItem],
	);

	// Simplified, stable centered thumbnail detection
	const detectCenteredThumbnail = useCallback(() => {
		// Only detect when appropriate
		if (
			isScrollingProgrammatically.current ||
			selectionLockRef.current ||
			!scrollStableRef.current ||
			!containerRef.current ||
			thumbnailRefs.current.size === 0
		)
			return;

		// Check for boundary positions first - this improves edge detection
		checkBoundaryPosition();

		// If we're at a boundary, prioritize the boundary item
		if (isAtBoundaryRef.current === "start" && boundaryIds.first) {
			if (lastVisibleProjectRef.current !== boundaryIds.first) {
				updateVisibleProject(boundaryIds.first, true);
			}
			return;
		}

		// Near-start detection - prioritize the second item
		if (isAtBoundaryRef.current === "near-start" && boundaryIds.second) {
			if (lastVisibleProjectRef.current !== boundaryIds.second) {
				updateVisibleProject(boundaryIds.second, true);
			}
			return;
		}

		if (isAtBoundaryRef.current === "end" && boundaryIds.last) {
			if (lastVisibleProjectRef.current !== boundaryIds.last) {
				updateVisibleProject(boundaryIds.last, true);
			}
			return;
		}

		// For non-boundary positions, use normal detection
		const containerRect = containerRef.current.getBoundingClientRect();
		const containerCenter = containerRect.left + containerRect.width / 2;

		let bestMatch = {
			projectId: "",
			distance: Number.POSITIVE_INFINITY,
		};

		thumbnailRefs.current.forEach((thumbEl, projectId) => {
			const thumbRect = thumbEl.getBoundingClientRect();

			// Skip if element isn't significantly visible
			if (
				thumbRect.right < containerRect.left ||
				thumbRect.left > containerRect.right
			) {
				return;
			}

			// Skip if less than 40% visible
			const visibleLeft = Math.max(thumbRect.left, containerRect.left);
			const visibleRight = Math.min(thumbRect.right, containerRect.right);
			const visibleWidth = Math.max(0, visibleRight - visibleLeft);
			const visibleRatio = visibleWidth / thumbRect.width;

			if (visibleRatio < 0.4) return;

			// Simple distance from center calculation
			const thumbCenter = thumbRect.left + thumbRect.width / 2;
			const distance = Math.abs(containerCenter - thumbCenter);

			if (distance < bestMatch.distance) {
				bestMatch = {
					projectId,
					distance,
				};
			}
		});

		// Only update if we found a valid match and it's different from current
		if (
			bestMatch.projectId &&
			lastVisibleProjectRef.current !== bestMatch.projectId
		) {
			updateVisibleProject(bestMatch.projectId);
		}
	}, [updateVisibleProject, boundaryIds, checkBoundaryPosition]);

	// Handle project changes from URL (highest priority)
	useEffect(() => {
		if (project) {
			// Reset all state on URL change
			resetScrollState();
			updateVisibleProject(project, true, true);
		}
	}, [project, updateVisibleProject, resetScrollState]);

	// Initialize first project when data loads
	useEffect(() => {
		if (!visibleProject && sortedProjects.length > 0) {
			const firstProject = sortedProjects[0];
			const firstProjectId = firstProject.slug?.current || firstProject._id;
			if (firstProjectId) {
				resetScrollState();
				updateVisibleProject(firstProjectId, true, true);
			}
		}
	}, [sortedProjects, visibleProject, updateVisibleProject, resetScrollState]);

	// Simplified project visibility event handler - only respond to explicit interactions
	useEffect(() => {
		const handleVisibleProject = (e: ProjectInViewEvent) => {
			if (isScrollingProgrammatically.current) return;

			const { projectId, isActive } = e.detail;

			if (!projectId || !isActive) return;

			// Only respect events for active projects with explicit interaction
			if (isActive) {
				resetScrollState(); // Reset state on explicit interaction
				updateVisibleProject(projectId, true, true);
			}
		};

		window.addEventListener(
			"projectInView",
			handleVisibleProject as EventListener,
		);

		return () => {
			window.removeEventListener(
				"projectInView",
				handleVisibleProject as EventListener,
			);
		};
	}, [updateVisibleProject, resetScrollState]);

	// Enhanced scroll detection with improved boundary awareness
	useEffect(() => {
		const handleScrollStart = () => {
			isUserScrollingRef.current = true;
			scrollStableRef.current = false;

			// Clear any timeout that would end scrolling state
			if (userScrollTimeoutRef.current) {
				clearTimeout(userScrollTimeoutRef.current);
			}
			if (scrollStabilityTimeoutRef.current) {
				clearTimeout(scrollStabilityTimeoutRef.current);
			}
		};

		// Use requestAnimationFrame for smoother scroll handling
		let rafId: number | null = null;

		const handleScroll = () => {
			// Cancel any pending animation frame
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
			}

			// Immediately mark as scrolling
			handleScrollStart();

			// Use requestAnimationFrame to debounce scroll handling
			rafId = requestAnimationFrame(() => {
				const now = Date.now();

				// Check for boundary positions during active scrolling
				const container = containerRef.current;
				if (!container) return;

				const currentPosition = container.scrollLeft;

				// Enhanced boundary detection with near-start zone
				if (currentPosition <= 10) {
					isAtBoundaryRef.current = "start";
				} else if (currentPosition < 100) {
					isAtBoundaryRef.current = "near-start";
				} else if (
					Math.abs(
						currentPosition - (container.scrollWidth - container.clientWidth),
					) <= 10
				) {
					isAtBoundaryRef.current = "end";
				} else {
					isAtBoundaryRef.current = null;
				}

				// Determine scroll direction
				if (currentPosition > lastScrollPositionRef.current) {
					lastScrollDirectionRef.current = "right";
				} else if (currentPosition < lastScrollPositionRef.current) {
					lastScrollDirectionRef.current = "left";
				}

				lastScrollPositionRef.current = currentPosition;
				lastScrollTimeRef.current = now;

				// Clear previous timeouts
				if (userScrollTimeoutRef.current) {
					clearTimeout(userScrollTimeoutRef.current);
				}
				if (scrollStabilityTimeoutRef.current) {
					clearTimeout(scrollStabilityTimeoutRef.current);
				}

				// Wait for scrolling to completely stop
				userScrollTimeoutRef.current = setTimeout(() => {
					isUserScrollingRef.current = false;

					// Detect boundaries before checking stability
					checkBoundaryPosition();

					// Additional delay before allowing detection
					scrollStabilityTimeoutRef.current = setTimeout(() => {
						scrollStableRef.current = true;

						// Prioritize boundary items after scrolling stops
						if (isAtBoundaryRef.current === "start" && boundaryIds.first) {
							if (lastVisibleProjectRef.current !== boundaryIds.first) {
								updateVisibleProject(boundaryIds.first, true);
							}
						} else if (
							isAtBoundaryRef.current === "near-start" &&
							boundaryIds.second
						) {
							if (lastVisibleProjectRef.current !== boundaryIds.second) {
								updateVisibleProject(boundaryIds.second, true);
							}
						} else if (isAtBoundaryRef.current === "end" && boundaryIds.last) {
							if (lastVisibleProjectRef.current !== boundaryIds.last) {
								updateVisibleProject(boundaryIds.last, true);
							}
							// Only detect once scroll is completely stable and not at boundary
						} else if (!isScrollingProgrammatically.current) {
							detectCenteredThumbnail();
						}
					}, 80); // Faster stability timing
				}, 80); // Faster scroll end detection
			});
		};

		// Explicit interaction handlers with improved performance
		const handleTouchStart = () => {
			handleScrollStart();
		};

		const handleTouchEnd = () => {
			// Don't end scrolling state immediately - wait for momentum scrolling
		};

		// Use passive event listeners for better performance
		const container = containerRef.current;
		if (container) {
			container.addEventListener("scroll", handleScroll, { passive: true });
			container.addEventListener("touchstart", handleTouchStart, {
				passive: true,
			});
			container.addEventListener("touchend", handleTouchEnd, { passive: true });
		}

		return () => {
			if (container) {
				container.removeEventListener("scroll", handleScroll);
				container.removeEventListener("touchstart", handleTouchStart);
				container.removeEventListener("touchend", handleTouchEnd);
			}
			if (userScrollTimeoutRef.current) {
				clearTimeout(userScrollTimeoutRef.current);
			}
			if (scrollStabilityTimeoutRef.current) {
				clearTimeout(scrollStabilityTimeoutRef.current);
			}
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
			}
		};
	}, [
		detectCenteredThumbnail,
		checkBoundaryPosition,
		boundaryIds,
		updateVisibleProject,
	]);

	// Handle layout changes and window resizing
	useEffect(() => {
		const handleResize = () => {
			// Force update visible project when layout changes
			const currentProject = lastVisibleProjectRef.current;
			if (currentProject) {
				// Reset all state on resize
				resetScrollState();

				// Delay to let layout stabilize
				setTimeout(() => {
					// Check boundary situation
					checkBoundaryPosition();
					scrollToThumbnail(currentProject, true);
				}, 200);
			}
		};

		window.addEventListener("resize", handleResize, { passive: true });

		// Set up ResizeObserver if supported
		if (typeof ResizeObserver !== "undefined" && containerRef.current) {
			resizeObserverRef.current = new ResizeObserver(() => {
				const currentProject = lastVisibleProjectRef.current;
				if (currentProject) {
					// Reset stability on resize
					resetScrollState();

					// Small delay to let layout stabilize
					setTimeout(() => {
						// Check boundary situation
						checkBoundaryPosition();
						scrollToThumbnail(currentProject, true);
					}, 200);
				}
			});
			resizeObserverRef.current.observe(containerRef.current);
		}

		return () => {
			window.removeEventListener("resize", handleResize);
			if (resizeObserverRef.current) {
				resizeObserverRef.current.disconnect();
			}
		};
	}, [scrollToThumbnail, resetScrollState, checkBoundaryPosition]);

	// Cleanup on unmount or data change
	useEffect(() => {
		thumbnailRefs.current.clear();
		lastVisibleProjectRef.current = null;
		retryCountRef.current = 0;
		lastUpdateTimeRef.current = 0;
		stabilityThresholdRef.current = 0;
		lastScrollPositionRef.current = 0;
		isAtBoundaryRef.current = null;
		resetScrollState();

		return () => {
			resetScrollState();
		};
	}, [sortedProjects, resetScrollState]);

	// Enhanced project opacity calculation with better contrast
	const getProjectOpacity = useCallback(
		(projectId: string, index: number) => {
			if (!projectId) return 0;

			const isVisible = projectId === visibleProject;

			// No special handling for first two items
			if (category) {
				return isVisible ? 1 : 0.6;
			}

			return isVisible ? 1 : 0.35; // Stronger contrast
		},
		[visibleProject, category],
	);

	// Optimized rendering for thumbnails
	const renderThumbnail = useCallback(
		(item: ProjectWithCategories, index: number) => {
			if (!item?._id) return null;

			const projectId = item.slug?.current || item._id;
			if (!projectId) return null;

			const isActive = projectId === visibleProject;
			const isFirst = index === 0;
			const isSecond = index === 1;
			const isLast = index === sortedProjects.length - 1;
			const isFirstOrSecond = isFirst || isSecond;

			// Use same animation values for all items, no special handling for first two
			const scaleValue = isActive ? 1.05 : 0.97;
			const yOffset = isActive ? -2 : 1;
			const filterValue = isActive ? "brightness(1.05)" : "brightness(0.95)";

			return (
				<motion.div
					key={item._id}
					ref={(el) => {
						if (el && projectId) {
							thumbnailRefs.current.set(projectId, el);
						}
					}}
					animate={{
						opacity: getProjectOpacity(projectId, index),
						scale: scaleValue,
						y: yOffset,
						filter: filterValue,
					}}
					transition={{
						duration: isFirstOrSecond ? 0.15 : 0.2,
						ease: "easeOut",
						opacity: { duration: isFirstOrSecond ? 0.1 : 0.15 },
					}}
					className={`h-full w-full ${isActive ? "z-10" : "z-0"} ${
						isFirstOrSecond ? "pr-0.5" : ""
					} will-change-transform`}
					onClick={() => {
						if (projectId) {
							resetScrollState();
							updateVisibleProject(projectId, true, true);
						}
					}}
				>
					<Thumbnail className="h-full w-full" item={item} />
				</motion.div>
			);
		},
		[
			visibleProject,
			resetScrollState,
			updateVisibleProject,
			getProjectOpacity,
			sortedProjects.length,
		],
	);

	return (
		<div
			ref={containerRef}
			className="relative mt-2 flex h-auto w-screen items-start gap-1.5 self-stretch overflow-x-auto pr-3 pb-1 md:hidden scroll-smooth will-change-scroll"
		>
			{sortedProjects.map(renderThumbnail).filter(Boolean)}
		</div>
	);
};
