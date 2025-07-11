import { useLanguage } from "@/hooks/useLanguage";
import { getAllCategories } from "@/lib/queries";
import { client } from "@/lib/sanity";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "@tanstack/react-router";
import clsx from "clsx";
import type { Categories } from "studio/sanity.types";
import { Sidebar } from "../sidebar";

export const CategoriesSidebar = () => {
	const { category } = useSearch({ from: "/" });
	const { getLocalizedContent } = useLanguage();

	const { data } = useQuery({
		queryKey: ["categories"],
		queryFn: () => client.fetch<Categories[]>(getAllCategories),
		staleTime: 30 * 60 * 1000, // 30 minutes - les catégories changent rarement
		gcTime: 4 * 60 * 60 * 1000, // 4 heures
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

	const { data: networkData } = useQuery({
		queryKey: ["network"],
		queryFn: () => client.fetch(`*[_type == "network"][0] {_id, links}`),
		staleTime: 60 * 60 * 1000, // 1 heure - les données réseau changent très rarement
		gcTime: 8 * 60 * 60 * 1000, // 8 heures
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

	return (
		<Sidebar position="left" className="px-0 lg:px-4">
			<div className="flex flex-1 flex-col items-start justify-between pt-14">
				<div className="flex flex-col items-start justify-start gap-20">
					<div className="flex flex-col items-start justify-start gap-4">
						<h3 className="justify-start font-serif leading-none">
							Catégories
						</h3>
						<div className="flex flex-col items-start justify-start gap-4 pl-4 font-mono text-[10px] text-text-secondary">
							<Link
								to="/"
								className={clsx(
									"justify-start text-sm uppercase leading-none",
									!category ? "text-text-primary" : "text-text-secondary",
								)}
							>
								Tous
							</Link>

							{data?.map((categoryItem) => (
								<Link
									key={categoryItem._id}
									to="/"
									search={{
										category: categoryItem.slug?.current || categoryItem._id,
									}}
									className={clsx(
										"justify-start text-sm uppercase leading-none",
										category ===
											(categoryItem.slug?.current || categoryItem._id)
											? "text-text-primary"
											: "text-text-secondary",
									)}
								>
									{getLocalizedContent(
										categoryItem.title?.fr || "",
										categoryItem.title?.en || "",
									)}
								</Link>
							))}
						</div>
					</div>
				</div>
				<div className="flex flex-col items-start justify-start gap-4 font-serif">
					{networkData?.links?.map((link: { title: string; url: string }) => (
						<a
							key={link.url}
							href={link.url}
							target={link.url.startsWith("http") ? "_blank" : undefined}
							rel={
								link.url.startsWith("http") ? "noopener noreferrer" : undefined
							}
							className="justify-start font-normal text-color-black-solid leading-none"
						>
							↗ {link.title}
						</a>
					))}
				</div>
			</div>
		</Sidebar>
	);
};
