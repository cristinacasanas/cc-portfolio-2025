import { ProjectCard } from "@/components/projects";
import { useProjects } from "@/hooks/use-projects";
import { createFileRoute, useSearch } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: App,
	validateSearch: (search: Record<string, unknown>) => {
		const category = search?.category?.toString() || "";
		const project = search?.project?.toString() || "";

		const result: Record<string, string> = {};
		if (category) result.category = category;
		if (project) result.project = project;

		return result;
	},
});

function App() {
	const { category, project } = useSearch({ from: "/" });

	const { data } = useProjects({ category, project });

	return (
		<div className="col-span-4 flex h-[100dvh] flex-col gap-10 overflow-y-auto bg-background-primary pb-[calc(85px+24px)] md:h-[calc(100dvh-var(--header-height))] md:gap-20">
			{data &&
				data.length > 0 &&
				data.map((project) => (
					<ProjectCard key={project._id} project={project} />
				))}
		</div>
	);
}
