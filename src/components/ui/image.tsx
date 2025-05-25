import clsx from "clsx";
import { useState } from "react";

type AspectRatio = "16/9" | "4/3" | "1/1" | "3/4" | "9/16" | "4/5";

export type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
	ratio?: AspectRatio;
	className?: string;
};

export const Image = ({ ratio, className, src, alt, ...props }: ImageProps) => {
	const [hasError, setHasError] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const handleError = () => {
		setHasError(true);
		setIsLoading(false);
	};

	const handleLoad = () => {
		setIsLoading(false);
	};

	if (!src || hasError) {
		return (
			<div
				className={clsx(
					`aspect-[${ratio}] flex h-auto items-center justify-center bg-gray-200`,
					className,
				)}
				role="img"
				aria-label={alt || "Image non disponible"}
			>
				<span className="text-gray-400 text-xs">Image non disponible</span>
			</div>
		);
	}

	return (
		<>
			{isLoading && (
				<div
					className={clsx(
						`aspect-[${ratio}] h-auto animate-pulse bg-gray-100`,
						className,
					)}
					role="img"
					aria-label="Chargement de l'image..."
				/>
			)}
			<img
				className={clsx(
					`aspect-[${ratio}] h-auto object-cover`,
					isLoading ? "hidden" : "block",
					className,
				)}
				src={src}
				alt={alt || "Image"}
				onError={handleError}
				onLoad={handleLoad}
				{...props}
			/>
		</>
	);
};
