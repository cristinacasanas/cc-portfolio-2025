import { ProjectCard } from "@/components/projects";
import {
	getAllProjects,
	getProjectById,
	getProjectsByCategory,
} from "@/lib/queries";
import { client } from "@/lib/sanity";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import type { Categories, Projects } from "studio/sanity.types";

type ProjectWithCategories = Projects & {
	expandedCategories?: Categories[];
};

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

	const { data } = useQuery({
		queryKey: ["projects", { category, project }],
		queryFn: async () => {
			if (project) {
				const projectData = await client.fetch<ProjectWithCategories[]>(
					getProjectById(project),
				);
				return projectData;
			}

			if (category) {
				const results = await client.fetch<ProjectWithCategories[]>(
					getProjectsByCategory(category),
				);
				return results;
			}

			const results =
				await client.fetch<ProjectWithCategories[]>(getAllProjects);
			return results;
		},
	});

	return (
		<div className="col-span-4 flex h-[100dvh] flex-col gap-10 overflow-y-auto bg-background-primary pb-8 md:h-[calc(100dvh-var(--header-height))] md:gap-20">
			{data &&
				data.length > 0 &&
				data.map((project) => (
					<ProjectCard key={project._id} project={project} />
				))}
		</div>
	);
}
