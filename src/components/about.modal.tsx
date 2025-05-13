import { Image } from "@/components/ui/image";
import { client, urlFor } from "@/lib/sanity";
import { aboutStore } from "@/stores/about.store";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
// Define custom components for the PortableText renderer
const portableTextComponents: Partial<PortableTextComponents> = {
	block: {
		// Default paragraph style
		normal: ({ children }) => (
			<p className="font-mono text-[10px] uppercase leading-[15px] mb-2">
				{children}
			</p>
		),
		// Any other block styles you might have
		h1: ({ children }) => (
			<h1 className="font-serif text-[12px] leading-tight mb-2">{children}</h1>
		),
		h2: ({ children }) => (
			<h2 className="font-serif text-[11px] leading-tight mb-2">{children}</h2>
		),
	},
	marks: {
		// Custom renderer for emphasized text
		em: ({ children }) => (
			<em className="font-mono text-[10px] text-text-secondary uppercase leading-[15px] italic">
				{children}
			</em>
		),
		// Custom renderer for links
		link: ({ value, children }) => {
			const target = (value?.href || "").startsWith("http")
				? "_blank"
				: undefined;
			return (
				<a
					href={value?.href}
					target={target}
					rel={target === "_blank" ? "noindex nofollow" : undefined}
					className="font-mono text-[10px] text-text-secondary uppercase leading-[15px] underline"
				>
					{children}
				</a>
			);
		},
	},
};

export const AboutModal = () => {
	const { isOpen } = useStore(aboutStore, (state) => state);
	const { data } = useQuery({
		queryKey: ["about"],
		queryFn: () => client.fetch(`*[_type == "about"]`),
	});
	const { t } = useTranslation();

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ x: -100, opacity: 0 }}
					animate={{ x: 0, opacity: 1 }}
					exit={{ x: -100, opacity: 0 }}
					transition={{ duration: 0.3 }}
					className="absolute top-[var(--header-height)] left-0 z-50 inline-flex h-[calc(100dvh-var(--header-height))] w-screen flex-col items-start justify-between border-black border-r bg-background-primary/80 pt-14 pr-2 pb-6 pl-4 backdrop-blur-sm md:w-[455px]"
				>
					<div className="flex flex-col-reverse md:flex-row flex-1 items-start gap-6 md:gap-0 justify-between self-stretch">
						<div className="inline-flex flex-1 md:flex-0 flex-col items-start justify-between self-stretch">
							<div className="flex flex-col items-start justify-start gap-20">
								<div className="flex w-80 flex-col items-start justify-start gap-2">
									<h2 className="justify-start font-normal font-serif leading-none">
										{t("aboutModal.title")}
									</h2>
									<div className="flex flex-col items-start justify-start gap-6 self-stretch pl-4">
										<div>
											{data?.[0]?.description ? (
												<PortableText
													value={data[0].description}
													components={portableTextComponents}
												/>
											) : null}
										</div>
									</div>
								</div>
								<div className="flex flex-col items-start justify-start gap-2">
									<h2 className="font-normal font-serif leading-none">
										{t("aboutModal.awards")}
									</h2>
									<div className="flex flex-col gap-2 pl-4">
										<div className="justify-start">
											<span className="font-mono text-[10px] text-text-secondary uppercase leading-none">
												↗{" "}
											</span>
											<Link
												className="font-mono text-[10px] text-text-secondary uppercase leading-none underline"
												to={data?.[0]?.awards?.[0]?.url}
											>
												{data?.[0]?.awards?.[0]?.url}
											</Link>
										</div>
									</div>
								</div>
							</div>
							<div className="flex h-20 flex-col justify-between">
								<Link className="font-serif text-[10px] leading-none" to="/">
									↗ Instagram
								</Link>
								<Link className="font-serif text-[10px] leading-none" to="/">
									↗ Cosmos
								</Link>
								<Link className="font-serif text-[10px] leading-none" to="/">
									↗ Mail
								</Link>
							</div>
						</div>
						<div className="w-full md:w-auto flex justify-end">
							<Image
								className="h-[125px] w-[100px] p-0.5"
								src={
									data?.[0]?.image
										? urlFor(data[0].image).url()
										: "/assets/image.png"
								}
								alt="Portrait de Cristina"
							/>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};
