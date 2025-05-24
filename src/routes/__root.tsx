import {
	Outlet,
	createRootRouteWithContext,
	useMatches,
} from "@tanstack/react-router";

import { AboutModal } from "@/components/about.modal";
import { FilterMenu } from "@/components/filter.menu";
import { Header } from "@/components/layout/header";
import { MenuMobile } from "@/components/layout/menu.mobile";
import { MobileThumbnails } from "@/components/mobile.thumbnails";
import { Overlay } from "@/components/ui/overlay";
import { CategoriesSidebar } from "@/components/layout/sidebar/categories.sidebar";
import { ThumbnailsSidebar } from "@/components/layout/sidebar/thumbnails.sidebar";
import { Container } from "@/components/layout/container";

import type { QueryClient } from "@tanstack/react-query";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: () => {
		const matches = useMatches();
		const isIndexRouteActive = matches.some((match) => match.routeId === "/");

		return (
			<div className="flex h-dvh flex-col">
				<Header />
				<MenuMobile />
				{isIndexRouteActive && <FilterMenu />}
				<AboutModal />

				<Container>
					{isIndexRouteActive && <MobileThumbnails />}
					{isIndexRouteActive && <CategoriesSidebar />}
					<Outlet />
					{isIndexRouteActive && <ThumbnailsSidebar />}
				</Container>

				{/* 		<TanStackRouterDevtools />
				<TanstackQueryLayout /> */}
				<Overlay />
			</div>
		);
	},
});
