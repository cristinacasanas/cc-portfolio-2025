import { Store } from "@tanstack/store";

interface ListState {
	currentGlobalSizeState: number;
	selectedId: string | number | null;
}

export const listStore = new Store<ListState>({
	currentGlobalSizeState: 0,
	selectedId: null,
});
