"use client";
import { useSearch } from "@tanstack/react-router";
import { DragAndDropView } from "./drag-and-drop.view";
import { InfiniteImageGrid } from "./lab.canvas";
import { ListView } from "./list.view";

export default function LabView() {
	const { view } = useSearch({ from: "/lab" });

	return view === "grid" ? (
		<InfiniteImageGrid />
	) : view === "list" ? (
		<ListView />
	) : (
		<DragAndDropView />
	);
}
