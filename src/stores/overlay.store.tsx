import { Store } from "@tanstack/store";

interface OverlayState {
	isOpen: boolean;
	toggle: () => void;
	close: () => void;
}

const store = new Store<OverlayState>({
	isOpen: false,
	toggle: () => {},
	close: () => {},
});

const toggleImpl = () => {
	store.setState((prev) => ({
		...prev,
		isOpen: !prev.isOpen,
	}));
};

const closeImpl = () => {
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

export const overlayStore = store;
