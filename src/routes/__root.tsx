import { Header } from "@/components/layout/header";
import { Overlay } from "@/components/ui/overlay";
import {
	Outlet,
	createRootRouteWithContext,
	useMatches,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import TanstackQueryLayout from "../integrations/tanstack-query/layout";

import { AboutModal } from "@/components/about.modal";
import { FilterMenu } from "@/components/filter.menu";
import { Container } from "@/components/layout/container";
import { MenuMobile } from "@/components/layout/menu.mobile";
import { SecondaryLayout } from "@/components/layout/secondary-layout";
import { CategoriesSidebar } from "@/components/layout/sidebar/categories.sidebar";
import { ThumbnailsSidebar } from "@/components/layout/sidebar/thumbnails.sidebar";
import { MobileThumbnails } from "@/components/mobile.thumbnails";
import type { QueryClient } from "@tanstack/react-query";
interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: () => {
		const matches = useMatches();
		const isHomePage = matches.some((match) => match.routeId === "/");

		return (
			<div className="min-h-dvh">
				<Header />
				<MenuMobile />
				<FilterMenu />
				<AboutModal />

				{isHomePage ? (
					<Container>
						<MobileThumbnails />
						<CategoriesSidebar />
						<Outlet />
						<ThumbnailsSidebar />
					</Container>
				) : (
					<SecondaryLayout>
						<Outlet />
					</SecondaryLayout>
				)}

				<TanStackRouterDevtools />
				<TanstackQueryLayout />
				<Overlay />
			</div>
		);
	},
});
