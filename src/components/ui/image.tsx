import clsx from "clsx";
import { useState } from "react";

type AspectRatio = "16/9" | "4/3" | "1/1" | "3/4" | "9/16" | "4/5";

const aspectRatioClasses: Record<AspectRatio, string> = {
	"16/9": "aspect-video",
	"4/3": "aspect-[4/3]",
	"1/1": "aspect-square",
	"3/4": "aspect-[3/4]",
	"9/16": "aspect-[9/16]",
	"4/5": "aspect-[4/5]",
};

export type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
	ratio?: AspectRatio;
	className?: string;
};

export const Image = ({ ratio, className, src, alt, ...props }: ImageProps) => {
	const [hasError, setHasError] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const aspectClass = ratio ? aspectRatioClasses[ratio] : "";

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
					aspectClass,
					"flex h-auto items-center justify-center bg-gray-200",
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
						aspectClass,
						"h-auto animate-pulse bg-gray-100",
						className,
					)}
					role="img"
					aria-label="Chargement de l'image..."
				/>
			)}
			<img
				className={clsx(
					aspectClass,
					"h-auto object-cover",
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
