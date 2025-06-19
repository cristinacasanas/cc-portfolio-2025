import { useCallback, useEffect, useRef, useState } from "react";

interface VisibilityEvent {
	projectId: string;
	isActive: boolean;
	visibilityRatio: number;
}

interface UseProjectVisibilityProps {
	projectId: string;
	threshold?: number;
	rootMargin?: string;
}

interface UseProjectVisibilityReturn {
	ref: React.RefObject<HTMLDivElement | null>;
	isActive: boolean;
	visibilityRatio: number;
}

export const useProjectVisibility = ({
	projectId,
	threshold = 0.5,
	rootMargin = "-20% 0px",
}: UseProjectVisibilityProps): UseProjectVisibilityReturn => {
	const ref = useRef<HTMLDivElement>(null);
	const [isActive, setIsActive] = useState(false);
	const [visibilityRatio, setVisibilityRatio] = useState(0);

	const calculateVisibility = useCallback(
		(entry: IntersectionObserverEntry) => {
			const { intersectionRatio, boundingClientRect } = entry;
			const { top, height } = boundingClientRect;

			const windowHeight = window.innerHeight;
			const elementCenter = top + height / 2;
			const windowCenter = windowHeight / 2;

			// Calculate how centered the element is (0 = edge, 1 = perfect center)
			const distanceFromCenter = Math.abs(elementCenter - windowCenter);
			const maxDistance = windowHeight / 2;
			const centrality = Math.max(0, 1 - distanceFromCenter / maxDistance);

			// Special handling for elements at the top of the page
			const isAtTopOfViewport = top >= 0 && top < windowHeight * 0.3;
			const isNearTopOfPage = window.scrollY < 200;
			const hasGoodVisibility = intersectionRatio > 0.3;

			// Bonus for elements that are well-positioned at the top
			let topBonus = 0;
			if (isAtTopOfViewport && isNearTopOfPage && hasGoodVisibility) {
				topBonus = 0.3;
			}

			// Combine intersection ratio, centrality, and top position bonus
			const finalRatio = intersectionRatio * 0.6 + centrality * 0.4 + topBonus;

			return {
				isActive: finalRatio >= threshold,
				ratio: finalRatio,
			};
		},
		[threshold],
	);

	const emitVisibilityEvent = useCallback(
		(isActive: boolean, ratio: number) => {
			const event = new CustomEvent("projectInView", {
				detail: {
					projectId,
					isActive,
					visibilityRatio: ratio,
				} satisfies VisibilityEvent,
			});
			window.dispatchEvent(event);
		},
		[projectId],
	);

	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (!entry) return;

				const { isActive: newIsActive, ratio } = calculateVisibility(entry);

				// Only update if there's a meaningful change
				if (
					newIsActive !== isActive ||
					Math.abs(ratio - visibilityRatio) > 0.1
				) {
					setIsActive(newIsActive);
					setVisibilityRatio(ratio);
					emitVisibilityEvent(newIsActive, ratio);
				}
			},
			{
				threshold: [0, 0.25, 0.5, 0.75, 1],
				rootMargin,
			},
		);

		observer.observe(element);

		return () => {
			observer.unobserve(element);
		};
	}, [
		calculateVisibility,
		emitVisibilityEvent,
		isActive,
		visibilityRatio,
		rootMargin,
	]);

	return {
		ref,
		isActive,
		visibilityRatio,
	};
};
