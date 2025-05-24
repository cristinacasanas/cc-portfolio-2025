"use client";
import { DragAndDropView } from "./drag-and-drop.view";
import { InfiniteImageGrid } from "./lab.canvas";
import { ListView } from "./list.view";

interface LabViewProps {
	initialView?: string;
}

export default function LabView({ initialView = "canvas" }: LabViewProps) {
	const view = initialView;

	return view === "grid" ? (
		<InfiniteImageGrid />
	) : view === "list" ? (
		<ListView />
	) : (
		<DragAndDropView />
	);
}
