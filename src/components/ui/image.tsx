import clsx from "clsx";

type AspectRatio = "16/9" | "4/3" | "1/1" | "3/4" | "9/16" | "4/5";

type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
	ratio?: AspectRatio;
	className?: string;
};

export const Image = ({ ratio, className, ...props }: ImageProps) => {
	return (
		<img
			className={clsx(
				`aspect-[${ratio}] w-auto h-auto object-cover`,
				className,
			)}
			{...props}
			alt={props.alt}
		/>
	);
};
