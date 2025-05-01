import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { Header } from "@/components/layout/header";
import TanstackQueryLayout from "../integrations/tanstack-query/layout";

import { Container } from "@/components/layout/container";
import type { QueryClient } from "@tanstack/react-query";
interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: () => (
		<div className="flex h-screen flex-col">
			<Header />

			<Container>
				<Outlet />
			</Container>

			<TanStackRouterDevtools />

			<TanstackQueryLayout />
		</div>
	),
});
