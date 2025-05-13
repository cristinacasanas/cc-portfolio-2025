import { clsx } from "clsx";

export const SecondaryLayout = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => {
	return (
		<div
			className={clsx(
				"mt-[var(--header-height)] max-h-[calc(100vh-var(--header-height))] w-full overflow-y-auto",
				className,
			)}
		>
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				{children}
			</div>
		</div>
	);
};
