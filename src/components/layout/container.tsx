import { clsx } from "clsx";

export const Container = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => {
	return (
		<main
			className={clsx(
				"relative block md:grid grid-cols-4 md:grid-cols-6 gap-2 md:gap-4",
				"w-screen overflow-x-hidden overflow-y-hidden",
				"pt-[var(--header-height)] md:pb-0",
				"h-[100dvh] max-h-[100dvh]",
				"px-1.5 lg:px-3",
				className,
			)}
			style={
				{
					"--header-height": "42px",
					"--mobile-thumbnails-bar-height": "50px",
					"--filter-menu-bar-height": "85px",
				} as React.CSSProperties
			}
		>
			{children}
		</main>
	);
};
