type ScrollOptions = {
	behavior?: ScrollBehavior;
	offset?: number;
};

const defaultOptions: ScrollOptions = {
	behavior: "smooth",
	offset: -100, // Ajustement par défaut pour tenir compte du header et des thumbnails
};

const projectRefs = new Map<string, HTMLElement>();

export function registerProject(projectId: string, element: HTMLElement) {
	projectRefs.set(projectId, element);
}

export function unregisterProject(projectId: string) {
	projectRefs.delete(projectId);
}

export function scrollToProject(
	projectId: string,
	options: ScrollOptions = {},
) {
	// Essayer d'abord d'obtenir l'élément à partir de notre Map
	let element = projectRefs.get(projectId);

	// Si l'élément n'est pas trouvé dans notre Map, essayer de le trouver dans le DOM
	if (!element) {
		console.log(
			`[SCROLL_SERVICE] Élément non trouvé dans la Map pour ${projectId}, recherche dans le DOM...`,
		);
		const elements = document.querySelectorAll(
			`[data-project-id="${projectId}"]`,
		);
		if (elements.length > 0) {
			element = elements[0] as HTMLElement;
			// Enregistrer l'élément pour les futurs appels
			registerProject(projectId, element);
			console.log(
				`[SCROLL_SERVICE] Élément trouvé dans le DOM et enregistré pour ${projectId}`,
			);
		} else {
			console.error(
				`[SCROLL_SERVICE] Aucun élément trouvé pour le projet ${projectId}`,
			);
			return;
		}
	}

	const { behavior, offset } = { ...defaultOptions, ...options };

	// Utiliser directement scrollIntoView pour une meilleure compatibilité
	element.scrollIntoView({
		behavior: behavior,
		block: "start",
	});

	// Appliquer l'offset si nécessaire
	if (offset) {
		setTimeout(() => {
			window.scrollBy({
				top: offset,
				behavior: "auto",
			});
		}, 100);
	}

	console.log(
		`[SCROLL_SERVICE] Défilement vers le projet ${projectId} effectué`,
	);
}

export function getCurrentProject(): string | null {
	let currentProject: { id: string; distance: number } | null = null;

	projectRefs.forEach((element, id) => {
		const rect = element.getBoundingClientRect();
		const distance = Math.abs(rect.top);

		if (!currentProject || distance < currentProject.distance) {
			currentProject = { id: id, distance };
		}
	});

	return currentProject ? currentProject : null;
}

export function clear(): void {
	projectRefs.clear();
}
