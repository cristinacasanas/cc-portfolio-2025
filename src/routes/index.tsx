import { createFileRoute } from "@tanstack/react-router";
import logo from "../logo.svg";
import type { Project } from "studio/sanity.types";
import { client } from "@/lib/sanity";
import { useQuery } from "@tanstack/react-query";

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
		<div className="text-center">
			{import.meta.env.VITE_SANITY_PROJECT_ID}
			<header className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white text-[calc(10px+2vmin)]">
				<img
					src={logo}
					className="h-[40vmin] pointer-events-none animate-[spin_20s_linear_infinite]"
					alt="logo"
				/>
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
			</header>
		</div>
	);
}
