import { Store } from "@tanstack/store";

interface MenuMobileState {
	isOpen: boolean;
	toggle: () => void;
}

const store = new Store<MenuMobileState>({
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

export const menuMobileStore = store;
