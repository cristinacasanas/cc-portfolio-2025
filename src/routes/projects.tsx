import { ProjectCard } from "@/components/projects";
import { client } from "@/lib/sanity";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { Project } from "studio/sanity.types";

export const Route = createFileRoute("/projects")({
	component: ProjectsPage,
});

function ProjectsPage() {
	const { data } = useQuery({
		queryKey: ["projects"],
		queryFn: () => client.fetch<Project[]>("*[_type == 'project']"),
	});

	// Pre-generate fallback items with unique IDs
	const fallbackProjects = [
		{ id: "fallback-1" },
		{ id: "fallback-2" },
		{ id: "fallback-3" },
		{ id: "fallback-4" },
		{ id: "fallback-5" },
		{ id: "fallback-6" },
	];

	return (
		<div className="space-y-10">
			<h1 className="text-3xl font-bold">All Projects</h1>

			<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
				{data?.map((project) => (
					<div key={project._id} className="shadow rounded-lg overflow-hidden">
						<ProjectCard />
					</div>
				)) ||
					fallbackProjects.map((item) => (
						<div key={item.id} className="shadow rounded-lg overflow-hidden">
							<ProjectCard />
						</div>
					))}
			</div>
		</div>
	);
}
