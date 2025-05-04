import { Store } from "@tanstack/store";

interface AboutState {
	isOpen: boolean;
	toggle: () => void;
}

// Créer le store avec un état initial
const store = new Store<AboutState>({
	isOpen: false,
	toggle: () => {}, // Sera défini après
});

// Définir la méthode toggle
const toggleImpl = () => {
	store.setState((prev) => ({
		...prev,
		isOpen: !prev.isOpen,
	}));
};

// Assigner la vraie implémentation
store.setState((prev) => ({
	...prev,
	toggle: toggleImpl,
}));

export const aboutStore = store;
