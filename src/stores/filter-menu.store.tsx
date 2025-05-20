import { Store } from "@tanstack/store";

export interface FilterMenuState {
	isOpen: boolean;
	toggle: () => void;
	close: () => void;
}

// Define a type for the menu mobile store
interface MenuMobileStoreType {
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

const store = new Store<FilterMenuState>({
	isOpen: false,
	toggle: () => {},
	close: () => {},
});

// We'll import the menuMobileStore after it's created to avoid circular dependencies
let menuMobileStore: MenuMobileStoreType | null = null;
let overlayStore: OverlayStoreType | null = null;

// Import dynamically to avoid circular dependencies
const importMenuMobileStore = async () => {
	if (!menuMobileStore) {
		const module = await import("./menu-mobile.store");
		menuMobileStore = module.menuMobileStore;
	}
	return menuMobileStore;
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
	// Close mobile menu if it's open before toggling filter menu
	const mobileStore = await importMenuMobileStore();
	if (mobileStore?.state.isOpen) {
		mobileStore.state.close();
	}

	store.setState((prev) => ({
		...prev,
		isOpen: !prev.isOpen,
	}));
};

const closeImpl = async () => {
	// Check if menu mobile is not open before closing overlay
	const mobileStore = await importMenuMobileStore();
	const overlay = await importOverlayStore();

	// Only close overlay if mobile menu is not open
	if (!mobileStore?.state.isOpen && overlay?.state.isOpen) {
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

export const filterMenuStore = store;
