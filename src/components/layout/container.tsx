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
				"relative flex flex-col block md:grid grid-cols-4 md:grid-cols-6 gap-2 md:gap-4",
				"w-screen overflow-x-hidden",
				"overflow-y-hidden md:overflow-y-hidden", // Permet le scroll vertical sur mobile
				"pt-[var(--header-height)] md:pb-0",
				"min-h-[100dvh] md:h-[100dvh] md:max-h-[100dvh]", // min-height sur mobile au lieu de height fixe
				"px-1.5 lg:px-3",
				className,
			)}
		>
			{children}
		</main>
	);
};
