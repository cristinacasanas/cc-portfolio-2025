import { Header } from "@/components/layout/header";
import { Overlay } from "@/components/ui/overlay";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import TanstackQueryLayout from "../integrations/tanstack-query/layout";

import { AboutModal } from "@/components/about.modal";
import { FilterMenu } from "@/components/filter.menu";
import { Container } from "@/components/layout/container";
import { MenuMobile } from "@/components/layout/menu.mobile";
import { CategoriesSidebar } from "@/components/layout/sidebar/categories.sidebar";
import { ThumbnailsSidebar } from "@/components/layout/sidebar/thumbnails.sidebar";
import { MobileThumbnails } from "@/components/mobile.thumbnails";
import type { QueryClient } from "@tanstack/react-query";
interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: () => (
		<div className="flex h-screen flex-col">
			<Header />
			<MenuMobile />
			<FilterMenu />
			<AboutModal />
			<Container>
				<MobileThumbnails />
				<CategoriesSidebar />
				<Outlet />
				<ThumbnailsSidebar />
			</Container>

			<TanStackRouterDevtools />

			<TanstackQueryLayout />
			<Overlay />
		</div>
	),
});
