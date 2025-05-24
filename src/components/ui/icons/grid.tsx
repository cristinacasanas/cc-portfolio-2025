import type React from "react";

export const Grid: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
	return (
		<svg
			width="24"
			height="25"
			viewBox="0 0 24 25"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-label="Grid"
			role="img"
			{...props}
		>
			<g opacity="0.4">
				<rect
					x="0.272727"
					y="0.772727"
					width="6"
					height="6"
					stroke="black"
					stroke-width="0.545455"
				/>
				<rect
					x="17.7278"
					y="0.772727"
					width="6"
					height="6"
					stroke="black"
					stroke-width="0.545455"
				/>
				<rect
					x="0.272727"
					y="18.2273"
					width="6"
					height="6"
					stroke="black"
					stroke-width="0.545455"
				/>
				<rect
					x="17.7278"
					y="18.2273"
					width="6"
					height="6"
					stroke="black"
					stroke-width="0.545455"
				/>
			</g>
		</svg>
	);
};

export default Grid;
