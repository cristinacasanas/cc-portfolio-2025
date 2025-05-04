import clsx from "clsx";

export const Sidebar = ({
	children,
	className,
	position,
	visible,
}: {
	children: React.ReactNode;
	className?: string;
	position: "left" | "right";
	visible?: boolean;
}) => {
	return (
		<aside
			className={clsx(
				"z-10 col-span-1 hidden max-h-[calc(100vh-var(--header-height))] flex-col items-start justify-between border-black px-4 pb-6 md:inline-flex",
				position === "left" && "border-r",
				position === "right" && "border-l",
				position === "left" && "pl-4",
				position === "right" && "pr-4",
				visible && "inline-flex",
				className,
			)}
		>
			{children}
		</aside>
	);
};
