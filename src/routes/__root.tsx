import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { Header } from "@/components/layout/header";
import TanstackQueryLayout from "../integrations/tanstack-query/layout";

import { AboutModal } from "@/components/about.modal";
import { Container } from "@/components/layout/container";
import { CategoriesSidebar } from "@/components/layout/sidebar/categories.sidebar";
import { ThumbnailsSidebar } from "@/components/layout/sidebar/thumbnails.sidebar";
import type { QueryClient } from "@tanstack/react-query";
interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: () => (
		<div className="flex h-screen flex-col">
			<Header />
			<AboutModal />
			<Container>
				<CategoriesSidebar />
				<Outlet />
				<ThumbnailsSidebar />
			</Container>

			<TanStackRouterDevtools />

			<TanstackQueryLayout />
		</div>
	),
});
