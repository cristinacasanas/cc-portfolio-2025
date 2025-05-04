import { ProjectCard } from "@/components/projects";
import { client } from "@/lib/sanity";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { Project } from "studio/sanity.types";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	const { data } = useQuery({
		queryKey: ["projects"],
		queryFn: () => client.fetch<Project[]>("*[_type == 'project']"),
	});

	console.log(data);

	return (
		<div className="col-span-4 flex flex-col gap-10 md:gap-20 overflow-y-auto bg-background-primary">
			<ProjectCard />
			<ProjectCard />
			<ProjectCard />
			<ProjectCard />
			<ProjectCard />
			<ProjectCard />
		</div>
	);
}
