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
		<div className="w-full bg-background-primary text-center">
			<p>
				Edit <code>src/routes/index.tsx</code> and save to reload.
			</p>
			<a
				className="text-[#61dafb] hover:underline"
				href="https://reactjs.org"
				target="_blank"
				rel="noopener noreferrer"
			>
				Learn React
			</a>
			<a
				className="text-[#61dafb] hover:underline"
				href="https://tanstack.com"
				target="_blank"
				rel="noopener noreferrer"
			>
				Learn TanStack
			</a>

			<p className="font-serif">
				Deserunt in duis non mollit laboris. Anim officia sit ex qui Lorem
				laborum. Sint eiusmod veniam dolor irure ad est. Dolor consectetur
				voluptate excepteur. Minim aliqua mollit nisi dolore nisi. Cillum ex
				excepteur non reprehenderit magna pariatur adipisicing occaecat amet
				deserunt excepteur consectetur duis. Quis consequat voluptate esse irure
				eiusmod adipisicing Lorem. Cillum dolore aute duis magna minim dolore ex
				Lorem.
			</p>
		</div>
	);
}
