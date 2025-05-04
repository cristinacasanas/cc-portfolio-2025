import clsx from "clsx";

type AspectRatio = "16/9" | "4/3" | "1/1" | "3/4" | "9/16";

type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
	ratio?: AspectRatio;
	className?: string;
};

export const Image = ({ ratio, className, ...props }: ImageProps) => {
	return (
		<img
			className={clsx("w-full", ratio, className)}
			{...props}
			alt={props.alt}
		/>
	);
};
