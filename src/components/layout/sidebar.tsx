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
				"z-10 col-span-1 hidden h-full flex-col items-start justify-between border-black md:inline-flex",
				"overflow-y-auto",
				position === "left" && "border-r",
				position === "right" && "border-l",
				position === "left" && "pb-6",
				position === "right" && "pr-4",
				visible && "inline-flex",
				className,
			)}
		>
			{children}
		</aside>
	);
});
