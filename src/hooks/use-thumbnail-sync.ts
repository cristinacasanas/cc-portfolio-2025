import { useCallback, useEffect, useRef, useState } from "react";

interface ThumbnailSyncProps {
	onActiveProjectChange?: (projectId: string) => void;
	debounceMs?: number;
}

interface VisibilityEventDetail {
	projectId: string;
	isActive: boolean;
	visibilityRatio: number;
}

export const useThumbnailSync = ({
	onActiveProjectChange,
	debounceMs = 150,
}: ThumbnailSyncProps = {}) => {
	const [activeProject, setActiveProject] = useState<string | null>(null);
	const debounceRef = useRef<NodeJS.Timeout | null>(null);
	const lastProjectRef = useRef<string | null>(null);

	const handleProjectChange = useCallback(
		(projectId: string) => {
			// Debounce rapid changes
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}

			debounceRef.current = setTimeout(() => {
				if (lastProjectRef.current !== projectId) {
					lastProjectRef.current = projectId;
					setActiveProject(projectId);
					onActiveProjectChange?.(projectId);
				}
			}, debounceMs);
		},
		[onActiveProjectChange, debounceMs],
	);

	useEffect(() => {
		const handleVisibilityEvent = (event: Event) => {
			const customEvent = event as CustomEvent<VisibilityEventDetail>;
			const { projectId, isActive, visibilityRatio } = customEvent.detail;

			// Lower threshold when near top of page for better first project detection
			const isNearTopOfPage = window.scrollY < 200;
			const minimumVisibilityThreshold = isNearTopOfPage ? 0.4 : 0.6;

			// Only react to active projects with appropriate visibility
			if (isActive && visibilityRatio > minimumVisibilityThreshold) {
				handleProjectChange(projectId);
			}
		};

		window.addEventListener("projectInView", handleVisibilityEvent);

		return () => {
			window.removeEventListener("projectInView", handleVisibilityEvent);
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, [handleProjectChange]);

	return {
		activeProject,
		setActiveProject: handleProjectChange,
	};
};
