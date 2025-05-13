import { Store } from "@tanstack/store";

interface OverlayState {
	isOpen: boolean;
	toggle: () => void;
}

const store = new Store<OverlayState>({
	isOpen: false,
	toggle: () => {},
});

const toggleImpl = () => {
	store.setState((prev) => ({
		...prev,
		isOpen: !prev.isOpen,
	}));
};

store.setState((prev) => ({
	...prev,
	toggle: toggleImpl,
}));

export const overlayStore = store;
