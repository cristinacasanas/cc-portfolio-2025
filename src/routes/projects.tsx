import { ProjectCard } from "@/components/projects";
import { client } from "@/lib/sanity";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { Projects } from "studio/sanity.types";

export const Route = createFileRoute("/projects")({
	component: ProjectsPage,
	validateSearch: (search: Record<string, unknown>) => {
		const lang = search?.lang?.toString() || "fr";
		return {
			lang: lang === "en" || lang === "fr" ? lang : "fr",
		};
	},
});

function ProjectsPage() {
	const { data } = useQuery({
		queryKey: ["projects"],
		queryFn: () => client.fetch<Projects[]>("*[_type == 'project']"),
	});

	return (
		<div className="space-y-10">
			<h1 className="font-bold text-3xl">All Projects</h1>

			<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
				{data?.map((project) => (
					<div key={project._id} className="overflow-hidden rounded-lg shadow">
						<ProjectCard project={project} />
					</div>
				))}
			</div>
		</div>
	);
}
