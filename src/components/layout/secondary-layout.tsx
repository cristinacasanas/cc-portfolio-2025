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
				"mt-[var(--header-height)] w-full max-h-[calc(100vh-var(--header-height))] overflow-y-auto",
				className,
			)}
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{children}
			</div>
		</div>
	);
};
