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
				"mt-[var(--header-height)] grid max-h-[calc(100vh-var(--header-height))] w-screen flex-1 grid-cols-4 gap-2 overflow-x-hidden px-1.5 md:grid-cols-6 md:gap-4 lg:px-3",
				className,
			)}
		>
			{children}
		</main>
	);
};
