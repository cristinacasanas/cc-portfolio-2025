import type React from "react";

interface GridIconProps extends React.SVGProps<SVGSVGElement> {
	isActive?: boolean;
}

export const Grid: React.FC<GridIconProps> = ({
	isActive = false,
	...props
}) => {
	return isActive ? (
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-label="Grid inactive"
			role="img"
			{...props}
		>
			<rect width="6.54545" height="6.54545" fill="black" />
			<rect x="17.4546" width="6.54545" height="6.54545" fill="black" />
			<rect y="17.4545" width="6.54545" height="6.54545" fill="black" />
			<rect
				x="17.4546"
				y="17.4545"
				width="6.54545"
				height="6.54545"
				fill="black"
			/>
		</svg>
	) : (
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-label="Grid active"
			role="img"
			{...props}
		>
			<rect
				x="0.272727"
				y="0.272727"
				width="6"
				height="6"
				stroke="black"
				stroke-width="0.545455"
			/>
			<rect
				x="17.7273"
				y="0.272727"
				width="6"
				height="6"
				stroke="black"
				stroke-width="0.545455"
			/>
			<rect
				x="0.272727"
				y="17.7273"
				width="6"
				height="6"
				stroke="black"
				stroke-width="0.545455"
			/>
			<rect
				x="17.7273"
				y="17.7273"
				width="6"
				height="6"
				stroke="black"
				stroke-width="0.545455"
			/>
		</svg>
	);
};

export default Grid;
