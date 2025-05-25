import { Store } from "@tanstack/store";

interface MenuMobileState {
	isOpen: boolean;
	toggle: () => void;
	close: () => void;
}

// Define a type for the filter menu store
interface FilterMenuStoreType {
	state: {
		isOpen: boolean;
		toggle: () => void;
		close: () => void;
	};
}

// Define a type for the overlay store
interface OverlayStoreType {
	state: {
		isOpen: boolean;
		toggle: () => void;
		close: () => void;
	};
}

const store = new Store<MenuMobileState>({
	isOpen: false,
	toggle: () => {},
	close: () => {},
});

// We'll import the filterMenuStore after it's created to avoid circular dependencies
let filterMenuStore: FilterMenuStoreType | null = null;
let overlayStore: OverlayStoreType | null = null;

// Import dynamically to avoid circular dependencies
const importFilterMenuStore = async () => {
	if (!filterMenuStore) {
		const module = await import("./filter-menu.store");
		filterMenuStore = module.filterMenuStore;
	}
	return filterMenuStore;
};

// Import overlay store dynamically
const importOverlayStore = async () => {
	if (!overlayStore) {
		const module = await import("./overlay.store");
		overlayStore = module.overlayStore;
	}
	return overlayStore;
};

const toggleImpl = async () => {
	// Close filter menu if it's open
	const filterStore = await importFilterMenuStore();
	if (filterStore?.state.isOpen) {
		filterStore.state.close();
	}

	store.setState((prev) => ({
		...prev,
		isOpen: !prev.isOpen,
	}));
};

const closeImpl = async () => {
	// Check if filter menu is not open before closing overlay
	const filterStore = await importFilterMenuStore();
	const overlay = await importOverlayStore();

	// Only close overlay if filter menu is not open
	if (!filterStore?.state.isOpen && overlay?.state.isOpen) {
		overlay.state.close();
	}

	store.setState((prev) => ({
		...prev,
		isOpen: false,
	}));
};

store.setState((prev) => ({
	...prev,
	toggle: toggleImpl,
	close: closeImpl,
}));

export const menuMobileStore = store;
