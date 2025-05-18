import clsx from "clsx";
import { forwardRef } from "react";

export const Sidebar = forwardRef<
	HTMLDivElement,
	{
		children: React.ReactNode;
		className?: string;
		position: "left" | "right";
		visible?: boolean;
	}
>(({ children, className, position, visible }, ref) => {
	return (
		<aside
			ref={ref}
			className={clsx(
				"z-10 col-span-1 hidden max-h-[calc(100vh-var(--header-height))] flex-col items-start justify-between overflow-y-hidden border-black px-4 pb-6 md:inline-flex",
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
});
