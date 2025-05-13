import { Store } from "@tanstack/store";

interface AboutState {
	isOpen: boolean;
	toggle: () => void;
}

const store = new Store<AboutState>({
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

export const aboutStore = store;
